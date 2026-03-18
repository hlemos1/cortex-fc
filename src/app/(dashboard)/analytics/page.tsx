import { BarChart3, Calendar, TrendingUp, Cpu, Zap, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAnalyticsOverview,
  getContractTimeline,
  getScoutingFunnel,
  getAgentCostPerWeek,
  getOrgUsageThisMonth,
} from "@/db/queries"
import {
  getAnalysesPerDayByOrg,
  getOrgScnTrend,
} from "@/db/queries/analytics"
import { getTranslations } from "next-intl/server"
import { getAuthSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { DecisionDonut } from "@/components/cortex/DecisionDonut"
import { MonthlyTrendChart } from "@/components/cortex/MonthlyTrendChart"
import { PositionRadialBar } from "@/components/cortex/PositionRadialBar"
import { TopPerformersTable } from "@/components/cortex/TopPerformersTable"
import { ContractTimeline } from "@/components/cortex/ContractTimeline"
import { ScoutingFunnel } from "@/components/cortex/ScoutingFunnel"
import { AnalyticsKPIRow } from "@/components/cortex/AnalyticsKPIRow"
import { AnalysesPerDayChart } from "@/components/cortex/AnalysesPerDayChart"
import { AgentCostChart } from "@/components/cortex/AgentCostChart"
import { ScnTrendChart } from "@/components/cortex/ScnTrendChart"

export default async function AnalyticsPage() {
  const t = await getTranslations("analytics")
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const [
    overview,
    contractTimeline,
    scoutingFunnel,
    analysesPerDay,
    agentCost,
    orgUsage,
    scnTrend,
  ] = await Promise.all([
    getAnalyticsOverview(session.orgId),
    getContractTimeline(session.orgId),
    getScoutingFunnel(session.orgId),
    getAnalysesPerDayByOrg(session.orgId),
    getAgentCostPerWeek(session.orgId),
    getOrgUsageThisMonth(session.orgId),
    getOrgScnTrend(session.orgId),
  ])

  const hasData = overview.totalAnalyses > 0

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t("subtitle")}
          </p>
        </div>
        {/* Date range indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Ultimos 12 meses</span>
        </div>
      </div>

      {!hasData ? (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <TrendingUp className="w-12 h-12 text-zinc-500 mb-4" />
            <p className="text-zinc-500 text-sm">{t("noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Row */}
          <AnalyticsKPIRow
            totalPlayers={overview.totalPlayers}
            totalAnalyses={overview.totalAnalyses}
            avgVx={overview.avgVx}
            avgRx={overview.avgRx}
            avgSCNPlus={overview.avgSCNPlus}
          />

          {/* Usage stats (this month) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up stagger-1">
            <div className="rounded-xl border bg-zinc-900/80 border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center ring-1 ring-white/5">
                  <BarChart3 className="w-4.5 h-4.5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Analises este mes</p>
                  <p className="text-xl font-bold font-mono tracking-tight text-cyan-400">{orgUsage.analyses}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-zinc-900/80 border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center ring-1 ring-white/5">
                  <Cpu className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Agentes executados</p>
                  <p className="text-xl font-bold font-mono tracking-tight text-violet-400">{orgUsage.agentRuns}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-zinc-900/80 border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center ring-1 ring-white/5">
                  <Zap className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Tokens consumidos</p>
                  <p className="text-xl font-bold font-mono tracking-tight text-amber-400">{orgUsage.tokensUsed.toLocaleString("pt-BR")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 1: Analyses per day + Agent cost */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up stagger-2">
            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center ring-1 ring-cyan-500/20">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Analises por dia (30 dias)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AnalysesPerDayChart data={analysesPerDay} />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Custo de agentes por semana
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AgentCostChart data={agentCost} />
              </CardContent>
            </Card>
          </div>

          {/* Row 2: SCN+ Trend + Decision Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up stagger-3">
            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20">
                    <Brain className="w-4 h-4 text-purple-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Tendencia SCN+ (media semanal)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ScnTrendChart data={scnTrend} />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    {t("decisionsTitle")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <DecisionDonut data={overview.decisionsBreakdown} />
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Monthly Trend + Positions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up stagger-4">
            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center ring-1 ring-cyan-500/20">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    {t("monthlyTitle")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart data={overview.monthlyAnalyses} />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  {t("positionsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PositionRadialBar data={overview.positionDistribution} />
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Top Performers */}
          <div className="animate-slide-up stagger-5">
            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  {t("topPerformersTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopPerformersTable data={overview.topPerformers} />
              </CardContent>
            </Card>
          </div>

          {/* Row 5: Contract Timeline + Scouting Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up stagger-6">
            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  {t("contractsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContractTimeline data={contractTimeline} />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-300">
                  {t("scoutingTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScoutingFunnel data={scoutingFunnel} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
