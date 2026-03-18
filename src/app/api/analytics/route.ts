import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import {
  getAgentCostPerWeek,
  getOrgUsageThisMonth,
} from "@/db/queries"
import {
  getAnalysesPerDayByOrg,
  getOrgScnTrend,
} from "@/db/queries/analytics"
import { withCacheHeaders, CACHE_SHORT } from "@/lib/cache-headers"

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const metric = searchParams.get("metric")

  switch (metric) {
    case "analyses_per_day":
      return withCacheHeaders(
        NextResponse.json({ data: await getAnalysesPerDayByOrg(session!.orgId) }),
        CACHE_SHORT,
      )
    case "agent_cost":
      return withCacheHeaders(
        NextResponse.json({ data: await getAgentCostPerWeek(session!.orgId) }),
        CACHE_SHORT,
      )
    case "scn_trend":
      return withCacheHeaders(
        NextResponse.json({ data: await getOrgScnTrend(session!.orgId) }),
        CACHE_SHORT,
      )
    case "usage":
      return withCacheHeaders(
        NextResponse.json({ data: await getOrgUsageThisMonth(session!.orgId) }),
        CACHE_SHORT,
      )
    default: {
      const [analysesPerDay, agentCost, scnTrend, usage] = await Promise.all([
        getAnalysesPerDayByOrg(session!.orgId),
        getAgentCostPerWeek(session!.orgId),
        getOrgScnTrend(session!.orgId),
        getOrgUsageThisMonth(session!.orgId),
      ])
      return withCacheHeaders(
        NextResponse.json({ analysesPerDay, agentCost, scnTrend, usage }),
        CACHE_SHORT,
      )
    }
  }
}
