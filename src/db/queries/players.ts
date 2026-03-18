import { db } from "@/db";
import {
  eq,
  desc,
  count,
  and,
  or,
  inArray,
  ilike,
  gte,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  players,
  clubs,
  neuralAnalyses,
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
// PLAYERS (filtered by org via club ownership)
// ============================================

/**
 * Get all players visible to an org.
 * For now, all players are shared (public DB).
 * When clubs become org-specific, add orgId filter.
 */
export async function getPlayers(options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 100, offset = 0 } = options ?? {};

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
    limit,
    offset,
  });

  return allPlayers.map((player) => ({
    ...player,
    latestAnalysis: player.analyses[0] ?? null,
    analyses: undefined,
  }));
}

/**
 * Get a single player by ID
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

  if (!player) return null;

  return {
    ...player,
    analyses: player.analyses.map((a) => ({
      ...a,
      analyst: sanitizeAnalyst(a.analyst),
    })),
  };
}

/**
 * Get multiple players by their IDs
 */
export async function getPlayersByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const results = await db.query.players.findMany({
    where: inArray(players.id, ids),
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
  });

  return results;
}

/**
 * Search players by name (case-insensitive)
 */
export async function searchPlayers(query: string, options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 20, offset = 0 } = options ?? {};

  const allPlayers = await db.query.players.findMany({
    where: sql`lower(${players.name}) LIKE lower(${`%${query.replace(/[%_\\]/g, '\\$&')}%`})`,
    with: {
      currentClub: true,
    },
    orderBy: [desc(players.marketValue)],
    limit,
    offset,
  });

  return allPlayers;
}

/**
 * Advanced search with multi-term ILIKE across name, nationality, and club.
 * Supports filters for position, nationality, club, market value range, and max age.
 */
export async function searchPlayersAdvanced(
  query: string,
  limit: number = 20,
  offset: number = 0,
  filters?: {
    position?: string;
    nationality?: string;
    club?: string;
    minMarketValue?: number;
    maxMarketValue?: number;
    maxAge?: number;
  }
) {
  const conditions: SQL[] = [];

  // Text search across multiple fields (join with clubs for club name search)
  if (query && query.trim()) {
    const terms = query.trim().split(/\s+/);
    for (const term of terms) {
      const sanitized = term.replace(/[%_\\]/g, "\\$&");
      const pattern = `%${sanitized}%`;
      conditions.push(
        or(
          ilike(players.name, pattern),
          ilike(players.nationality, pattern),
          sql`${players.currentClubId} IN (SELECT id FROM clubs WHERE name ILIKE ${pattern})`
        )!
      );
    }
  }

  // Filters
  if (filters?.position) conditions.push(eq(players.positionCluster, filters.position as typeof players.positionCluster.enumValues[number]));
  if (filters?.nationality) conditions.push(ilike(players.nationality, `%${filters.nationality}%`));
  if (filters?.club) conditions.push(sql`${players.currentClubId} IN (SELECT id FROM clubs WHERE name ILIKE ${`%${filters.club}%`})`);
  if (filters?.minMarketValue) conditions.push(gte(players.marketValue, filters.minMarketValue));
  if (filters?.maxMarketValue) conditions.push(lte(players.marketValue, filters.maxMarketValue));
  if (filters?.maxAge) {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - filters.maxAge);
    conditions.push(gte(players.dateOfBirth, cutoff));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [results, countResult] = await Promise.all([
    db.select().from(players).where(where).orderBy(desc(players.marketValue)).limit(limit).offset(offset),
    db.select({ count: count() }).from(players).where(where),
  ]);

  return { players: results, total: countResult[0]?.count || 0 };
}

/**
 * Check if a player exists
 */
export async function playerExists(id: string): Promise<boolean> {
  const p = await db.query.players.findFirst({
    where: eq(players.id, id),
    columns: { id: true },
  });
  return !!p;
}

/**
 * Check if a club exists
 */
export async function clubExists(id: string): Promise<boolean> {
  const c = await db.query.clubs.findFirst({
    where: eq(clubs.id, id),
    columns: { id: true },
  });
  return !!c;
}
