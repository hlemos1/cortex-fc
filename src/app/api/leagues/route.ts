import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getLeagues, getClubsByLeague } from "@/db/queries"

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const leagueId = searchParams.get("leagueId")

  if (leagueId) {
    const clubs = await getClubsByLeague(leagueId)
    return NextResponse.json({ clubs })
  }

  const leagues = await getLeagues()
  return NextResponse.json({ leagues })
}
