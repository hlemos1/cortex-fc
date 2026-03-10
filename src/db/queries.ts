import { db } from "./index";
import { eq, desc, count, avg, sql } from "drizzle-orm";
import {
  players,
  clubs,
  neuralAnalyses,
  scoutingTargets,
} from "./schema";

// ============================================
// PLAYERS
// ============================================

/**
 * Get all players with their club and latest neural analysis
 */
export async function getPlayers() {
  const allPlayers = await db.query.players.findMany({
    with: {
      currentClub: true,
      analyses: {
        orderBy: [desc(neuralAnalyses.createdAt)],
        limit: 1,
        with: {
          clubContext: true,
        },
      },
    },
    orderBy: [desc(players.marketValue)],
  });

  return allPlayers.map((player) => ({
    ...player,
    latestAnalysis: player.analyses[0] ?? null,
    analyses: undefined, // Remove the raw analyses array
  }));
}

/**
 * Get a single player by ID with all their analyses
 */
export async function getPlayerById(id: string) {
  const player = await db.query.players.findFirst({
    where: eq(players.id, id),
    with: {
      currentClub: true,
      analyses: {
        orderBy: [desc(neuralAnalyses.createdAt)],
        with: {
          clubContext: true,
          analyst: true,
        },
      },
    },
  });

  return player ?? null;
}

// ============================================
// ANALYSES
// ============================================

/**
 * Get all neural analyses with player and club data
 */
export async function getAnalyses() {
  return db.query.neuralAnalyses.findMany({
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
  });
}

/**
 * Get a single analysis by ID with full detail
 */
export async function getAnalysisById(id: string) {
  const analysis = await db.query.neuralAnalyses.findFirst({
    where: eq(neuralAnalyses.id, id),
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

  return analysis ?? null;
}

/**
 * Insert a new neural analysis
 */
export async function createAnalysis(data: typeof neuralAnalyses.$inferInsert) {
  const [inserted] = await db.insert(neuralAnalyses).values(data).returning();
  return inserted;
}

// ============================================
// DASHBOARD
// ============================================

/**
 * Get aggregate stats for the dashboard
 */
export async function getDashboardStats() {
  const [playerCount] = await db
    .select({ value: count() })
    .from(players);

  const [analysisCount] = await db
    .select({ value: count() })
    .from(neuralAnalyses);

  const [targetCount] = await db
    .select({ value: count() })
    .from(scoutingTargets);

  const [avgScn] = await db
    .select({ value: avg(neuralAnalyses.scnPlus) })
    .from(neuralAnalyses);

  // Decision distribution
  const decisionDistribution = await db
    .select({
      decision: neuralAnalyses.decision,
      count: count(),
    })
    .from(neuralAnalyses)
    .groupBy(neuralAnalyses.decision);

  // Recent analyses (last 5)
  const recentAnalyses = await db.query.neuralAnalyses.findMany({
    with: {
      player: true,
      clubContext: true,
    },
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
