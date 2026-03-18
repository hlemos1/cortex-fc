import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { canUseFeature } from "@/lib/feature-gates";
import { createApiKey, getOrgApiKeys, revokeApiKey } from "@/db/queries";
import { generateApiKey } from "@/lib/api-auth";

/**
 * GET /api/v1/keys — List API keys for the org
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const keys = await getOrgApiKeys(session!.orgId);
    return NextResponse.json({
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        rateLimitPerMin: k.rateLimitPerMin,
        scopes: k.scopes,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to list API keys:", error);
    return NextResponse.json({ error: "Erro ao listar API keys" }, { status: 500 });
  }
}

/**
 * POST /api/v1/keys — Create a new API key
 */
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    if (!canUseFeature(session!.tier, "apiAccess")) {
      return NextResponse.json(
        { error: "API access requires club_professional tier or higher" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, rateLimitPerMin, scopes: requestedScopes } = body;

    // Validate scopes
    const VALID_SCOPES = ["read", "write", "admin"];
    const scopes: string[] = Array.isArray(requestedScopes)
      ? requestedScopes.filter((s: unknown) => typeof s === "string" && VALID_SCOPES.includes(s))
      : ["read"];
    if (scopes.length === 0) scopes.push("read");

    const { rawKey, keyHash, keyPrefix } = generateApiKey();

    const key = await createApiKey({
      orgId: session!.orgId,
      keyHash,
      keyPrefix,
      name: name ?? "Default",
      createdBy: session!.userId,
      rateLimitPerMin: rateLimitPerMin ?? 60,
      scopes,
    });

    // Return the raw key ONLY on creation — it cannot be retrieved again
    return NextResponse.json({
      data: {
        id: key.id,
        key: rawKey,
        name: key.name,
        keyPrefix: key.keyPrefix,
        rateLimitPerMin: key.rateLimitPerMin,
        scopes: key.scopes,
        createdAt: key.createdAt,
      },
      warning: "Save this key now. It cannot be retrieved again.",
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json({ error: "Erro ao criar API key" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/keys — Revoke an API key
 */
export async function DELETE(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const url = new URL(request.url);
    const keyId = url.searchParams.get("id");
    if (!keyId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await revokeApiKey(keyId, session!.orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return NextResponse.json({ error: "Erro ao revogar API key" }, { status: 500 });
  }
}
