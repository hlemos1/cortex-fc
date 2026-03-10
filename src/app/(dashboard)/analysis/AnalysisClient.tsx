"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Activity, Filter, ArrowUpDown, ChevronUp, ChevronDown, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VxRxScatter } from "@/components/cortex/VxRxScatter"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import type { AnalysisUI } from "@/lib/db-transforms"
import type { CortexDecision } from "@/types/cortex"

type SortField = "date" | "vx" | "rx" | "scn" | "name"
type SortDir = "asc" | "desc"

interface Props {
  analyses: AnalysisUI[]
}

export function AnalysisClient({ analyses }: Props) {
  const [clubFilter, setClubFilter] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [decisionFilter, setDecisionFilter] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const clubs = useMemo(
    () => [...new Set(analyses.map((a) => a.player?.club).filter(Boolean))].sort() as string[],
    [analyses]
  )
  const positions = useMemo(
    () => [...new Set(analyses.map((a) => a.player?.positionCluster).filter(Boolean))].sort() as string[],
    [analyses]
  )
  const decisions: CortexDecision[] = ["CONTRATAR", "BLINDAR", "MONITORAR", "EMPRESTIMO", "RECUSAR", "ALERTA_CINZA"]

  const filtered = useMemo(() => {
    let result = [...analyses]

    if (clubFilter) result = result.filter((a) => a.player?.club === clubFilter)
    if (positionFilter) result = result.filter((a) => a.player?.positionCluster === positionFilter)
    if (decisionFilter) result = result.filter((a) => a.decision === decisionFilter)

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "date": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
        case "vx": cmp = a.vx - b.vx; break
        case "rx": cmp = a.rx - b.rx; break
        case "scn": cmp = a.algorithms.SCN_plus - b.algorithms.SCN_plus; break
        case "name": cmp = (a.player?.name ?? "").localeCompare(b.player?.name ?? ""); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [analyses, clubFilter, positionFilter, decisionFilter, sortField, sortDir])

  const scatterData = filtered.map((a) => ({
    name: a.player?.name ?? "---",
    vx: a.vx,
    rx: a.rx,
    decision: a.decision,
    scn: a.algorithms.SCN_plus,
  }))

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    const isActive = sortField === field
    return (
      <button
        onClick={() => toggleSort(field)}
        className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-all group ${
          isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        {children}
        <span className={`flex flex-col -space-y-1 transition-opacity ${isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`}>
          {isActive && sortDir === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : isActive && sortDir === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ArrowUpDown className="w-3 h-3" />
          )}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            ORACLE — Analises Neurais
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Interface de visualizacao e gestao de analises VxRx
          </p>
        </div>
        <Link href="/analysis/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all hover:shadow-emerald-900/40 hover:-translate-y-0.5">
            <Activity className="w-4 h-4 mr-2" />
            Nova Analise
          </Button>
        </Link>
      </div>

      {/* Filters - Glassmorphism */}
      <div className="glass rounded-xl p-4 animate-slide-up stagger-1">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 mr-2">
            <Filter className="w-3.5 h-3.5 text-emerald-500/70" />
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Filtros</span>
          </div>
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="h-8 rounded-lg border border-zinc-700/50 bg-zinc-800/60 backdrop-blur-sm px-3 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          >
            <option value="">Todos Clubes</option>
            {clubs.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="h-8 rounded-lg border border-zinc-700/50 bg-zinc-800/60 backdrop-blur-sm px-3 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          >
            <option value="">Todas Posicoes</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="h-8 rounded-lg border border-zinc-700/50 bg-zinc-800/60 backdrop-blur-sm px-3 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          >
            <option value="">Todas Decisoes</option>
            {decisions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {(clubFilter || positionFilter || decisionFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setClubFilter(""); setPositionFilter(""); setDecisionFilter("") }}
              className="text-zinc-500 hover:text-emerald-400 text-xs h-8 hover:bg-emerald-500/10 transition-all"
            >
              <Filter className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
            <span className="text-xs text-zinc-500 font-mono">
              {filtered.length} analise{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* VxRx Scatter */}
      <Card className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-2 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-300">
            Mapa VxRx — Espaco Decisorio
          </CardTitle>
          <p className="text-xs text-zinc-600">
            Cada ponto representa uma analise neural. Passe o mouse para detalhes.
          </p>
        </CardHeader>
        <CardContent>
          <VxRxScatter data={scatterData} height={450} />
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {decisions.map((d) => (
              <DecisionBadge key={d} decision={d} size="sm" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Table */}
      <Card className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-3 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-300">Todas as Analises</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left py-3.5 px-4">
                    <SortHeader field="name">Jogador</SortHeader>
                  </th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Posicao
                  </th>
                  <th className="text-left py-3.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Clube
                  </th>
                  <th className="text-center py-3.5 px-3">
                    <SortHeader field="vx">Vx</SortHeader>
                  </th>
                  <th className="text-center py-3.5 px-3">
                    <SortHeader field="rx">Rx</SortHeader>
                  </th>
                  <th className="text-center py-3.5 px-3">
                    <SortHeader field="scn">SCN+</SortHeader>
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Decisao
                  </th>
                  <th className="text-center py-3.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Confianca
                  </th>
                  <th className="text-right py-3.5 px-4">
                    <SortHeader field="date">Data</SortHeader>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((analysis, idx) => (
                  <tr
                    key={analysis.id}
                    className={`border-b border-zinc-800/30 transition-all duration-200 hover:bg-emerald-500/[0.03] group ${
                      idx % 2 === 0 ? "bg-transparent" : "bg-zinc-800/[0.15]"
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/players/${analysis.player?.id}`}
                        className="text-zinc-200 font-medium hover:text-emerald-400 transition-colors"
                      >
                        {analysis.player?.name ?? "---"}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-xs">
                      {analysis.player?.position}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-xs">{analysis.player?.club}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-emerald-400 text-xs px-2 py-0.5 rounded-md bg-emerald-500/[0.08]">
                        {analysis.vx.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-red-400 text-xs px-2 py-0.5 rounded-md bg-red-500/[0.08]">
                        {analysis.rx.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-cyan-400 text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-500/[0.08]">
                        {analysis.algorithms.SCN_plus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <DecisionBadge decision={analysis.decision} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-8 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                            style={{ width: `${analysis.confidence}%` }}
                          />
                        </div>
                        <span className="text-zinc-500 text-xs font-mono">{analysis.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-600 text-xs">
                      {analysis.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
