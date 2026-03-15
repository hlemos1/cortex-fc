import { getPlayers, getAnalyses } from "@/db/queries"
import { toScoutingPlayerUI, toAnalysisUI } from "@/lib/db-transforms"
import { ScoutingClient } from "./ScoutingClient"
import { getAuthSession } from "@/lib/auth-helpers"
import { db } from "@/db/index"
import { scoutingTargets, players, clubs, neuralAnalyses } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export default async function ScoutingPage() {
  const session = await getAuthSession()

  const [dbPlayers, dbAnalyses] = await Promise.all([
    getPlayers(),
    getAnalyses(),
  ])

  // Transform players for UI
  const allPlayers = dbPlayers.map(toScoutingPlayerUI)
  const externalPlayers = allPlayers.filter((p) => p.club !== "Nottingham Forest")

  // Fetch real scouting targets for the org
  let initialTargets: Array<Record<string, unknown>> = []
  if (session?.orgId) {
    const targets = await db
      .select({
        id: scoutingTargets.id,
        playerId: scoutingTargets.playerId,
        priority: scoutingTargets.priority,
        status: scoutingTargets.status,
        notes: scoutingTargets.notes,
        targetPrice: scoutingTargets.targetPrice,
        createdAt: scoutingTargets.createdAt,
        updatedAt: scoutingTargets.updatedAt,
        playerName: players.name,
        playerAge: players.age,
        playerNationality: players.nationality,
        playerPosition: players.positionDetail,
        playerCluster: players.positionCluster,
        playerMarketValue: players.marketValue,
        playerPhoto: players.photoUrl,
        clubName: clubs.name,
      })
      .from(scoutingTargets)
      .innerJoin(players, eq(scoutingTargets.playerId, players.id))
      .leftJoin(clubs, eq(players.currentClubId, clubs.id))
      .where(eq(scoutingTargets.orgId, session.orgId))
      .orderBy(desc(scoutingTargets.updatedAt))

    // Attach latest analysis
    const enriched = await Promise.all(
      targets.map(async (t) => {
        const analysis = await db.query.neuralAnalyses.findFirst({
          where: eq(neuralAnalyses.playerId, t.playerId),
          orderBy: [desc(neuralAnalyses.createdAt)],
          columns: { vx: true, rx: true, scnPlus: true, decision: true, confidence: true },
        })
        return {
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          analysis: analysis ?? null,
        }
      })
    )

    initialTargets = enriched
  }

  return (
    <ScoutingClient
      scoutingTargets={externalPlayers}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialTargets={initialTargets as any}
    />
  )
}
