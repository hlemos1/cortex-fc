import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { searchPlayersByName, getPlayerProfile, getTeamSquad, CURRENT_SEASON } from "@/services/api-football"

/**
 * GET /api/players/search-external?q=neymar&league=71&season=2024&page=1
 *
 * Search players worldwide via API-Football.
 * If no league is specified, searches across top leagues.
 *
 * Alternative: ?team=131 — get full squad of a team
 * Alternative: ?playerId=276 — get single player profile
 */
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const url = new URL(request.url)
    const query = url.searchParams.get("q")
    const league = url.searchParams.get("league")
    const season = parseInt(url.searchParams.get("season") ?? String(CURRENT_SEASON))
    const page = parseInt(url.searchParams.get("page") ?? "1")
    const teamId = url.searchParams.get("team")
    const playerId = url.searchParams.get("playerId")

    // Single player profile
    if (playerId) {
      const player = await getPlayerProfile(parseInt(playerId), season)
      if (!player) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 })
      }
      return NextResponse.json({ data: player })
    }

    // Team squad
    if (teamId) {
      const squad = await getTeamSquad(parseInt(teamId))
      if (!squad) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
      }
      return NextResponse.json({ data: squad })
    }

    // Search by name (requires league)
    if (!query || query.length < 4) {
      return NextResponse.json(
        { error: "Query must be at least 4 characters" },
        { status: 400 }
      )
    }

    if (!league) {
      return NextResponse.json(
        { error: "League ID is required for player search" },
        { status: 400 }
      )
    }

    const result = await searchPlayersByName({
      search: query,
      league: parseInt(league),
      season,
      page,
    })

    return NextResponse.json({
      data: result.players,
      paging: result.paging,
      results: result.results,
    })
  } catch (err) {
    console.error("External player search failed:", err)
    const message = err instanceof Error ? err.message : "Search failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
