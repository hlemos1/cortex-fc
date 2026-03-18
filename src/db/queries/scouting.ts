import { db } from "@/db";
import {
  eq,
  desc,
  count,
  and,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import {
  players,
  clubs,
  neuralAnalyses,
  scoutingTargets,
  scoutingComments,
  playerWatchlist,
  users,
} from "@/db/schema";

// ============================================
// SCOUTING TARGETS
// ============================================

export async function getScoutingFunnel(orgId?: string) {
  const orgFilter = orgId
    ? and(eq(scoutingTargets.orgId, orgId), isNull(scoutingTargets.deletedAt))
    : isNull(scoutingTargets.deletedAt);

  // Total scouting targets (Identificados)
  const [totalTargets] = await db
    .select({ count: count() })
    .from(scoutingTargets)
    .where(orgFilter);

  // Targets with analysis (Analisados)
  const [analyzed] = await db
    .select({ count: count() })
    .from(scoutingTargets)
    .where(
      orgFilter
        ? and(orgFilter, sql`${scoutingTargets.analysisId} IS NOT NULL`)
        : sql`${scoutingTargets.analysisId} IS NOT NULL`
    );

  // Aprovados: targets whose analysis has decision CONTRATAR or BLINDAR
  const [approved] = await db
    .select({ count: count() })
    .from(scoutingTargets)
    .innerJoin(neuralAnalyses, eq(scoutingTargets.analysisId, neuralAnalyses.id))
    .where(
      orgFilter
        ? and(orgFilter, inArray(neuralAnalyses.decision, ["CONTRATAR", "BLINDAR"]))
        : inArray(neuralAnalyses.decision, ["CONTRATAR", "BLINDAR"])
    );

  // Recusados: targets whose analysis has decision RECUSAR
  const [rejected] = await db
    .select({ count: count() })
    .from(scoutingTargets)
    .innerJoin(neuralAnalyses, eq(scoutingTargets.analysisId, neuralAnalyses.id))
    .where(
      orgFilter
        ? and(orgFilter, eq(neuralAnalyses.decision, "RECUSAR"))
        : eq(neuralAnalyses.decision, "RECUSAR")
    );

  return [
    { stage: "Identificados", count: totalTargets.count },
    { stage: "Analisados", count: analyzed.count },
    { stage: "Aprovados", count: approved.count },
    { stage: "Recusados", count: rejected.count },
  ];
}

/**
 * Soft delete a scouting target
 */
export async function softDeleteScoutingTarget(id: string, orgId: string) {
  await db.update(scoutingTargets)
    .set({ deletedAt: new Date() })
    .where(and(eq(scoutingTargets.id, id), eq(scoutingTargets.orgId, orgId)));
}

/**
 * Restore a soft-deleted scouting target
 */
export async function restoreScoutingTarget(id: string, orgId: string) {
  await db.update(scoutingTargets)
    .set({ deletedAt: null })
    .where(and(eq(scoutingTargets.id, id), eq(scoutingTargets.orgId, orgId)));
}

// ============================================
// SCOUTING COMMENTS
// ============================================

export async function getScoutingComments(targetId: string) {
  return db
    .select({
      id: scoutingComments.id,
      targetId: scoutingComments.targetId,
      userId: scoutingComments.userId,
      content: scoutingComments.content,
      createdAt: scoutingComments.createdAt,
      updatedAt: scoutingComments.updatedAt,
      userName: users.name,
      userImage: users.avatarUrl,
    })
    .from(scoutingComments)
    .innerJoin(users, eq(scoutingComments.userId, users.id))
    .where(eq(scoutingComments.targetId, targetId))
    .orderBy(scoutingComments.createdAt);
}

export async function createScoutingComment(data: {
  targetId: string;
  userId: string;
  orgId: string;
  content: string;
}) {
  const [inserted] = await db
    .insert(scoutingComments)
    .values({
      targetId: data.targetId,
      userId: data.userId,
      orgId: data.orgId,
      content: data.content,
    })
    .returning();
  return inserted;
}

export async function deleteScoutingComment(id: string, userId: string) {
  const comment = await db.query.scoutingComments.findFirst({
    where: eq(scoutingComments.id, id),
    columns: { userId: true },
  });
  if (!comment || comment.userId !== userId) return null;

  await db.delete(scoutingComments).where(eq(scoutingComments.id, id));
  return { deleted: true };
}

// ============================================
// PLAYER WATCHLIST
// ============================================

export async function getWatchlist(userId: string) {
  return db
    .select({
      id: playerWatchlist.id,
      playerId: playerWatchlist.playerId,
      note: playerWatchlist.note,
      createdAt: playerWatchlist.createdAt,
      playerName: players.name,
      playerPhoto: players.photoUrl,
      playerPosition: players.positionCluster,
      playerNationality: players.nationality,
      playerMarketValue: players.marketValue,
      clubName: clubs.name,
    })
    .from(playerWatchlist)
    .innerJoin(players, eq(playerWatchlist.playerId, players.id))
    .leftJoin(clubs, eq(players.currentClubId, clubs.id))
    .where(eq(playerWatchlist.userId, userId))
    .orderBy(desc(playerWatchlist.createdAt));
}

export async function isPlayerWatched(playerId: string, userId: string): Promise<boolean> {
  const row = await db.query.playerWatchlist.findFirst({
    where: and(
      eq(playerWatchlist.playerId, playerId),
      eq(playerWatchlist.userId, userId)
    ),
    columns: { id: true },
  });
  return !!row;
}

export async function toggleWatchlist(playerId: string, userId: string, orgId: string) {
  const existing = await db.query.playerWatchlist.findFirst({
    where: and(
      eq(playerWatchlist.playerId, playerId),
      eq(playerWatchlist.userId, userId)
    ),
  });

  if (existing) {
    await db.delete(playerWatchlist).where(eq(playerWatchlist.id, existing.id));
    return { watched: false };
  }

  await db.insert(playerWatchlist).values({
    playerId,
    userId,
    orgId,
  });
  return { watched: true };
}
