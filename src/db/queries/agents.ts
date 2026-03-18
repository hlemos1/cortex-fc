import { db } from "@/db";
import {
  eq,
  desc,
  count,
  avg,
  sql,
  and,
  sum,
} from "drizzle-orm";
import { agentRuns } from "@/db/schema";

// ============================================
// AGENT RUNS (Audit Log)
// ============================================

/**
 * Log an agent run for audit purposes
 */
export async function createAgentRun(data: {
  agentType: "ORACLE" | "ANALISTA" | "SCOUT" | "BOARD_ADVISOR" | "CFO_MODELER" | "COACHING_ASSIST";
  inputContext: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  modelUsed: string;
  tokensUsed?: number;
  durationMs?: number;
  success?: boolean;
  error?: string;
  userId?: string;
  orgId?: string;
}) {
  const [inserted] = await db
    .insert(agentRuns)
    .values({
      agentType: data.agentType,
      inputContext: data.inputContext,
      outputResult: data.outputResult ?? null,
      modelUsed: data.modelUsed,
      tokensUsed: data.tokensUsed ?? null,
      durationMs: data.durationMs ?? null,
      success: data.success ?? true,
      error: data.error ?? null,
      userId: data.userId ?? null,
      orgId: data.orgId ?? null,
    })
    .returning();
  return inserted;
}

/**
 * Get agent runs for audit console
 */
export async function getAgentRuns(orgId?: string, options?: {
  limit?: number;
  offset?: number;
  agentType?: string;
  success?: boolean;
}) {
  const { limit = 50, offset = 0, agentType, success: successFilter } = options ?? {};

  const conditions = [];
  if (orgId) conditions.push(eq(agentRuns.orgId, orgId));
  if (agentType) conditions.push(eq(agentRuns.agentType, agentType as typeof agentRuns.agentType.enumValues[number]));
  if (successFilter !== undefined) conditions.push(eq(agentRuns.success, successFilter));

  return db.query.agentRuns.findMany({
    orderBy: [desc(agentRuns.createdAt)],
    limit,
    offset,
    ...(conditions.length > 0 ? { where: and(...conditions) } : {}),
  });
}

/**
 * Get agent run metrics for audit dashboard
 */
export async function getAgentRunMetrics(orgId?: string) {
  const baseWhere = orgId ? eq(agentRuns.orgId, orgId) : undefined;

  const [totals] = await db
    .select({
      totalRuns: count(),
      totalTokens: sum(agentRuns.tokensUsed),
      avgDuration: avg(agentRuns.durationMs),
      successCount: count(sql`CASE WHEN ${agentRuns.success} = true THEN 1 END`),
      errorCount: count(sql`CASE WHEN ${agentRuns.success} = false THEN 1 END`),
    })
    .from(agentRuns)
    .where(baseWhere);

  const byAgent = await db
    .select({
      agentType: agentRuns.agentType,
      count: count(),
      totalTokens: sum(agentRuns.tokensUsed),
      avgDuration: avg(agentRuns.durationMs),
    })
    .from(agentRuns)
    .where(baseWhere)
    .groupBy(agentRuns.agentType)
    .orderBy(desc(count()));

  return {
    totalRuns: totals?.totalRuns ?? 0,
    totalTokens: Number(totals?.totalTokens ?? 0),
    avgDuration: Math.round(Number(totals?.avgDuration ?? 0)),
    successCount: totals?.successCount ?? 0,
    errorCount: totals?.errorCount ?? 0,
    byAgent,
  };
}

export async function getAgentUsageTimeline(orgId?: string, days = 30) {
  const conditions = [
    sql`${agentRuns.createdAt} >= NOW() - INTERVAL '1 day' * ${days}`,
  ];
  if (orgId) conditions.push(eq(agentRuns.orgId, orgId));

  const rows = await db
    .select({
      date: sql<string>`to_char(${agentRuns.createdAt}, 'YYYY-MM-DD')`,
      agentType: agentRuns.agentType,
      count: count(),
      tokens: sum(agentRuns.tokensUsed),
    })
    .from(agentRuns)
    .where(and(...conditions))
    .groupBy(sql`to_char(${agentRuns.createdAt}, 'YYYY-MM-DD')`, agentRuns.agentType)
    .orderBy(sql`to_char(${agentRuns.createdAt}, 'YYYY-MM-DD')`);

  return rows.map((r) => ({
    date: r.date,
    agentType: r.agentType,
    count: r.count,
    tokens: Number(r.tokens ?? 0),
  }));
}
