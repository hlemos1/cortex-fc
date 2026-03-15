/**
 * Sync player match stats from API-Football.
 *
 * For each recently synced match, fetch individual player statistics
 * and upsert into playerMatchStats.
 */

import { db } from "@/db/index";
import { playerMatchStats, matches, players } from "@/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { getFixturePlayerStats, type ApiPlayerStats } from "./api-football";

/**
 * Find player UUID by external API-Football ID
 */
async function findPlayerByExternalId(externalId: number): Promise<string | null> {
  const player = await db.query.players.findFirst({
    where: eq(players.externalId, String(externalId)),
    columns: { id: true },
  });
  return player?.id ?? null;
}

/**
 * Sync player stats for recent matches that haven't been processed yet.
 * Looks for matches with no player stats linked.
 */
export async function syncPlayerStats(limit = 10): Promise<{
  matchesProcessed: number;
  statsInserted: number;
  errors: string[];
}> {
  let matchesProcessed = 0;
  let statsInserted = 0;
  const errors: string[] = [];

  // Find matches with externalId that we haven't processed stats for
  const recentMatches = await db.query.matches.findMany({
    orderBy: [desc(matches.matchDate)],
    limit,
    columns: { id: true, externalId: true },
  });

  for (const match of recentMatches) {
    if (!match.externalId) continue;

    // Check if we already have stats for this match
    const existingStats = await db.query.playerMatchStats.findFirst({
      where: eq(playerMatchStats.matchId, match.id),
      columns: { id: true },
    });

    if (existingStats) continue; // Already processed

    try {
      const fixtureStats = await getFixturePlayerStats(parseInt(match.externalId));

      for (const ps of fixtureStats) {
        const playerId = await findPlayerByExternalId(ps.player.id);
        if (!playerId) continue; // Player not in our DB

        const stat = ps.statistics[0];
        if (!stat) continue;

        await db.insert(playerMatchStats).values({
          playerId,
          matchId: match.id,
          minutesPlayed: stat.games.minutes ?? 0,
          goals: stat.goals.total ?? 0,
          assists: stat.goals.assists ?? 0,
          shots: stat.shots.total ?? 0,
          shotsOnTarget: stat.shots.on ?? 0,
          passes: stat.passes.total ?? 0,
          passAccuracy: stat.passes.accuracy ? parseFloat(stat.passes.accuracy) : null,
          tackles: stat.tackles.total ?? 0,
          interceptions: stat.tackles.interceptions ?? 0,
          duelsWon: stat.duels.won ?? 0,
          duelsTotal: stat.duels.total ?? 0,
          dribbles: stat.dribbles.success ?? 0,
          fouls: stat.fouls.committed ?? 0,
          yellowCards: stat.cards.yellow ?? 0,
          redCards: stat.cards.red ?? 0,
          rating: stat.games.rating ? parseFloat(stat.games.rating) : null,
          position: stat.games.position,
          statsJson: ps as unknown as Record<string, unknown>,
        });

        statsInserted++;
      }

      matchesProcessed++;
    } catch (err) {
      errors.push(`Error syncing stats for match ${match.externalId}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return { matchesProcessed, statsInserted, errors };
}
