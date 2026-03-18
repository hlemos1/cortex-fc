import { db } from "@/db";
import {
  eq,
  desc,
  count,
  avg,
  sql,
  and,
  sum,
  inArray,
  isNull,
} from "drizzle-orm";
import {
  players,
  clubs,
  neuralAnalyses,
  scoutingTargets,
  agentRuns,
  playerMatchStats,
  transfers,
  matches,
  users,
} from "@/db/schema";

// ============================================
// HELPERS
// ============================================

function sanitizeAnalyst(
  analyst: { id: string; name: string; [key: string]: unknown } | null | undefined
) {
  if (!analyst) return null;
  return { id: analyst.id, name: analyst.name };
}

// ============================================
// ANALYSES (filtered by orgId)
// ============================================

/**
 * Get analyses filtered by orgId (via analyst's org)
 */
export async function getAnalyses(orgId?: string, options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 50, offset = 0 } = options ?? {};

  const conditions: ReturnType<typeof eq>[] = [];

  const results = await db.query.neuralAnalyses.findMany({
    with: {
      player: {
        with: {
          currentClub: true,
        },
      },
      clubContext: true,
      analyst: true,
    },
    orderBy: [desc(neuralAnalyses.createdAt)],
    limit,
    offset,
    where: orgId
      ? and(
          sql`${neuralAnalyses.analystId} IN (
            SELECT id FROM users WHERE org_id = ${orgId}
          )`,
          isNull(neuralAnalyses.deletedAt)
        )
      : isNull(neuralAnalyses.deletedAt),
  });

  return results.map((r) => ({ ...r, analyst: sanitizeAnalyst(r.analyst) }));
}

/**
 * Get a single analysis by ID, with org ownership check via analyst.
 */
export async function getAnalysisById(id: string, orgId?: string) {
  const analysis = await db.query.neuralAnalyses.findFirst({
    where: and(eq(neuralAnalyses.id, id), isNull(neuralAnalyses.deletedAt)),
    with: {
      player: {
        with: {
          currentClub: true,
        },
      },
      clubContext: true,
      analyst: true,
    },
  });

  if (!analysis) return null;

  // Enforce org isolation: check analyst belongs to requesting org
  if (orgId && analysis.analyst) {
    const analystUser = await db.query.users.findFirst({
      where: eq(users.id, analysis.analyst.id),
      columns: { orgId: true },
    });
    if (analystUser?.orgId !== orgId) return null;
  }

  return { ...analysis, analyst: sanitizeAnalyst(analysis.analyst) };
}

/**
 * Insert a new neural analysis
 */
export async function createAnalysis(data: typeof neuralAnalyses.$inferInsert) {
  const [inserted] = await db.insert(neuralAnalyses).values(data).returning();
  return inserted;
}

/**
 * Soft delete an analysis
 */
export async function softDeleteAnalysis(id: string, orgId: string) {
  await db.update(neuralAnalyses)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(neuralAnalyses.id, id),
      sql`${neuralAnalyses.analystId} IN (SELECT id FROM users WHERE org_id = ${orgId})`
    ));
}

/**
 * Restore a soft-deleted analysis
 */
export async function restoreAnalysis(id: string, orgId: string) {
  await db.update(neuralAnalyses)
    .set({ deletedAt: null })
    .where(and(
      eq(neuralAnalyses.id, id),
      sql`${neuralAnalyses.analystId} IN (SELECT id FROM users WHERE org_id = ${orgId})`
    ));
}

/**
 * Get data needed to generate alerts
 */
export async function getAlertData() {
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const expiringContracts = await db.query.players.findMany({
    where: sql`${players.contractUntil} IS NOT NULL AND ${players.contractUntil} < ${sixMonthsFromNow}`,
    with: {
      currentClub: true,
    },
    orderBy: [players.contractUntil],
    limit: 5,
  });

  const recentDecisions = await db.query.neuralAnalyses.findMany({
    with: {
      player: true,
    },
    orderBy: [desc(neuralAnalyses.createdAt)],
    limit: 5,
  });

  return { expiringContracts, recentDecisions };
}

/**
 * Get aggregate stats for the dashboard
 */
export async function getDashboardStats(orgId?: string) {
  const [playerCount] = await db
    .select({ value: count() })
    .from(players);

  const [analysisCount] = await db
    .select({ value: count() })
    .from(neuralAnalyses)
    .where(isNull(neuralAnalyses.deletedAt));

  const [targetCount] = await db
    .select({ value: count() })
    .from(scoutingTargets)
    .where(orgId
      ? and(eq(scoutingTargets.orgId, orgId), isNull(scoutingTargets.deletedAt))
      : isNull(scoutingTargets.deletedAt)
    );

  const [avgScn] = await db
    .select({ value: avg(neuralAnalyses.scnPlus) })
    .from(neuralAnalyses)
    .where(isNull(neuralAnalyses.deletedAt));

  const decisionDistribution = await db
    .select({
      decision: neuralAnalyses.decision,
      count: count(),
    })
    .from(neuralAnalyses)
    .where(isNull(neuralAnalyses.deletedAt))
    .groupBy(neuralAnalyses.decision);

  const recentAnalyses = await db.query.neuralAnalyses.findMany({
    with: {
      player: true,
      clubContext: true,
    },
    where: isNull(neuralAnalyses.deletedAt),
    orderBy: [desc(neuralAnalyses.createdAt)],
    limit: 5,
  });

  return {
    totalPlayers: playerCount.value,
    totalAnalyses: analysisCount.value,
    scoutingTargets: targetCount.value,
    averageSCN: avgScn.value ? Math.round(Number(avgScn.value)) : 0,
    decisionDistribution,
    recentAnalyses,
  };
}

/**
 * Get aggregated season stats for a player
 */
export async function getPlayerSeasonStats(playerId: string) {
  const rows = await db
    .select({
      appearances: count(),
      minutesPlayed: sum(playerMatchStats.minutesPlayed),
      goals: sum(playerMatchStats.goals),
      assists: sum(playerMatchStats.assists),
      xg: sum(playerMatchStats.xg),
      xa: sum(playerMatchStats.xa),
      tackles: sum(playerMatchStats.tackles),
      interceptions: sum(playerMatchStats.interceptions),
      yellowCards: sum(playerMatchStats.yellowCards),
      redCards: sum(playerMatchStats.redCards),
      duelsWon: sum(playerMatchStats.duelsWon),
      duelsTotal: sum(playerMatchStats.duelsTotal),
      avgRating: avg(playerMatchStats.rating),
      avgPassAccuracy: avg(playerMatchStats.passAccuracy),
    })
    .from(playerMatchStats)
    .where(eq(playerMatchStats.playerId, playerId));

  const row = rows[0];
  if (!row || row.appearances === 0) return null;

  const duelsWon = Number(row.duelsWon) || 0;
  const duelsTotal = Number(row.duelsTotal) || 0;

  return {
    appearances: row.appearances,
    minutesPlayed: Number(row.minutesPlayed) || 0,
    goals: Number(row.goals) || 0,
    assists: Number(row.assists) || 0,
    avgRating: row.avgRating ? parseFloat(Number(row.avgRating).toFixed(2)) : null,
    xg: row.xg ? parseFloat(Number(row.xg).toFixed(2)) : null,
    xa: row.xa ? parseFloat(Number(row.xa).toFixed(2)) : null,
    passAccuracy: row.avgPassAccuracy ? parseFloat(Number(row.avgPassAccuracy).toFixed(1)) : null,
    tackles: Number(row.tackles) || 0,
    interceptions: Number(row.interceptions) || 0,
    yellowCards: Number(row.yellowCards) || 0,
    redCards: Number(row.redCards) || 0,
    duelsWonPct: duelsTotal > 0 ? parseFloat(((duelsWon / duelsTotal) * 100).toFixed(1)) : null,
  };
}

/**
 * Get recent match-by-match performance data for charts
 */
export async function getPlayerMatchPerformance(playerId: string, limit = 20) {
  const stats = await db
    .select({
      date: matches.matchDate,
      rating: playerMatchStats.rating,
      xg: playerMatchStats.xg,
      goals: playerMatchStats.goals,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(playerMatchStats.matchId, matches.id))
    .where(eq(playerMatchStats.playerId, playerId))
    .orderBy(desc(matches.matchDate))
    .limit(limit);

  return stats.reverse().map((s) => ({
    date: s.date.toLocaleDateString("pt-BR", { month: "2-digit", day: "2-digit" }),
    rating: s.rating,
    xg: s.xg,
    goals: s.goals ?? 0,
  }));
}

/**
 * Get transfer history for a player
 */
export async function getPlayerTransfers(playerId: string) {
  const rows = await db
    .select({
      id: transfers.id,
      date: transfers.transferDate,
      fee: transfers.fee,
      type: transfers.transferType,
      fromClub: sql<string | null>`fc.name`,
      toClub: sql<string | null>`tc.name`,
    })
    .from(transfers)
    .leftJoin(sql`clubs fc`, sql`fc.id = ${transfers.fromClubId}`)
    .leftJoin(sql`clubs tc`, sql`tc.id = ${transfers.toClubId}`)
    .where(eq(transfers.playerId, playerId))
    .orderBy(desc(transfers.transferDate));

  return rows.map((r) => ({
    id: r.id,
    date: r.date.toLocaleDateString("pt-BR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    fromClub: r.fromClub,
    toClub: r.toClub,
    fee: r.fee,
    type: r.type,
  }));
}

/**
 * Get analytics overview
 */
export async function getAnalyticsOverview(orgId?: string) {
  const orgFilter = orgId
    ? sql`${neuralAnalyses.analystId} IN (SELECT id FROM users WHERE org_id = ${orgId})`
    : undefined;

  // Total players and analyses
  const [playerCount] = await db
    .select({ value: count() })
    .from(players);

  const [analysisCount] = await db
    .select({ value: count() })
    .from(neuralAnalyses)
    .where(orgFilter ? and(orgFilter, isNull(neuralAnalyses.deletedAt)) : isNull(neuralAnalyses.deletedAt));

  // Average scores
  const [avgScores] = await db
    .select({
      avgVx: avg(neuralAnalyses.vx),
      avgRx: avg(neuralAnalyses.rx),
      avgSCNPlus: avg(neuralAnalyses.scnPlus),
    })
    .from(neuralAnalyses)
    .where(orgFilter ? and(orgFilter, isNull(neuralAnalyses.deletedAt)) : isNull(neuralAnalyses.deletedAt));

  // Decision breakdown
  const decisionsBreakdown = await db
    .select({
      decision: neuralAnalyses.decision,
      count: count(),
    })
    .from(neuralAnalyses)
    .where(orgFilter ? and(orgFilter, isNull(neuralAnalyses.deletedAt)) : isNull(neuralAnalyses.deletedAt))
    .groupBy(neuralAnalyses.decision);

  // Monthly analyses (last 12 months)
  const monthlyAnalyses = await db
    .select({
      month: sql<string>`to_char(${neuralAnalyses.createdAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(neuralAnalyses)
    .where(
      orgFilter
        ? sql`${orgFilter} AND ${neuralAnalyses.deletedAt} IS NULL AND ${neuralAnalyses.createdAt} >= NOW() - INTERVAL '12 months'`
        : sql`${neuralAnalyses.deletedAt} IS NULL AND ${neuralAnalyses.createdAt} >= NOW() - INTERVAL '12 months'`
    )
    .groupBy(sql`to_char(${neuralAnalyses.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${neuralAnalyses.createdAt}, 'YYYY-MM')`);

  // Position distribution
  const positionDistribution = await db
    .select({
      position: players.positionCluster,
      count: count(),
    })
    .from(players)
    .groupBy(players.positionCluster);

  // Top 5 performers by SCN+
  const topPerformers = await db
    .select({
      id: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      scnPlus: neuralAnalyses.scnPlus,
      vx: neuralAnalyses.vx,
      rx: neuralAnalyses.rx,
      decision: neuralAnalyses.decision,
    })
    .from(neuralAnalyses)
    .innerJoin(players, eq(neuralAnalyses.playerId, players.id))
    .where(orgFilter ? and(orgFilter, isNull(neuralAnalyses.deletedAt)) : isNull(neuralAnalyses.deletedAt))
    .orderBy(desc(neuralAnalyses.scnPlus))
    .limit(5);

  return {
    totalPlayers: playerCount.value,
    totalAnalyses: analysisCount.value,
    avgVx: avgScores.avgVx ? parseFloat(Number(avgScores.avgVx).toFixed(2)) : 0,
    avgRx: avgScores.avgRx ? parseFloat(Number(avgScores.avgRx).toFixed(2)) : 0,
    avgSCNPlus: avgScores.avgSCNPlus ? parseFloat(Number(avgScores.avgSCNPlus).toFixed(1)) : 0,
    decisionsBreakdown: decisionsBreakdown.map((d) => ({
      decision: d.decision,
      count: d.count,
    })),
    monthlyAnalyses: monthlyAnalyses.map((m) => ({
      month: m.month,
      count: m.count,
    })),
    positionDistribution: positionDistribution.map((p) => ({
      position: p.position,
      count: p.count,
    })),
    topPerformers,
  };
}

export async function getContractTimeline(orgId?: string) {
  const eighteenMonthsFromNow = new Date();
  eighteenMonthsFromNow.setMonth(eighteenMonthsFromNow.getMonth() + 18);
  const now = new Date();

  const playersWithContracts = await db
    .select({
      id: players.id,
      name: players.name,
      contractUntil: players.contractUntil,
      marketValue: players.marketValue,
      clubName: clubs.name,
    })
    .from(players)
    .leftJoin(clubs, eq(players.currentClubId, clubs.id))
    .where(
      sql`${players.contractUntil} IS NOT NULL AND ${players.contractUntil} >= ${now} AND ${players.contractUntil} <= ${eighteenMonthsFromNow}`
    )
    .orderBy(players.contractUntil);

  // Group by quarter
  const quarters: Record<string, { id: string; name: string; club: string | null; contractUntil: Date; marketValue: number | null }[]> = {};

  for (const p of playersWithContracts) {
    if (!p.contractUntil) continue;
    const d = new Date(p.contractUntil);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const key = `${d.getFullYear()}-Q${q}`;
    if (!quarters[key]) quarters[key] = [];
    quarters[key].push({
      id: p.id,
      name: p.name,
      club: p.clubName,
      contractUntil: p.contractUntil,
      marketValue: p.marketValue,
    });
  }

  return Object.entries(quarters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([quarter, qPlayers]) => ({ quarter, players: qPlayers }));
}
