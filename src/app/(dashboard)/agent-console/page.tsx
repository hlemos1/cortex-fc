import { getAuthSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { getAgentRuns, getAgentRunMetrics } from "@/db/queries"
import { AgentConsoleClient } from "./AgentConsoleClient"

export default async function AgentConsolePage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const [runs, metrics] = await Promise.all([
    getAgentRuns(session.orgId, { limit: 50 }),
    getAgentRunMetrics(session.orgId),
  ])

  return (
    <AgentConsoleClient
      initialRuns={JSON.parse(JSON.stringify(runs))}
      metrics={JSON.parse(JSON.stringify(metrics))}
    />
  )
}
