import {
  Activity,
  Cpu,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VxRxScatter } from "@/components/cortex/VxRxScatter"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { getDashboardStats, getAnalyses, getPlayers } from "@/db/queries"
import { toScatterPoint, toAlgorithmScores, formatDate } from "@/lib/db-transforms"
import { AlertsPanel } from "../AlertsPanel"
import type { Alert } from "../AlertsPanel"
import { BoardAdvisorWidget } from "@/components/cortex/BoardAdvisorWidget"
import { ActivityFeed } from "@/components/cortex/ActivityFeed"
import { StaggeredStats } from "./StaggeredStats"
import { DashboardTour } from "@/components/cortex/DashboardTour"
import { WelcomeModal } from "@/components/cortex/WelcomeModal"
import { getTranslations } from "next-intl/server"

export default async function DashboardPage() {
  const t = await getTranslations("dashboard")
  const tc = await getTranslations("common")
  const tn = await getTranslations("nav")

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
      title: t("totalPlayers"),
      value: stats.totalPlayers,
      iconName: "users" as const,
      change: t("changeThisMonth"),
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("analysesPerformed"),
      value: stats.totalAnalyses,
      iconName: "activity" as const,
      change: t("changeThisWeek"),
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: t("scoutingTargets"),
      value: stats.scoutingTargets,
      iconName: "search" as const,
      change: t("priorityTargets"),
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: t("averageSCN"),
      value: stats.averageSCN,
      iconName: "trending" as const,
      change: t("changeVsLastMonth"),
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
  ]

  // Generate activity feed from existing data
  const feedActivities = analyses.slice(0, 15).map((analysis, index) => {
    const playerName = analysis.player?.name ?? "Desconhecido"
    const analystName = analysis.analyst?.name ?? "Sistema"
    const types = ["analysis", "scouting", "report", "agent"] as const
    const type = index < 5 ? "analysis" : types[index % types.length]

    const titleMap: Record<string, string> = {
      analysis: `Analise concluida: ${playerName}`,
      scouting: `Scouting atualizado: ${playerName}`,
      report: `Relatorio gerado: ${playerName}`,
      agent: `Agente processou: ${playerName}`,
    }

    const descMap: Record<string, string> = {
      analysis: `Decisao ${analysis.decision} — SCN+ ${analysis.scnPlus ?? "—"}, Vx ${analysis.vx.toFixed(2)}, Rx ${analysis.rx.toFixed(2)}`,
      scouting: `Nova avaliacao registrada para ${playerName} no pipeline de scouting.`,
      report: `PDF de analise neural gerado com parecer ${analysis.decision}.`,
      agent: `Agente autonomo finalizou processamento de dados para ${playerName}.`,
    }

    return {
      id: `activity-${analysis.id}-${index}`,
      type,
      title: titleMap[type],
      description: descMap[type],
      userName: analystName,
      entityType: "analysis",
      entityId: analysis.id as string,
      createdAt: analysis.createdAt instanceof Date
        ? analysis.createdAt.toISOString()
        : String(analysis.createdAt),
    }
  })

  const scatterData = analyses.map((a) => toScatterPoint(a))

  const recentAnalyses = analyses.slice(0, 8)

  return (
    <div className="animate-fade-in space-y-6">
      <WelcomeModal />
      {/* Page Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t("subtitle", { clubName: "Nottingham Forest FC" })}
          </p>
        </div>
        <Link href="/analysis/new" data-tour="new-analysis">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-emerald-900/40 hover:-translate-y-0.5">
            <Activity className="w-4 h-4 mr-2" />
            {tn("newAnalysis")}
          </Button>
        </Link>
      </div>

      {/* Stats Cards — Staggered Animation */}
      <div data-tour="stats-cards">
        <StaggeredStats stats={statsCards.map((stat, index) => ({
          ...stat,
          borderColor: borderColors[index],
        }))} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-3">
        {/* VxRx Scatter Plot */}
        <Card data-tour="vxrx-scatter" className="lg:col-span-2 bg-zinc-900/80 border-zinc-800 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  {t("vxRxMap")}
                </CardTitle>
                <p className="text-xs text-zinc-600">
                  {t("vxRxDescription")}
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

      {/* Activity Feed */}
      <div className="animate-slide-up stagger-5">
        <ActivityFeed activities={feedActivities} maxItems={8} />
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
                {t("recentAnalyses")}
              </CardTitle>
            </div>
            <Link href="/analysis">
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 text-xs">
                {tc("viewAll")}
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
                    {t("playerCol")}
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {t("positionCol")}
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
                    {t("decisionCol")}
                  </th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {t("dateCol")}
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

      {/* Guided Tour — first-time users */}
      <DashboardTour />
    </div>
  )
}
