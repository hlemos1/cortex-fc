import { redirect } from "next/navigation"
import { db } from "@/db/index"
import { eq } from "drizzle-orm"
import { orgInvites, users, organizations, orgMembers } from "@/db/schema"
import { getAuthSession } from "@/lib/auth-helpers"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Find invite
  const invite = await db.query.orgInvites.findFirst({
    where: eq(orgInvites.token, token),
  })

  if (!invite) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Card className="bg-zinc-900/80 border-zinc-800 max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-zinc-100 mb-2">Convite Invalido</h2>
            <p className="text-sm text-zinc-500">Este link de convite nao existe ou ja foi utilizado.</p>
            <Link href="/login">
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                Ir para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check expiration
  if (new Date() > invite.expiresAt) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Card className="bg-zinc-900/80 border-zinc-800 max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-zinc-100 mb-2">Convite Expirado</h2>
            <p className="text-sm text-zinc-500">Este convite expirou. Solicite um novo convite ao administrador.</p>
            <Link href="/login">
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                Ir para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Already accepted
  if (invite.acceptedAt) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Card className="bg-zinc-900/80 border-zinc-800 max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-zinc-100 mb-2">Convite Aceito</h2>
            <p className="text-sm text-zinc-500">Este convite ja foi aceito anteriormente.</p>
            <Link href="/dashboard">
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                Ir para Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get org info
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, invite.orgId),
    columns: { name: true },
  })

  // Check if user is logged in
  const session = await getAuthSession()

  if (session) {
    // Auto-accept: add user to org as member
    const existingMember = await db.query.orgMembers.findFirst({
      where: eq(orgMembers.userId, session.userId),
    })

    // Only add if not already a member of this org
    if (!existingMember || existingMember.orgId !== invite.orgId) {
      await db.insert(orgMembers).values({
        userId: session.userId,
        orgId: invite.orgId,
        role: invite.role,
      })
    }

    // Mark invite as accepted
    await db
      .update(orgInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(orgInvites.id, invite.id))

    redirect("/dashboard")
  }

  // Not logged in — show invite page with register/login links
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <Card className="bg-zinc-900/80 border-zinc-800 max-w-md w-full">
        <CardContent className="py-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Convite CORTEX FC</h2>
          <p className="text-sm text-zinc-500 mb-1">
            Voce foi convidado para a equipe:
          </p>
          <p className="text-lg font-semibold text-emerald-400 mb-1">
            {org?.name ?? "Organizacao"}
          </p>
          <p className="text-xs text-zinc-600 mb-6">
            Cargo: <span className="text-zinc-400 capitalize">{invite.role}</span>
          </p>

          <div className="space-y-3">
            <Link href={`/register?invite=${token}`}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Criar Conta e Aceitar
              </Button>
            </Link>
            <Link href={`/login?invite=${token}`}>
              <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Ja tenho conta — Fazer Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
