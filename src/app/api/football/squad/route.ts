import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getTeamSquad } from "@/services/api-football"

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const url = new URL(request.url)
    const team = url.searchParams.get("team")

    if (!team) {
      return NextResponse.json({ error: "team required" }, { status: 400 })
    }

    const squad = await getTeamSquad(Number(team))
    return NextResponse.json({ data: squad })
  } catch (err) {
    console.error("Football squad fetch failed:", err)
    const message = err instanceof Error ? err.message : "Fetch failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
