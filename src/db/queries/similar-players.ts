import { db } from "../index";
import { eq, ne, desc, and, sql } from "drizzle-orm";
import { players, neuralAnalyses } from "../schema";

/**
 * Find players with similar profiles to the given player.
 * Similarity is calculated based on:
 * - Same position cluster (base 50)
 * - Age within 3 years (+20)
 * - Market value within 30% (+20)
 * - Same nationality (+10)
 */
export async function getSimilarPlayers(playerId: string, limit = 8) {
  // First, get the reference player
  const refPlayer = await db.query.players.findFirst({
    where: eq(players.id, playerId),
    columns: {
      id: true,
      positionCluster: true,
      age: true,
      marketValue: true,
      nationality: true,
    },
  });

  if (!refPlayer) return [];

  const refAge = refPlayer.age ?? 25;
  const refValue = refPlayer.marketValue ?? 0;
  const valueLow = refValue * 0.7;
  const valueHigh = refValue * 1.3;

  // Query players in same position cluster, with similarity score
  const results = await db
    .select({
      id: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      positionCluster: players.positionCluster,
      positionDetail: players.positionDetail,
      currentClubName: sql<string | null>`c.name`,
      age: players.age,
      marketValue: players.marketValue,
      nationality: players.nationality,
      // Latest analysis fields (may be null)
      scnPlus: sql<number | null>`na.scn_plus`,
      decision: sql<string | null>`na.decision`,
      // Similarity calculation
      similarity: sql<number>`
        50
        + CASE WHEN abs(coalesce(${players.age}, 25) - ${refAge}) <= 3 THEN 20 ELSE 0 END
        + CASE WHEN ${refValue} > 0 AND coalesce(${players.marketValue}, 0) BETWEEN ${valueLow} AND ${valueHigh} THEN 20 ELSE 0 END
        + CASE WHEN ${players.nationality} = ${refPlayer.nationality} THEN 10 ELSE 0 END
      `,
    })
    .from(players)
    .leftJoin(sql`clubs c`, sql`c.id = ${players.currentClubId}`)
    .leftJoin(
      sql`LATERAL (
        SELECT scn_plus, decision
        FROM neural_analyses
        WHERE neural_analyses.player_id = ${players.id}
        ORDER BY created_at DESC
        LIMIT 1
      ) na`,
      sql`true`
    )
    .where(
      and(
        eq(players.positionCluster, refPlayer.positionCluster),
        ne(players.id, playerId)
      )
    )
    .orderBy(
      sql`
        50
        + CASE WHEN abs(coalesce(${players.age}, 25) - ${refAge}) <= 3 THEN 20 ELSE 0 END
        + CASE WHEN ${refValue} > 0 AND coalesce(${players.marketValue}, 0) BETWEEN ${valueLow} AND ${valueHigh} THEN 20 ELSE 0 END
        + CASE WHEN ${players.nationality} = ${refPlayer.nationality} THEN 10 ELSE 0 END
        DESC
      `
    )
    .limit(limit);

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    photoUrl: r.photoUrl,
    positionCluster: r.positionCluster,
    positionDetail: r.positionDetail,
    currentClub: r.currentClubName,
    age: r.age,
    marketValue: r.marketValue,
    scnPlus: r.scnPlus,
    decision: r.decision,
    similarity: Number(r.similarity),
  }));
}
