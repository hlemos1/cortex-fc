import { db } from "@/db";
import { neuralAnalyses, agentRuns, scoutingTargets } from "@/db/schema";
import { eq, and, gte, sql, count, sum, avg, isNull, desc } from "drizzle-orm";

/**
 * Analyses created per day for the last N days.
 * Note: neuralAnalyses has no orgId — filters by clubContextId instead.
 */
export async function getAnalysesPerDay(clubContextId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      date: sql<string>`DATE(${neuralAnalyses.createdAt})`.as("date"),
      count: count(),
    })
    .from(neuralAnalyses)
    .where(
      and(
        eq(neuralAnalyses.clubContextId, clubContextId),
        gte(neuralAnalyses.createdAt, since),
      ),
    )
    .groupBy(sql`DATE(${neuralAnalyses.createdAt})`)
    .orderBy(sql`DATE(${neuralAnalyses.createdAt})`);

  return result;
}

/**
 * Agent token usage and run count per week for the last N weeks.
 */
export async function getAgentCostPerWeek(orgId: string, weeks: number = 12) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const result = await db
    .select({
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${agentRuns.createdAt}), 'YYYY-MM-DD')`.as(
        "week",
      ),
      totalTokens: sql<number>`COALESCE(SUM(${agentRuns.tokensUsed}), 0)`.as("total_tokens"),
      runCount: count(),
    })
    .from(agentRuns)
    .where(
      and(
        eq(agentRuns.orgId, orgId),
        gte(agentRuns.createdAt, since),
      ),
    )
    .groupBy(sql`DATE_TRUNC('week', ${agentRuns.createdAt})`)
    .orderBy(sql`DATE_TRUNC('week', ${agentRuns.createdAt})`);

  return result;
}

/**
 * SCN+ trend for a player over time (last N months).
 * Returns scnPlus, vx, and rx per analysis date.
 */
export async function getScnTrend(playerId: string, months: number = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const result = await db
    .select({
      date: sql<string>`DATE(${neuralAnalyses.createdAt})`.as("date"),
      scnPlus: neuralAnalyses.scnPlus,
      vx: neuralAnalyses.vx,
      rx: neuralAnalyses.rx,
    })
    .from(neuralAnalyses)
    .where(
      and(
        eq(neuralAnalyses.playerId, playerId),
        gte(neuralAnalyses.createdAt, since),
      ),
    )
    .orderBy(neuralAnalyses.createdAt);

  return result;
}

/**
 * Get org usage for the current calendar month.
 * Used by feature gates, cost alerts, and billing to enforce quotas.
 */
export async function getOrgUsageThisMonth(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Analyses: neuralAnalyses has no orgId, so filter via analystId -> users.org_id
  const [analysisResult] = await db
    .select({ value: count() })
    .from(neuralAnalyses)
    .where(
      and(
        sql`${neuralAnalyses.analystId} IN (SELECT id FROM users WHERE org_id = ${orgId})`,
        gte(neuralAnalyses.createdAt, startOfMonth),
        isNull(neuralAnalyses.deletedAt)
      )
    );

  // Agent runs: has orgId directly
  const [agentResult] = await db
    .select({
      runs: count(),
      tokens: sum(agentRuns.tokensUsed),
    })
    .from(agentRuns)
    .where(
      and(
        eq(agentRuns.orgId, orgId),
        gte(agentRuns.createdAt, startOfMonth),
        eq(agentRuns.success, true)
      )
    );

  return {
    analyses: analysisResult?.value ?? 0,
    agentRuns: agentResult?.runs ?? 0,
    tokensUsed: Number(agentResult?.tokens ?? 0),
  };
}

/**
 * Scouting pipeline velocity — count of targets by status in the last N days.
 */
export async function getScoutingVelocity(orgId: string, days: number = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      status: scoutingTargets.status,
      count: count(),
    })
    .from(scoutingTargets)
    .where(
      and(
        eq(scoutingTargets.orgId, orgId),
        gte(scoutingTargets.createdAt, since),
      ),
    )
    .groupBy(scoutingTargets.status);

  return result;
}

/**
 * Analyses created per day for the last N days, filtered by org (via analyst).
 */
export async function getAnalysesPerDayByOrg(orgId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      date: sql<string>`DATE(${neuralAnalyses.createdAt})`.as("date"),
      count: count(),
    })
    .from(neuralAnalyses)
    .where(
      and(
        sql`${neuralAnalyses.analystId} IN (SELECT id FROM users WHERE org_id = ${orgId})`,
        gte(neuralAnalyses.createdAt, since),
        isNull(neuralAnalyses.deletedAt),
      ),
    )
    .groupBy(sql`DATE(${neuralAnalyses.createdAt})`)
    .orderBy(sql`DATE(${neuralAnalyses.createdAt})`);

  return result;
}

/**
 * Org-level SCN+ trend — average SCN+ per week over the last N months.
 */
export async function getOrgScnTrend(orgId: string, months: number = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const result = await db
    .select({
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${neuralAnalyses.createdAt}), 'YYYY-MM-DD')`.as("week"),
      avgScnPlus: sql<number>`ROUND(AVG(${neuralAnalyses.scnPlus})::numeric, 1)`.as("avg_scn_plus"),
      avgVx: sql<number>`ROUND(AVG(${neuralAnalyses.vx})::numeric, 2)`.as("avg_vx"),
      avgRx: sql<number>`ROUND(AVG(${neuralAnalyses.rx})::numeric, 2)`.as("avg_rx"),
      count: count(),
    })
    .from(neuralAnalyses)
    .where(
      and(
        sql`${neuralAnalyses.analystId} IN (SELECT id FROM users WHERE org_id = ${orgId})`,
        gte(neuralAnalyses.createdAt, since),
        isNull(neuralAnalyses.deletedAt),
      ),
    )
    .groupBy(sql`DATE_TRUNC('week', ${neuralAnalyses.createdAt})`)
    .orderBy(sql`DATE_TRUNC('week', ${neuralAnalyses.createdAt})`);

  return result;
}
