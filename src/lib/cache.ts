/**
 * Redis cache layer using Upstash.
 *
 * Provides cached reads for heavy queries (dashboard stats, player lists).
 * Falls back to direct DB query if Redis not configured.
 *
 * Usage:
 *   const stats = await cached("dashboard:stats", () => getDashboardStats(), 300)
 */

import { Redis } from "@upstash/redis";
import crypto from "crypto";

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Get a cached value or compute + store it.
 *
 * @param key - Cache key (e.g. "dashboard:stats:{orgId}")
 * @param fetcher - Async function to compute the value if not cached
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 min)
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  if (!redis) {
    // No Redis — always compute
    return fetcher();
  }

  try {
    // Try cache first
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) {
      return hit;
    }
  } catch (err) {
    console.error("[Cache] Read error:", err);
    // Fall through to fetcher
  }

  // Cache miss — compute
  const value = await fetcher();

  // Store in background (don't block response)
  redis.set(key, JSON.stringify(value), { ex: ttlSeconds }).catch((err) => {
    console.error("[Cache] Write error:", err);
  });

  return value;
}

/**
 * Invalidate a cache key or pattern.
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error("[Cache] Invalidation error:", err);
  }
}

/**
 * Invalidate multiple keys matching a prefix.
 * Note: Use sparingly — SCAN can be slow with many keys.
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  if (!redis) return;
  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      });
      cursor = Number(result[0]);
      const keys = result[1] as string[];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error("[Cache] Prefix invalidation error:", err);
  }
}

// ============================================
// CACHE KEYS — centralized key definitions
// ============================================

export const CACHE_KEYS = {
  dashboardStats: (orgId: string) => `dashboard:stats:${orgId}`,
  playerList: (orgId: string, page: number) => `players:list:${orgId}:${page}`,
  analysisDetail: (id: string) => `analysis:${id}`,
  agentMetrics: (orgId: string) => `agent:metrics:${orgId}`,
  scoutingTargets: (orgId: string) => `scouting:targets:${orgId}`,
} as const;

// ============================================
// TTL PRESETS (seconds)
// ============================================

export const TTL = {
  SHORT: 60,       // 1 minute — for rapidly changing data
  MEDIUM: 300,     // 5 minutes — dashboard stats
  LONG: 900,       // 15 minutes — player lists
  HOUR: 3600,      // 1 hour — static-ish data
  DAY: 86400,      // 1 day — rarely changes
} as const;

// ============================================
// AGENT RESPONSE CACHE
// ============================================

/**
 * Generate a deterministic cache key from agent type + params.
 * Uses SHA-256 truncated to 16 hex chars for compact, collision-resistant keys.
 */
function agentCacheKey(
  agentType: string,
  params: Record<string, unknown>
): string {
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ agentType, ...params }))
    .digest("hex")
    .slice(0, 16);
  return `agent:response:${agentType}:${hash}`;
}

/**
 * Get a cached agent response.
 * Returns null on cache miss or if Redis is unavailable.
 */
export async function getCachedAgentResponse<T>(
  agentType: string,
  params: Record<string, unknown>
): Promise<T | null> {
  if (!redis) return null;
  try {
    const key = agentCacheKey(agentType, params);
    const cached = await redis.get(key);
    if (!cached) return null;
    return (typeof cached === "string" ? JSON.parse(cached) : cached) as T;
  } catch {
    return null;
  }
}

/**
 * Cache an agent response with a TTL.
 * Defaults to 1 day TTL since agent analyses don't change often.
 */
export async function setCachedAgentResponse(
  agentType: string,
  params: Record<string, unknown>,
  result: unknown,
  ttlSeconds: number = TTL.DAY
): Promise<void> {
  if (!redis) return;
  try {
    const key = agentCacheKey(agentType, params);
    await redis.set(key, JSON.stringify(result), { ex: ttlSeconds });
  } catch {
    // Silently fail — cache write should never break the main flow
  }
}

/**
 * Invalidate a specific agent response cache entry.
 */
export async function invalidateAgentCache(
  agentType: string,
  params: Record<string, unknown>
): Promise<void> {
  if (!redis) return;
  try {
    const key = agentCacheKey(agentType, params);
    await redis.del(key);
  } catch {
    // Silently fail
  }
}
