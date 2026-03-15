import { getAuthSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { getOrgMembers, getOrgInvites } from "@/db/queries"
import { TeamClient } from "./TeamClient"

export default async function TeamPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const [members, invites] = await Promise.all([
    getOrgMembers(session.orgId),
    getOrgInvites(session.orgId),
  ])

  return (
    <TeamClient
      members={JSON.parse(JSON.stringify(members))}
      invites={JSON.parse(JSON.stringify(invites))}
      currentUserId={session.userId}
      isAdmin={session.role === "admin"}
    />
  )
}
