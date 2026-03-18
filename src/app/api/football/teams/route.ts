import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getTeams } from "@/services/api-football"
import { withCacheHeaders, CACHE_MEDIUM } from "@/lib/cache-headers"

export async function GET(request: Request) {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const url = new URL(request.url)
    const league = url.searchParams.get("league")
    const season = url.searchParams.get("season") ?? "2024"

    if (!league) {
      return NextResponse.json({ error: "league required" }, { status: 400 })
    }

    const teams = await getTeams(Number(league), Number(season))
    return withCacheHeaders(NextResponse.json({ data: teams }), CACHE_MEDIUM)
  } catch (err) {
    console.error("Football teams fetch failed:", err)
    const message = err instanceof Error ? err.message : "Fetch failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
