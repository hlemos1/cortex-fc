/**
 * Sync and update market values for tracked players.
 *
 * API-Football doesn't provide market values directly.
 * This service updates the `players.marketValue` column
 * and can be extended to integrate with TransferMarkt API
 * or manual updates.
 *
 * For now, it provides a framework for:
 * - Tracking market value changes over time
 * - Updating player market values from external sources
 */

import { db } from "@/db/index";
import { players } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";

interface MarketValueUpdate {
  playerId: string;
  playerName: string;
  oldValue: number | null;
  newValue: number;
  changePercent: number | null;
}

/**
 * Update market values for players.
 * Accepts a map of externalId -> new market value (millions EUR).
 *
 * Returns list of changes > 10% (for alerting).
 */
export async function updateMarketValues(
  updates: Record<string, number>
): Promise<{
  updated: number;
  significantChanges: MarketValueUpdate[];
}> {
  let updated = 0;
  const significantChanges: MarketValueUpdate[] = [];

  for (const [externalId, newValue] of Object.entries(updates)) {
    const player = await db.query.players.findFirst({
      where: eq(players.externalId, externalId),
      columns: { id: true, name: true, marketValue: true },
    });

    if (!player) continue;

    const oldValue = player.marketValue;
    const changePercent = oldValue
      ? ((newValue - oldValue) / oldValue) * 100
      : null;

    await db
      .update(players)
      .set({
        marketValue: newValue,
        updatedAt: new Date(),
      })
      .where(eq(players.id, player.id));

    updated++;

    // Flag significant changes (>10%)
    if (changePercent !== null && Math.abs(changePercent) > 10) {
      significantChanges.push({
        playerId: player.id,
        playerName: player.name,
        oldValue,
        newValue,
        changePercent: Math.round(changePercent * 10) / 10,
      });
    }
  }

  return { updated, significantChanges };
}

/**
 * Get players whose market value hasn't been updated recently.
 * Useful for scheduling batch updates.
 */
export async function getStaleMarketValues(daysSinceUpdate = 7): Promise<
  Array<{ id: string; name: string; externalId: string | null; marketValue: number | null; updatedAt: Date }>
> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceUpdate);

  const stale = await db.query.players.findMany({
    where: isNotNull(players.externalId),
    columns: {
      id: true,
      name: true,
      externalId: true,
      marketValue: true,
      updatedAt: true,
    },
    orderBy: [players.updatedAt],
    limit: 50,
  });

  return stale.filter((p) => p.updatedAt < cutoff);
}
