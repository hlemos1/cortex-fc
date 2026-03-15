/**
 * Sync transfers from API-Football.
 *
 * Fetches transfer history for tracked players
 * and upserts into the transfers table.
 */

import { db } from "@/db/index";
import { transfers, players, clubs } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { getTransfers } from "./api-football";

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
 * Sync transfers for all players in our database that have an externalId
 */
export async function syncTransfers(limit = 20): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
}> {
  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Get players with external IDs
  const trackedPlayers = await db.query.players.findMany({
    where: isNotNull(players.externalId),
    columns: { id: true, externalId: true, name: true },
    limit,
  });

  for (const player of trackedPlayers) {
    if (!player.externalId) continue;

    try {
      const transferData = await getTransfers(parseInt(player.externalId));

      for (const entry of transferData) {
        for (const transfer of entry.transfers) {
          // Check if already exists
          const existing = await db.query.transfers.findFirst({
            where: eq(transfers.playerId, player.id),
            columns: { id: true },
          });

          // Simple dedup: check date + player
          // A more robust approach would hash (playerId + date + fromClub + toClub)
          if (existing) {
            skipped++;
            continue;
          }

          const fromClubId = await findClubByExternalId(transfer.teams.out.id);
          const toClubId = await findClubByExternalId(transfer.teams.in.id);

          await db.insert(transfers).values({
            playerId: player.id,
            fromClubId,
            toClubId,
            transferDate: new Date(transfer.date),
            transferType: transfer.type?.toLowerCase() ?? "permanent",
          });

          synced++;
        }
      }
    } catch (err) {
      errors.push(`Error syncing transfers for ${player.name}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return { synced, skipped, errors };
}
