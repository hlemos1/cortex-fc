import { getAuthSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { getUserOrgs, getHoldingDashboardStats } from "@/db/queries"
import { HoldingClient } from "./HoldingClient"

export default async function HoldingDashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  // Get all orgs this user belongs to
  const userOrgs = await getUserOrgs(session.userId)
  const orgIds = userOrgs.map((o) => o.orgId)

  // Get stats for all orgs
  const stats = await getHoldingDashboardStats(orgIds)

  return (
    <HoldingClient
      stats={JSON.parse(JSON.stringify(stats))}
      currentOrgId={session.orgId}
    />
  )
}
