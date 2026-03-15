/**
 * Cached wrappers for heavy DB queries.
 *
 * Uses the Redis cache layer from ./cache.ts to avoid
 * hitting the database on every dashboard load.
 */

import { cached, CACHE_KEYS, TTL, invalidateCache, invalidateCachePrefix } from "./cache";
import {
  getDashboardStats,
  getAnalyses,
  getAnalysisById,
  getPlayers,
  getAgentRunMetrics,
} from "@/db/queries";

// ============================================
// CACHED READS
// ============================================

export async function getCachedDashboardStats(orgId: string) {
  return cached(
    CACHE_KEYS.dashboardStats(orgId),
    () => getDashboardStats(orgId),
    TTL.MEDIUM
  );
}

export async function getCachedPlayers(orgId: string, page = 0) {
  return cached(
    CACHE_KEYS.playerList(orgId, page),
    () => getPlayers({ limit: 50, offset: page * 50 }),
    TTL.LONG
  );
}

export async function getCachedAnalysis(id: string) {
  return cached(
    CACHE_KEYS.analysisDetail(id),
    () => getAnalysisById(id),
    TTL.LONG
  );
}

export async function getCachedAgentMetrics(orgId: string) {
  return cached(
    CACHE_KEYS.agentMetrics(orgId),
    () => getAgentRunMetrics(orgId),
    TTL.SHORT
  );
}

// ============================================
// CACHE INVALIDATION HELPERS
// ============================================

/** Call after a new analysis is created */
export async function onAnalysisCreated(orgId: string) {
  await Promise.all([
    invalidateCache(CACHE_KEYS.dashboardStats(orgId)),
    invalidateCachePrefix("players:list:" + orgId),
  ]);
}

/** Call after an agent run completes */
export async function onAgentRunComplete(orgId: string) {
  await invalidateCache(CACHE_KEYS.agentMetrics(orgId));
}

/** Call after scouting targets change */
export async function onScoutingTargetChanged(orgId: string) {
  await Promise.all([
    invalidateCache(CACHE_KEYS.scoutingTargets(orgId)),
    invalidateCache(CACHE_KEYS.dashboardStats(orgId)),
  ]);
}
