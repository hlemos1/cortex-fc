/**
 * Sync finished matches from API-Football into the database.
 *
 * Runs daily via Vercel Cron.
 * Imports yesterday's finished matches for all tracked leagues.
 */

import { db } from "@/db/index";
import { matches, clubs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getFixtures,
  LEAGUE_IDS,
  CURRENT_SEASON,
  type ApiFixture,
} from "./api-football";

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Find club UUID by external API-Football ID
 */
async function findClubByExternalId(externalId: number): Promise<string | null> {
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.externalId, String(externalId)),
    columns: { id: true },
  });
  return club?.id ?? null;
}

/**
 * Sync matches for a specific date range across all leagues
 */
export async function syncMatches(from?: string, to?: string): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
}> {
  const dateFrom = from ?? yesterday();
  const dateTo = to ?? today();

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [leagueName, leagueId] of Object.entries(LEAGUE_IDS)) {
    try {
      const fixtures = await getFixtures({
        league: leagueId,
        season: CURRENT_SEASON,
        from: dateFrom,
        to: dateTo,
        status: "FT", // finished only
      });

      console.log(`[Sync] ${leagueName}: ${fixtures.length} finished matches`);

      for (const fixture of fixtures) {
        try {
          // Check if already imported
          const existing = await db.query.matches.findFirst({
            where: eq(matches.externalId, String(fixture.fixture.id)),
            columns: { id: true },
          });

          if (existing) {
            skipped++;
            continue;
          }

          // Find club UUIDs
          const homeClubId = await findClubByExternalId(fixture.teams.home.id);
          const awayClubId = await findClubByExternalId(fixture.teams.away.id);

          if (!homeClubId || !awayClubId) {
            errors.push(`Clubs not found for fixture ${fixture.fixture.id}: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
            continue;
          }

          await db.insert(matches).values({
            homeClubId,
            awayClubId,
            matchDate: new Date(fixture.fixture.date),
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            competition: leagueName,
            round: fixture.league.round,
            externalId: String(fixture.fixture.id),
            statsJson: fixture as unknown as Record<string, unknown>,
          });

          synced++;
        } catch (err) {
          errors.push(`Error syncing fixture ${fixture.fixture.id}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    } catch (err) {
      errors.push(`Error fetching ${leagueName}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return { synced, skipped, errors };
}
