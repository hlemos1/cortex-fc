"use client"

import { useState } from "react"
import {
  Users,
  Mail,
  Shield,
  Eye,
  Activity,
  Trash2,
  UserPlus,
  Loader2,
  Clock,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Member {
  id: string
  userId: string
  role: string
  joinedAt: string
  userName: string
  userEmail: string
  userAvatar: string | null
}

interface Invite {
  id: string
  email: string
  role: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

interface Props {
  members: Member[]
  invites: Invite[]
  currentUserId: string
  isAdmin: boolean
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  analyst: Activity,
  viewer: Eye,
}

const ROLE_COLORS: Record<string, string> = {
  admin: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  analyst: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  viewer: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
}

export function TeamClient({ members, invites, currentUserId, isAdmin }: Props) {
  const [memberList, setMemberList] = useState(members)
  const [inviteList, setInviteList] = useState(invites)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("analyst")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInvite = async () => {
    if (!inviteEmail) return
    setSending(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar convite")
      } else {
        setSuccess(`Convite enviado para ${inviteEmail}`)
        setInviteEmail("")
        setInviteList((prev) => [data.data, ...prev])
      }
    } catch {
      setError("Erro de conexao")
    }
    setSending(false)
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setMemberList((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        )
      }
    } catch {}
  }

  const handleRemove = async (memberId: string) => {
    try {
      const res = await fetch(`/api/team/${memberId}`, { method: "DELETE" })
      if (res.ok) {
        setMemberList((prev) => prev.filter((m) => m.id !== memberId))
      }
    } catch {}
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  }

  const pendingInvites = inviteList.filter((i) => !i.acceptedAt && new Date(i.expiresAt) > new Date())

  return (
    <div className="space-y-6">
      <div className="animate-slide-down">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Equipe</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerenciar membros e convites da organizacao</p>
      </div>

      {/* Invite Form */}
      {isAdmin && (
        <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up stagger-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Convidar Membro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-10 rounded-md bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-sm px-3"
              >
                <option value="admin">Admin</option>
                <option value="analyst">Analista</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button
                onClick={handleInvite}
                disabled={sending || !inviteEmail}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Enviar
              </Button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            {success && <p className="text-xs text-emerald-400 mt-2">{success}</p>}
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up stagger-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-500" />
            Membros ({memberList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800/50">
            {memberList.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role] ?? Eye
              const roleColor = ROLE_COLORS[member.role] ?? ROLE_COLORS.viewer
              const isCurrentUser = member.userId === currentUserId
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700/50">
                      {member.userName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {member.userName}
                        {isCurrentUser && (
                          <span className="text-[10px] text-zinc-600 ml-2">(voce)</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-600">{member.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin && !isCurrentUser ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className={`h-7 rounded-md border text-[11px] font-semibold px-2 ${roleColor}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="analyst">Analista</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${roleColor}`}>
                        <RoleIcon className="w-3 h-3" />
                        {member.role}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-700 font-mono">
                      {formatDate(member.joinedAt)}
                    </span>
                    {isAdmin && !isCurrentUser && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {memberList.length === 0 && (
              <div className="py-8 text-center text-zinc-600 text-sm">
                Nenhum membro encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Convites Pendentes ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800/50">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm text-zinc-300">{invite.email}</p>
                    <p className="text-[10px] text-zinc-600">
                      Cargo: <span className="capitalize">{invite.role}</span> — Expira: {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Pendente
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accepted Invites */}
      {inviteList.filter((i) => i.acceptedAt).length > 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Convites Aceitos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800/50">
              {inviteList
                .filter((i) => i.acceptedAt)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <p className="text-sm text-zinc-500">{invite.email}</p>
                    <span className="text-[10px] text-emerald-500">
                      Aceito em {formatDate(invite.acceptedAt!)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
