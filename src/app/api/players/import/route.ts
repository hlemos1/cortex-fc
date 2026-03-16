import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getPlayerProfile, getTransfers, CURRENT_SEASON } from "@/services/api-football"
import { db } from "@/db/index"
import { players, clubs, transfers as transfersTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { PlayerCluster } from "@/types/cortex"

function mapPositionToCluster(position: string): PlayerCluster {
  const pos = position.toLowerCase()
  if (pos.includes("goalkeeper")) return "GK"
  if (pos.includes("defender")) {
    if (pos.includes("centre") || pos.includes("center")) return "CB"
    return "FB"
  }
  if (pos.includes("midfielder")) {
    if (pos.includes("defensive")) return "DM"
    if (pos.includes("attacking")) return "AM"
    return "CM"
  }
  if (pos.includes("attacker") || pos.includes("forward")) {
    if (pos.includes("wing") || pos.includes("left") || pos.includes("right")) return "W"
    return "ST"
  }
  return "CM"
}

function parseHeight(h: string | null): number | null {
  if (!h) return null
  const match = h.match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

function parseWeight(w: string | null): number | null {
  if (!w) return null
  const match = w.match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

async function getOrCreateClub(teamData: { id: number; name: string; logo?: string }, country?: string) {
  const existing = await db.query.clubs.findFirst({
    where: eq(clubs.externalId, String(teamData.id)),
  })
  if (existing) return existing

  const [newClub] = await db
    .insert(clubs)
    .values({
      name: teamData.name,
      country: country ?? "Unknown",
      logoUrl: teamData.logo ?? null,
      externalId: String(teamData.id),
    })
    .returning()

  return newClub
}

/**
 * POST /api/players/import
 * Body: { externalId: number, season?: number }
 *
 * Imports a player from API-Football into the local database.
 * If the player already exists (by externalId), returns the existing record.
 */
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const body = await request.json()
    const { externalId, season = CURRENT_SEASON } = body

    if (!externalId) {
      return NextResponse.json({ error: "externalId is required" }, { status: 400 })
    }

    // Check if player already exists in our DB
    const existing = await db.query.players.findFirst({
      where: eq(players.externalId, String(externalId)),
    })

    if (existing) {
      return NextResponse.json({ data: existing, imported: false })
    }

    // Fetch from API-Football
    const apiPlayer = await getPlayerProfile(externalId, season)
    if (!apiPlayer) {
      return NextResponse.json({ error: "Player not found in API-Football" }, { status: 404 })
    }

    // Determine current team from statistics
    const currentTeamStats = apiPlayer.statistics?.[0]
    let clubId: string | null = null

    if (currentTeamStats?.team) {
      const club = await getOrCreateClub(
        currentTeamStats.team,
        currentTeamStats.league?.name ?? "Unknown"
      )
      clubId = club.id
    }

    // Map API position to our position cluster
    const apiPosition = currentTeamStats?.games?.position ?? "Midfielder"
    const positionCluster = mapPositionToCluster(apiPosition)

    // Calculate age from birth date
    const birthDate = apiPlayer.player.birth?.date
      ? new Date(apiPlayer.player.birth.date)
      : null

    // Insert player
    const [newPlayer] = await db
      .insert(players)
      .values({
        name: apiPlayer.player.name,
        fullName: `${apiPlayer.player.firstname} ${apiPlayer.player.lastname}`.trim() || apiPlayer.player.name,
        nationality: apiPlayer.player.nationality ?? "Unknown",
        dateOfBirth: birthDate,
        age: apiPlayer.player.age,
        height: parseHeight(apiPlayer.player.height),
        weight: parseWeight(apiPlayer.player.weight),
        positionCluster,
        positionDetail: apiPosition,
        currentClubId: clubId,
        photoUrl: apiPlayer.player.photo,
        externalId: String(externalId),
      })
      .returning()

    // Try to import transfers (uses 1 additional API request)
    try {
      const transferData = await getTransfers(externalId)
      if (transferData?.[0]?.transfers) {
        for (const t of transferData[0].transfers.slice(0, 10)) {
          const fromClub = t.teams?.out ? await getOrCreateClub(t.teams.out) : null
          const toClub = t.teams?.in ? await getOrCreateClub(t.teams.in) : null

          await db.insert(transfersTable).values({
            playerId: newPlayer.id,
            fromClubId: fromClub?.id ?? null,
            toClubId: toClub?.id ?? null,
            transferDate: new Date(t.date),
            transferType: t.type?.toLowerCase() ?? "permanent",
          })
        }
      }
    } catch {
      // Transfer import is best-effort — don't fail the whole import
    }

    return NextResponse.json({ data: newPlayer, imported: true })
  } catch (err) {
    console.error("Player import failed:", err)
    const message = err instanceof Error ? err.message : "Import failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
