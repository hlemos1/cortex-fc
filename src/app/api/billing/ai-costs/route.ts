import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getAgentCostBreakdown, getAgentCostDaily } from "@/db/queries/agents";
import { logger } from "@/lib/logger";

const COST_PER_TOKEN = 0.000015;

const AGENT_LABELS: Record<string, string> = {
  ORACLE: "Oracle",
  ANALISTA: "Analista",
  SCOUT: "Scout",
  BOARD_ADVISOR: "Board Advisor",
  CFO_MODELER: "CFO Modeler",
  COACHING_ASSIST: "Coaching Assist",
};

/**
 * GET /api/billing/ai-costs
 * Returns AI cost breakdown for the current month and daily sparkline data.
 */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const orgId = session!.orgId;

    const [breakdown, daily] = await Promise.all([
      getAgentCostBreakdown(orgId),
      getAgentCostDaily(orgId, 7),
    ]);

    const totalTokens = breakdown.reduce((sum, r) => sum + Number(r.totalTokens), 0);
    const totalRuns = breakdown.reduce((sum, r) => sum + Number(r.runCount), 0);
    const totalCostUsd = totalTokens * COST_PER_TOKEN;

    const byAgent = breakdown.map((r) => ({
      agentType: r.agentType,
      label: AGENT_LABELS[r.agentType] ?? r.agentType,
      totalTokens: Number(r.totalTokens),
      runCount: Number(r.runCount),
      costUsd: Number(r.totalTokens) * COST_PER_TOKEN,
    }));

    const dailyCosts = daily.map((d) => ({
      date: d.date,
      tokens: Number(d.totalTokens),
      runs: Number(d.runCount),
      costUsd: Number(d.totalTokens) * COST_PER_TOKEN,
    }));

    return NextResponse.json({
      totalTokens,
      totalRuns,
      totalCostUsd,
      byAgent,
      dailyCosts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to fetch AI costs", { orgId: session!.orgId }, err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: "Erro ao buscar custos de IA", detail: message },
      { status: 500 }
    );
  }
}
