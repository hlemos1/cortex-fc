"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  FileText,
  Filter,
  CalendarDays,
  TrendingUp,
  Percent,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { getDecisionColor } from "@/lib/db-transforms"
import type { AnalysisUI } from "@/lib/db-transforms"
import type { CortexDecision } from "@/types/cortex"

const decisionFilters: { label: string; value: CortexDecision | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Blindar", value: "BLINDAR" },
  { label: "Monitorar", value: "MONITORAR" },
  { label: "Recusar", value: "RECUSAR" },
  { label: "Contratar", value: "CONTRATAR" },
  { label: "Emprestimo", value: "EMPRESTIMO" },
  { label: "Alerta Cinza", value: "ALERTA_CINZA" },
]

interface Props {
  analyses: AnalysisUI[]
}

export function ReportsClient({ analyses }: Props) {
  const [decisionFilter, setDecisionFilter] = useState<CortexDecision | "ALL">("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filteredReports = useMemo(() => {
    return analyses.filter((a) => {
      if (decisionFilter !== "ALL" && a.decision !== decisionFilter) return false
      if (dateFrom && a.date < dateFrom) return false
      if (dateTo && a.date > dateTo) return false
      return true
    })
  }, [analyses, decisionFilter, dateFrom, dateTo])

  const totalReports = analyses.length

  const reportsThisMonth = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return analyses.filter((a) => {
      const d = new Date(a.createdAt)
      return d.getMonth() === month && d.getFullYear() === year
    }).length
  }, [analyses])

  const averageConfidence = useMemo(() => {
    if (analyses.length === 0) return 0
    return Math.round(
      analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
    )
  }, [analyses])

  const statsCards = [
    {
      title: "Total Relatorios",
      value: totalReports,
      icon: FileText,
      subtitle: "Pareceres gerados",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Este Mes",
      value: reportsThisMonth,
      icon: CalendarDays,
      subtitle: "Relatorios recentes",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Confianca Media",
      value: `${averageConfidence}%`,
      icon: Percent,
      subtitle: "Score de confianca ORACLE",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Relatorios
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Central de relatorios e pareceres ORACLE
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-zinc-900/80 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1 font-mono">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              Filtros
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Decision filter */}
            <div className="flex flex-wrap gap-2">
              {decisionFilters.map((df) => {
                const isActive = decisionFilter === df.value
                return (
                  <button
                    key={df.value}
                    onClick={() => setDecisionFilter(df.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
                      isActive
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {df.label}
                  </button>
                )
              })}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-zinc-600">De:</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36 h-8 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 text-xs"
              />
              <span className="text-xs text-zinc-600">Ate:</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36 h-8 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((analysis) => {
          return (
            <Card
              key={analysis.id}
              className="bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 flex-shrink-0 border border-zinc-700">
                      {(analysis.player?.name ?? "?")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {analysis.player?.name ?? "—"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {analysis.player?.position} — {analysis.player?.club}
                      </p>
                    </div>
                  </div>
                  <DecisionBadge decision={analysis.decision} size="sm" />
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                  {analysis.reasoning}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-600 uppercase">Vx</span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {analysis.vx.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-600 uppercase">Rx</span>
                    <span className="text-xs font-mono text-red-400 font-semibold">
                      {analysis.rx.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-600 uppercase">SCN+</span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">
                      {analysis.algorithms.SCN_plus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <TrendingUp className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs font-mono text-zinc-400">
                      {analysis.confidence}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-600">{analysis.date}</span>
                  <Link href={`/reports/${analysis.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-8 gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Relatorio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredReports.length === 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">Nenhum relatorio encontrado com os filtros selecionados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
