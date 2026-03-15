"use client"

import {
  Building2,
  Activity,
  Bot,
  Users,
  Hash,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OrgStat {
  org: {
    id: string
    name: string
    tier: string
    logoUrl: string | null
  } | null
  totalAnalyses: number
  avgScn: number
  totalAgentRuns: number
  totalTokens: number
  memberCount: number
}

interface Props {
  stats: OrgStat[]
  currentOrgId: string
}

export function HoldingClient({ stats, currentOrgId }: Props) {
  const totalAnalyses = stats.reduce((s, o) => s + o.totalAnalyses, 0)
  const totalAgentRuns = stats.reduce((s, o) => s + o.totalAgentRuns, 0)
  const totalMembers = stats.reduce((s, o) => s + o.memberCount, 0)
  const totalTokens = stats.reduce((s, o) => s + o.totalTokens, 0)
  const avgScnGlobal =
    stats.length > 0
      ? Math.round(stats.reduce((s, o) => s + o.avgScn, 0) / stats.length)
      : 0

  const tierLabel: Record<string, string> = {
    free: "Free",
    scout_individual: "Scout Individual",
    club_professional: "Club Professional",
    holding_multiclub: "Holding Multi-Club",
  }

  const tierColor: Record<string, string> = {
    free: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    scout_individual: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    club_professional: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    holding_multiclub: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-down">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Holding Dashboard
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Visao consolidada de {stats.length} organizacao{stats.length !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Clubes", value: stats.length, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          { label: "Analises", value: totalAnalyses, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Agent Runs", value: totalAgentRuns, icon: Bot, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
          { label: "Membros", value: totalMembers, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "SCN+ Medio", value: avgScnGlobal, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-${idx + 1}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">{stat.label}</p>
                    <p className="text-xl font-bold text-zinc-100 font-mono">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Per-Club Comparison */}
      <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Benchmarking entre Clubes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Clube</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tier</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Analises</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">SCN+ Med.</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent Runs</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tokens</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Membros</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => {
                  const isActive = stat.org?.id === currentOrgId
                  const tier = stat.org?.tier ?? "free"
                  return (
                    <tr
                      key={stat.org?.id}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-all ${
                        isActive ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-zinc-700/50">
                            {(stat.org?.name ?? "?")
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <span className="text-zinc-200 font-medium text-xs">
                            {stat.org?.name ?? "—"}
                            {isActive && (
                              <span className="ml-1.5 text-[9px] text-emerald-500">(ativo)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${tierColor[tier]}`}>
                          {tierLabel[tier]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-zinc-400">
                        {stat.totalAnalyses}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-xs text-cyan-400 font-semibold">
                          {stat.avgScn > 0 ? stat.avgScn.toFixed(0) : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-zinc-400">
                        {stat.totalAgentRuns}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-zinc-400">
                        {stat.totalTokens > 1000
                          ? `${(stat.totalTokens / 1000).toFixed(1)}k`
                          : stat.totalTokens}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-zinc-400">
                        {stat.memberCount}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {stats.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Nenhuma organizacao encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Distribution */}
      {totalTokens > 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-500" />
              Consumo de Tokens por Clube
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats
                .filter((s) => s.totalTokens > 0)
                .sort((a, b) => b.totalTokens - a.totalTokens)
                .map((stat) => {
                  const pct = Math.round((stat.totalTokens / totalTokens) * 100)
                  return (
                    <div key={stat.org?.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-300">{stat.org?.name}</span>
                        <span className="text-xs font-mono text-zinc-500">
                          {stat.totalTokens > 1000
                            ? `${(stat.totalTokens / 1000).toFixed(1)}k`
                            : stat.totalTokens}{" "}
                          ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
