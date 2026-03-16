import { BarChart3, Calendar, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAnalyticsOverview,
  getContractTimeline,
  getScoutingFunnel,
} from "@/db/queries"
import { getTranslations } from "next-intl/server"
import { DecisionDonut } from "@/components/cortex/DecisionDonut"
import { MonthlyTrendChart } from "@/components/cortex/MonthlyTrendChart"
import { PositionRadialBar } from "@/components/cortex/PositionRadialBar"
import { TopPerformersTable } from "@/components/cortex/TopPerformersTable"
import { ContractTimeline } from "@/components/cortex/ContractTimeline"
import { ScoutingFunnel } from "@/components/cortex/ScoutingFunnel"
import { AnalyticsKPIRow } from "@/components/cortex/AnalyticsKPIRow"

export default async function AnalyticsPage() {
  const t = await getTranslations("analytics")

  const [overview, contractTimeline, scoutingFunnel] = await Promise.all([
    getAnalyticsOverview(),
    getContractTimeline(),
    getScoutingFunnel(),
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
        {/* Date range selector placeholder */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Ultimos 12 meses</span>
        </div>
      </div>

      {!hasData ? (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <TrendingUp className="w-12 h-12 text-zinc-700 mb-4" />
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

          {/* Row 1: Decision Donut + Monthly Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up stagger-2">
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
          </div>

          {/* Row 2: Position Distribution + Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-3">
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

            <Card className="lg:col-span-2 bg-zinc-900/80 border-zinc-800 card-hover">
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

          {/* Row 3: Contract Timeline + Scouting Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up stagger-4">
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
