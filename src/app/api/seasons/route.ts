import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getSeasons, getCurrentSeason } from "@/db/queries"

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const leagueId = searchParams.get("leagueId")
  const current = searchParams.get("current")

  if (current === "true" && leagueId) {
    const season = await getCurrentSeason(leagueId)
    return NextResponse.json({ season })
  }

  const seasons = await getSeasons(leagueId ?? undefined)
  return NextResponse.json({ seasons })
}
