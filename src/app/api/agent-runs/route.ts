import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { getAgentRuns, getAgentRunMetrics } from "@/db/queries";

export async function GET(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "use_agents")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const agentType = searchParams.get("agentType") ?? undefined;
    const successParam = searchParams.get("success");
    const success = successParam === "true" ? true : successParam === "false" ? false : undefined;
    const metricsOnly = searchParams.get("metrics") === "true";

    if (metricsOnly) {
      const metrics = await getAgentRunMetrics(session!.orgId);
      return NextResponse.json({ data: metrics });
    }

    const runs = await getAgentRuns(session!.orgId, { limit, offset, agentType, success });
    return NextResponse.json({ data: runs });
  } catch (error) {
    console.error("Failed to get agent runs:", error);
    return NextResponse.json({ error: "Erro ao buscar historico" }, { status: 500 });
  }
}
