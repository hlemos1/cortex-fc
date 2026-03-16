import { getAuthSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { getAgentRuns, getAgentRunMetrics, getAgentUsageTimeline } from "@/db/queries"
import { AgentConsoleClient } from "./AgentConsoleClient"

const COST_PER_TOKEN = 0.000015
const AGENT_TYPES = ["ORACLE", "ANALISTA", "SCOUT", "BOARD_ADVISOR", "CFO_MODELER", "COACHING_ASSIST"] as const

export default async function AgentConsolePage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const [runs, metrics, timeline] = await Promise.all([
    getAgentRuns(session.orgId, { limit: 50 }),
    getAgentRunMetrics(session.orgId),
    getAgentUsageTimeline(session.orgId, 30),
  ])

  // Transform timeline into AgentUsageChart shape
  const usageByDate: Record<string, Record<string, number>> = {}
  for (const row of timeline) {
    if (!usageByDate[row.date]) {
      usageByDate[row.date] = { ORACLE: 0, ANALISTA: 0, SCOUT: 0, BOARD_ADVISOR: 0, CFO_MODELER: 0, COACHING_ASSIST: 0 }
    }
    usageByDate[row.date][row.agentType] = row.count
  }
  const usageChartData = Object.entries(usageByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, agents]) => ({
      date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      ORACLE: agents.ORACLE ?? 0,
      ANALISTA: agents.ANALISTA ?? 0,
      SCOUT: agents.SCOUT ?? 0,
      BOARD_ADVISOR: agents.BOARD_ADVISOR ?? 0,
      CFO_MODELER: agents.CFO_MODELER ?? 0,
      COACHING_ASSIST: agents.COACHING_ASSIST ?? 0,
    }))

  // Transform for AgentCostTracker
  const costByAgent = metrics.byAgent.map((a) => ({
    agentType: a.agentType,
    totalTokens: Number(a.totalTokens ?? 0),
    count: a.count,
  }))

  const dailyTokensByDate: Record<string, number> = {}
  for (const row of timeline) {
    dailyTokensByDate[row.date] = (dailyTokensByDate[row.date] ?? 0) + row.tokens
  }
  const dailyUsage = Object.entries(dailyTokensByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tokens]) => ({
      date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      tokens,
      cost: tokens * COST_PER_TOKEN,
    }))

  // Transform for AgentPerformanceRadar
  const agentPerformance = metrics.byAgent.map((a) => {
    const totalTokens = Number(a.totalTokens ?? 0)
    const avgDuration = Number(a.avgDuration ?? 0)
    const maxDuration = Math.max(...metrics.byAgent.map((b) => Number(b.avgDuration ?? 0)), 1)
    const maxTokens = Math.max(...metrics.byAgent.map((b) => Number(b.totalTokens ?? 0)), 1)
    const maxCount = Math.max(...metrics.byAgent.map((b) => b.count), 1)

    // Compute success rate per agent from runs
    const agentRuns = runs.filter((r) => r.agentType === a.agentType)
    const successCount = agentRuns.filter((r) => r.success).length
    const successRate = agentRuns.length > 0 ? Math.round((successCount / agentRuns.length) * 100) : 100

    return {
      name: a.agentType,
      successRate,
      avgSpeed: Math.round(Math.max(0, 100 - (avgDuration / maxDuration) * 100)),
      tokenEfficiency: Math.round(Math.max(0, 100 - (totalTokens / maxTokens) * 70)),
      usage: Math.round((a.count / maxCount) * 100),
      reliability: Math.min(100, successRate + Math.round(a.count / maxCount * 10)),
    }
  })

  return (
    <AgentConsoleClient
      initialRuns={JSON.parse(JSON.stringify(runs))}
      metrics={JSON.parse(JSON.stringify(metrics))}
      usageChartData={usageChartData}
      costTrackerData={{
        totalTokens: metrics.totalTokens,
        totalRuns: metrics.totalRuns,
        byAgent: costByAgent,
        dailyUsage,
      }}
      agentPerformanceData={agentPerformance}
    />
  )
}
