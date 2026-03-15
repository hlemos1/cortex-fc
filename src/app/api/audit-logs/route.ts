import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { getAuditLogs } from "@/db/queries";

/**
 * GET /api/audit-logs — List audit logs for the org
 */
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
    const offset = Number(url.searchParams.get("offset") || 0);
    const action = url.searchParams.get("action") || undefined;
    const userId = url.searchParams.get("userId") || undefined;
    const entityType = url.searchParams.get("entityType") || undefined;

    const logs = await getAuditLogs(session!.orgId, {
      limit,
      offset,
      action,
      userId,
      entityType,
    });

    return NextResponse.json({
      data: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to list audit logs:", error);
    return NextResponse.json(
      { error: "Erro ao listar audit logs" },
      { status: 500 }
    );
  }
}
