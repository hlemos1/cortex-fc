import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getCountries, getLeagues } from "@/services/api-football"
import { withCacheHeaders, CACHE_LONG } from "@/lib/cache-headers"

/**
 * GET /api/football/leagues?country=Brazil
 * GET /api/football/leagues?search=premier
 * GET /api/football/leagues?countries=true — list all countries
 */
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const url = new URL(request.url)
    const country = url.searchParams.get("country")
    const search = url.searchParams.get("search")
    const countriesOnly = url.searchParams.get("countries")

    if (countriesOnly === "true") {
      const countries = await getCountries()
      return withCacheHeaders(NextResponse.json({ data: countries }), CACHE_LONG)
    }

    const leagues = await getLeagues({
      country: country ?? undefined,
      search: search ?? undefined,
    })

    return withCacheHeaders(NextResponse.json({ data: leagues }), CACHE_LONG)
  } catch (err) {
    console.error("Football leagues fetch failed:", err)
    const message = err instanceof Error ? err.message : "Fetch failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
