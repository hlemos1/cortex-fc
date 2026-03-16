import {
  Activity,
  Cpu,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VxRxScatter } from "@/components/cortex/VxRxScatter"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { StatCard } from "@/components/cortex/StatCard"
import { getDashboardStats, getAnalyses, getPlayers } from "@/db/queries"
import { toScatterPoint, toAlgorithmScores, formatDate } from "@/lib/db-transforms"
import { AlertsPanel } from "../AlertsPanel"
import type { Alert } from "../AlertsPanel"
import { BoardAdvisorWidget } from "@/components/cortex/BoardAdvisorWidget"

export default async function DashboardPage() {
  const [stats, analyses, allPlayers] = await Promise.all([
    getDashboardStats(),
    getAnalyses(),
    getPlayers(),
  ])

  // Generate alerts from real DB data
  const alerts: Alert[] = []
  const now = new Date()
  const sixMonthsFromNow = new Date(now)
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

  // Players with contracts expiring within 6 months
  for (const player of allPlayers) {
    if (player.contractUntil) {
      const contractDate = new Date(player.contractUntil)
      if (contractDate <= sixMonthsFromNow && contractDate >= now) {
        alerts.push({
          id: `contract-${player.id}`,
          title: "Contrato expirando",
          description: `${player.name} tem contrato ate ${formatDate(contractDate)}. Avaliar renovacao ou venda.`,
          severity: "high",
          date: formatDate(contractDate),
        })
      }
    }
  }

  // Latest analysis decisions
  for (const analysis of analyses.slice(0, 5)) {
    const playerName = analysis.player?.name ?? "Desconhecido"
    alerts.push({
      id: `analysis-${analysis.id}`,
      title: `Novo parecer: ${analysis.decision} — ${playerName}`,
      description: analysis.reasoning
        ? analysis.reasoning.slice(0, 120)
        : `Analise neural concluida com decisao ${analysis.decision}.`,
      severity: "medium",
      date: formatDate(analysis.createdAt),
    })
  }

  // Recent scouting activity
  for (const analysis of analyses.slice(5, 8)) {
    const playerName = analysis.player?.name ?? "Desconhecido"
    alerts.push({
      id: `scouting-${analysis.id}`,
      title: `Atividade de scouting: ${playerName}`,
      description: `Nova avaliacao registrada para ${playerName} (SCN+ ${analysis.scnPlus ?? "—"}).`,
      severity: "low",
      date: formatDate(analysis.createdAt),
    })
  }

  const borderColors = [
    "border-l-blue-500",
    "border-l-emerald-500",
    "border-l-amber-500",
    "border-l-cyan-500",
  ]

  const statsCards = [
    {
      title: "Total Jogadores",
      value: stats.totalPlayers,
      iconName: "users" as const,
      change: "+2 este mes",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Analises Realizadas",
      value: stats.totalAnalyses,
      iconName: "activity" as const,
      change: "+5 esta semana",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Alvos de Scouting",
      value: stats.scoutingTargets,
      iconName: "search" as const,
      change: "3 prioritarios",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Score Medio SCN+",
      value: stats.averageSCN,
      iconName: "trending" as const,
      change: "+3.2 vs mes anterior",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
  ]

  const scatterData = analyses.map((a) => toScatterPoint(a))

  const recentAnalyses = analyses.slice(0, 8)

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Command Center
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Visao geral da inteligencia neural — Nottingham Forest FC
          </p>
        </div>
        <Link href="/analysis/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-emerald-900/40 hover:-translate-y-0.5">
            <Activity className="w-4 h-4 mr-2" />
            Nova Analise
          </Button>
        </Link>
      </div>

      {/* Stats Cards — Animated Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            iconName={stat.iconName}
            change={stat.change}
            color={stat.color}
            bgColor={stat.bgColor}
            borderColor={borderColors[index]}
            delay={(index + 1) * 100}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-3">
        {/* VxRx Scatter Plot */}
        <Card className="lg:col-span-2 bg-zinc-900/80 border-zinc-800 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  Mapa VxRx — Valor vs Risco
                </CardTitle>
                <p className="text-xs text-zinc-600">
                  Todas as analises plotadas no espaco decisorio neural
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <VxRxScatter data={scatterData} height={380} />
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {(["CONTRATAR", "BLINDAR", "MONITORAR", "RECUSAR", "ALERTA_CINZA"] as const).map(
                (d) => (
                  <DecisionBadge key={d} decision={d} size="sm" />
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Board Advisor Widget */}
      <div className="animate-slide-up stagger-4">
        <BoardAdvisorWidget />
      </div>

      {/* Recent Analyses Table */}
      <Card className="bg-zinc-900/80 border-zinc-800 animate-slide-up stagger-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center ring-1 ring-cyan-500/20">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-zinc-300">
                Ultimas Analises
              </CardTitle>
            </div>
            <Link href="/analysis">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 text-xs">
                Ver todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Jogador
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Posicao
                  </th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Vx
                  </th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Rx
                  </th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    SCN+
                  </th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Decisao
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentAnalyses.map((analysis, index) => {
                  const algScores = toAlgorithmScores(analysis)
                  const decisionColor =
                    analysis.decision === "CONTRATAR" || analysis.decision === "BLINDAR"
                      ? "border-l-emerald-500"
                      : analysis.decision === "RECUSAR"
                        ? "border-l-red-500"
                        : analysis.decision === "ALERTA_CINZA"
                          ? "border-l-zinc-500"
                          : "border-l-amber-500"
                  return (
                    <tr
                      key={analysis.id}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-all duration-200 border-l-2 border-l-transparent hover:${decisionColor} animate-slide-up`}
                      style={{ animationDelay: `${(index + 1) * 60}ms` }}
                    >
                      <td className="py-3 px-3">
                        <Link href={`/players/${analysis.player?.id}`} className="flex items-center gap-2 group">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0 ring-1 ring-zinc-700 group-hover:ring-emerald-500/30 transition-all">
                            {(analysis.player?.name ?? "??").split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <span className="text-zinc-200 font-medium group-hover:text-emerald-400 transition-colors">
                            {analysis.player?.name ?? "Desconhecido"}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 text-xs">
                        {analysis.player?.positionDetail ?? analysis.player?.positionCluster ?? "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-emerald-400 text-xs">
                          {analysis.vx.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-red-400 text-xs">
                          {analysis.rx.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-cyan-400 text-xs font-semibold">
                          {algScores.SCN_plus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            analysis.decision === "CONTRATAR" || analysis.decision === "BLINDAR"
                              ? "bg-emerald-400"
                              : analysis.decision === "RECUSAR"
                                ? "bg-red-400"
                                : analysis.decision === "ALERTA_CINZA"
                                  ? "bg-zinc-400"
                                  : "bg-amber-400"
                          }`} />
                          <DecisionBadge decision={analysis.decision} size="sm" />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-600 text-xs">
                        {formatDate(analysis.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
