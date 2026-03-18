/**
 * API key authentication for /api/v1/* endpoints.
 *
 * Usage:
 *   const { ctx, error } = await requireApiAuth(request)
 *   if (error) return error
 *   // ctx.orgId, ctx.tier, ctx.keyId available
 */

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getApiKeyByHash, touchApiKey } from "@/db/queries";
import { db } from "@/db/index";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "./rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type ApiScope = "read" | "write" | "admin";

interface ApiContext {
  orgId: string;
  tier: string;
  keyId: string;
  rateLimitPerMin: number;
  scopes: string[];
}

export function requireScope(ctx: { scopes?: string[] }, scope: ApiScope): boolean {
  const keyScopes = ctx.scopes ?? ["read"];
  // admin has all permissions
  if (keyScopes.includes("admin")) return true;
  // write includes read
  if (scope === "read" && keyScopes.includes("write")) return true;
  return keyScopes.includes(scope);
}

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Shared Redis instance for API key rate limiting
const sharedRedis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Cache rate limiters by rate to avoid creating new instances per request
const limiterCache = new Map<number, Ratelimit>();

function getKeyLimiter(ratePerMin: number): Ratelimit | null {
  if (!sharedRedis) return null;
  const existing = limiterCache.get(ratePerMin);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis: sharedRedis,
    limiter: Ratelimit.slidingWindow(ratePerMin, "1 m"),
    analytics: true,
    prefix: "cortex:v1",
  });
  limiterCache.set(ratePerMin, limiter);
  return limiter;
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function requireApiAuth(
  request: Request
): Promise<{ ctx: ApiContext | null; error: NextResponse | null }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ctx: null,
      error: NextResponse.json(
        {
          error: "Missing or invalid Authorization header. Use: Bearer <api_key>",
          docs: "/docs",
        },
        { status: 401 }
      ),
    };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey || !rawKey.startsWith("ctx_")) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: "Invalid API key format. Keys start with ctx_" },
        { status: 401 }
      ),
    };
  }

  const keyHash = hashKey(rawKey);
  const apiKey = await getApiKeyByHash(keyHash);

  if (!apiKey) {
    return {
      ctx: null,
      error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }

  if (!apiKey.isActive) {
    return {
      ctx: null,
      error: NextResponse.json({ error: "API key has been revoked" }, { status: 401 }),
    };
  }

  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return {
      ctx: null,
      error: NextResponse.json({ error: "API key has expired" }, { status: 401 }),
    };
  }

  // Get org tier
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, apiKey.orgId),
    columns: { tier: true },
  });

  const tier = org?.tier ?? "free";

  // Check API access for tier
  if (tier === "free" || tier === "scout_individual") {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: "API access requires club_professional tier or higher" },
        { status: 403 }
      ),
    };
  }

  // Rate limit
  const limiter = getKeyLimiter(apiKey.rateLimitPerMin ?? 60);
  const { success: rateLimitOk } = await checkRateLimit(limiter, `v1:${apiKey.id}`);
  if (!rateLimitOk) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: 60 },
        { status: 429, headers: { "Retry-After": "60" } }
      ),
    };
  }

  // Update last used
  touchApiKey(apiKey.id).catch(() => {});

  return {
    ctx: {
      orgId: apiKey.orgId,
      tier,
      keyId: apiKey.id,
      rateLimitPerMin: apiKey.rateLimitPerMin ?? 60,
      scopes: (apiKey.scopes as string[] | null) ?? ["read"],
    },
    error: null,
  };
}

/**
 * Generate a new API key with prefix ctx_
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const rawKey =
    "ctx_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12) + "...";
  return { rawKey, keyHash, keyPrefix };
}
