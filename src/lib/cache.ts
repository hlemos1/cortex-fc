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
