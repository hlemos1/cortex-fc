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

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const metric = searchParams.get("metric")

  switch (metric) {
    case "analyses_per_day":
      return NextResponse.json({
        data: await getAnalysesPerDayByOrg(session!.orgId),
      })
    case "agent_cost":
      return NextResponse.json({
        data: await getAgentCostPerWeek(session!.orgId),
      })
    case "scn_trend":
      return NextResponse.json({
        data: await getOrgScnTrend(session!.orgId),
      })
    case "usage":
      return NextResponse.json({
        data: await getOrgUsageThisMonth(session!.orgId),
      })
    default: {
      // Return all metrics
      const [analysesPerDay, agentCost, scnTrend, usage] = await Promise.all([
        getAnalysesPerDayByOrg(session!.orgId),
        getAgentCostPerWeek(session!.orgId),
        getOrgScnTrend(session!.orgId),
        getOrgUsageThisMonth(session!.orgId),
      ])
      return NextResponse.json({ analysesPerDay, agentCost, scnTrend, usage })
    }
  }
}
