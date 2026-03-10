"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Crosshair,
  Filter,
  GitCompare,
  Kanban,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import type { ScoutingPlayerUI } from "@/lib/db-transforms"

// ============================================
// Scouting pipeline stages
// ============================================
type PipelineStage = "Identificado" | "Em Analise" | "Negociacao" | "Descartado"

interface PipelinePlayer {
  player: ScoutingPlayerUI
  stage: PipelineStage
  scn?: number
  decision?: string
  vx?: number
  rx?: number
}

const stageConfig: Record<PipelineStage, { color: string; bgColor: string; borderColor: string; icon: React.ElementType; gradient: string }> = {
  "Identificado": { color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", icon: Eye, gradient: "from-blue-500/20 to-blue-600/5" },
  "Em Analise": { color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", icon: Search, gradient: "from-amber-500/20 to-amber-600/5" },
  "Negociacao": { color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", icon: MessageSquare, gradient: "from-emerald-500/20 to-emerald-600/5" },
  "Descartado": { color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", icon: XCircle, gradient: "from-red-500/20 to-red-600/5" },
}

const stageLabels: Record<PipelineStage, string> = {
  "Identificado": "Identificado",
  "Em Analise": "Em Analise",
  "Negociacao": "Negociacao",
  "Descartado": "Descartado",
}

function assignStage(player: ScoutingPlayerUI): PipelineStage {
  // Heuristic assignment based on decision
  if (!player.decision) return "Identificado"
  switch (player.decision) {
    case "CONTRATAR": return "Negociacao"
    case "BLINDAR": return "Negociacao"
    case "MONITORAR": return "Em Analise"
    case "RECUSAR": return "Descartado"
    case "ALERTA_CINZA": return "Em Analise"
    case "EMPRESTIMO": return "Em Analise"
    default: return "Identificado"
  }
}

interface Props {
  scoutingTargets: ScoutingPlayerUI[]
}

export function ScoutingClient({ scoutingTargets }: Props) {
  const [search, setSearch] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"targets" | "compare" | "pipeline">("targets")

  const positions = useMemo(
    () => [...new Set(scoutingTargets.map((p) => p.positionCluster))].sort(),
    [scoutingTargets]
  )

  const filtered = useMemo(() => {
    let result = scoutingTargets

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q)
      )
    }

    if (positionFilter) {
      result = result.filter((p) => p.positionCluster === positionFilter)
    }

    result = result.filter(
      (p) => p.marketValue >= priceRange[0] && p.marketValue <= priceRange[1]
    )

    return result
  }, [scoutingTargets, search, positionFilter, priceRange])

  // Pipeline data
  const pipelinePlayers = useMemo(() => {
    return scoutingTargets.map((player) => ({
      player,
      stage: assignStage(player),
      scn: player.scn,
      decision: player.decision,
      vx: player.vx,
      rx: player.rx,
    }))
  }, [scoutingTargets])

  const pipelineByStage = useMemo(() => {
    const stages: Record<PipelineStage, PipelinePlayer[]> = {
      "Identificado": [],
      "Em Analise": [],
      "Negociacao": [],
      "Descartado": [],
    }
    pipelinePlayers.forEach((pp) => {
      stages[pp.stage].push(pp)
    })
    return stages
  }, [pipelinePlayers])

  // Selected players for comparison
  const selectedPlayers = useMemo(() => {
    return selectedForCompare
      .map((id) => scoutingTargets.find((p) => p.id === id))
      .filter(Boolean) as ScoutingPlayerUI[]
  }, [selectedForCompare, scoutingTargets])

  function toggleCompareSelection(playerId: string) {
    setSelectedForCompare((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId)
      }
      if (prev.length >= 3) return prev
      return [...prev, playerId]
    })
  }

  const tabs = [
    { id: "targets" as const, label: "Alvos", icon: Crosshair },
    { id: "compare" as const, label: "Comparar", icon: GitCompare },
    { id: "pipeline" as const, label: "Pipeline", icon: Kanban },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Scouting Intelligence
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Identificacao, analise e pipeline de alvos de mercado
          </p>
        </div>
        {selectedForCompare.length >= 2 && (
          <Link href={`/scouting/compare?ids=${selectedForCompare.join(",")}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all hover:shadow-emerald-900/40 hover:-translate-y-0.5">
              <GitCompare className="w-4 h-4 mr-2" />
              Comparar ({selectedForCompare.length})
            </Button>
          </Link>
        )}
      </div>

      {/* Tab Navigation - Premium with animated indicator */}
      <div className="relative flex gap-1 glass rounded-xl p-1.5 w-fit animate-slide-up stagger-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "text-emerald-400 bg-zinc-800/80 shadow-lg shadow-emerald-900/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
              }`}
            >
              {isActive && (
                <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              )}
              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : ""}`} />
              {tab.label}
              {tab.id === "compare" && selectedForCompare.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                  {selectedForCompare.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filters - Glassmorphism */}
      <div className="glass rounded-xl p-4 animate-slide-up stagger-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Buscar alvo por nome, clube ou posicao..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-200 placeholder:text-zinc-600 rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-700/40 bg-zinc-800/40 backdrop-blur-sm px-3 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Todas Posicoes</option>
              {positions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 whitespace-nowrap font-medium">Valor:</span>
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="w-20 h-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono rounded-lg"
                placeholder="Min"
              />
              <span className="text-zinc-600">-</span>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-20 h-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono rounded-lg"
                placeholder="Max"
              />
              <span className="text-xs text-zinc-600">&euro;</span>
            </div>
            {(search || positionFilter || priceRange[0] > 0 || priceRange[1] < 200) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setPositionFilter(""); setPriceRange([0, 200]) }}
                className="text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
              >
                <Filter className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TARGETS TAB */}
      {/* ============================================ */}
      {activeTab === "targets" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                {filtered.length} alvos encontrados
              </p>
            </div>
            <p className="text-xs text-zinc-600">
              Selecione 2-3 jogadores para comparar
            </p>
          </div>

          <Card className="bg-zinc-900/80 border-zinc-800/80 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      <th className="text-left py-3.5 px-4 w-10">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Sel
                        </span>
                      </th>
                      <th className="text-left py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Jogador
                        </span>
                      </th>
                      <th className="text-left py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Posicao
                        </span>
                      </th>
                      <th className="text-left py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Clube
                        </span>
                      </th>
                      <th className="text-center py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Idade
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Valor (M&euro;)
                        </span>
                      </th>
                      <th className="text-center py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Vx
                        </span>
                      </th>
                      <th className="text-center py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Rx
                        </span>
                      </th>
                      <th className="text-center py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          SCN+
                        </span>
                      </th>
                      <th className="text-center py-3.5 px-3">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Decisao
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((player, idx) => {
                      const isSelected = selectedForCompare.includes(player.id)
                      return (
                        <tr
                          key={player.id}
                          className={`border-b border-zinc-800/30 transition-all duration-200 group ${
                            isSelected
                              ? "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] border-l-2 border-l-emerald-500"
                              : `hover:bg-emerald-500/[0.03] border-l-2 border-l-transparent hover:border-l-zinc-600 ${
                                  idx % 2 === 0 ? "bg-transparent" : "bg-zinc-800/[0.12]"
                                }`
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleCompareSelection(player.id)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/30"
                                  : "border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <Link
                              href={`/players/${player.id}`}
                              className="flex items-center gap-2 group/link"
                            >
                              <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center border border-zinc-700/50 group-hover/link:border-emerald-500/30 transition-colors">
                                <User className="w-4 h-4 text-zinc-500" />
                              </div>
                              <div>
                                <span className="text-zinc-200 font-medium group-hover/link:text-emerald-400 transition-colors">
                                  {player.name}
                                </span>
                                <p className="text-[11px] text-zinc-600">{player.nationality}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-zinc-400 text-xs">
                            {player.position}
                            <span className="ml-1 text-zinc-600">({player.positionCluster})</span>
                          </td>
                          <td className="py-3 px-3 text-zinc-400 text-xs">{player.club}</td>
                          <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">
                            {player.age}
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-300 font-mono text-xs">
                            &euro;{player.marketValue}M
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.vx !== undefined ? (
                              <span className="font-mono text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-500/[0.08]">
                                {player.vx.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-zinc-700 text-xs">--</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.rx !== undefined ? (
                              <span className="font-mono text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-500/[0.08]">
                                {player.rx.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-zinc-700 text-xs">--</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.scn !== undefined ? (
                              <span className="font-mono text-cyan-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/[0.08]">
                                {player.scn}
                              </span>
                            ) : (
                              <span className="text-zinc-700 text-xs">--</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.decision ? (
                              <DecisionBadge decision={player.decision} size="sm" />
                            ) : (
                              <span className="text-zinc-700 text-xs">Sem analise</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-zinc-600 text-sm">
                  Nenhum alvo encontrado com os filtros atuais.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================ */}
      {/* COMPARE TAB */}
      {/* ============================================ */}
      {activeTab === "compare" && (
        <div className="space-y-6 animate-fade-in">
          {selectedPlayers.length < 2 ? (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                  <GitCompare className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="text-zinc-400 text-sm">
                  Selecione 2-3 jogadores na aba &quot;Alvos&quot; para comparar seus perfis neurais
                </p>
                <Button
                  variant="ghost"
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 mt-4"
                  onClick={() => setActiveTab("targets")}
                >
                  Ir para Alvos
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Comparando {selectedPlayers.length} jogadores
                </p>
                <Link href={`/scouting/compare?ids=${selectedForCompare.join(",")}`}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-lg shadow-emerald-900/20">
                    Abrir comparacao completa
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Radar Charts Side by Side */}
              <Card className="bg-zinc-900/80 border-zinc-800/80 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Camadas Neurais --- Comparacao
                  </CardTitle>
                  <p className="text-xs text-zinc-600">
                    Perfis das 7 camadas neurais lado a lado
                  </p>
                </CardHeader>
                <CardContent>
                  <div className={`grid gap-4 ${selectedPlayers.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {selectedPlayers.map((player, idx) => {
                      if (!player) return null
                      const isGlowing = true
                      return (
                        <div
                          key={player.id}
                          className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-300 ${
                            isGlowing
                              ? "border-emerald-500/20 bg-emerald-500/[0.02] shadow-lg shadow-emerald-900/10"
                              : "border-zinc-800"
                          }`}
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          {player.layers ? (
                            <NeuralRadar
                              layers={player.layers}
                              playerName={player.name}
                              scnScore={player.scn}
                              size={260}
                            />
                          ) : (
                            <div className="w-[260px] h-[260px] flex items-center justify-center text-zinc-600 text-xs">
                              Sem dados neurais
                            </div>
                          )}
                          <div className="mt-2">
                            {player.decision && (
                              <DecisionBadge decision={player.decision} size="sm" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Comparison */}
              <Card className="bg-zinc-900/80 border-zinc-800/80 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Metricas Comparativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                          <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            Metrica
                          </th>
                          {selectedPlayers.map((p) => (
                            <th key={p.id} className="text-center py-2.5 px-3 text-xs font-medium text-zinc-300">
                              {p.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Idade", getter: (p: ScoutingPlayerUI) => `${p.age} anos` },
                          { label: "Valor de Mercado", getter: (p: ScoutingPlayerUI) => `\u20AC${p.marketValue}M` },
                          { label: "Vx (Valor)", getter: (p: ScoutingPlayerUI) => p.vx?.toFixed(2) ?? "--", colorClass: "text-emerald-400" },
                          { label: "Rx (Risco)", getter: (p: ScoutingPlayerUI) => p.rx?.toFixed(2) ?? "--", colorClass: "text-red-400" },
                          { label: "SCN+", getter: (p: ScoutingPlayerUI) => p.scn?.toString() ?? "--", colorClass: "text-cyan-400" },
                          { label: "Contrato ate", getter: (p: ScoutingPlayerUI) => p.contractEnd },
                          { label: "Salario (M\u20AC/ano)", getter: (p: ScoutingPlayerUI) => `\u20AC${p.salary}M` },
                        ].map((metric, mIdx) => (
                          <tr
                            key={metric.label}
                            className={`border-b border-zinc-800/30 transition-colors hover:bg-emerald-500/[0.03] ${
                              mIdx % 2 === 1 ? "bg-zinc-800/[0.1]" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3 text-xs text-zinc-500">{metric.label}</td>
                            {selectedPlayers.map((p) => (
                              <td key={p.id} className={`py-2.5 px-3 text-center font-mono text-xs ${metric.colorClass ?? "text-zinc-300"}`}>
                                {metric.getter(p)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* PIPELINE TAB */}
      {/* ============================================ */}
      {activeTab === "pipeline" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Pipeline de Scouting --- {pipelinePlayers.length} alvos no funil
            </p>
          </div>

          {/* Stage connection line (desktop) */}
          <div className="hidden lg:block relative">
            <div className="absolute top-5 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/20 via-amber-500/20 via-emerald-500/20 to-red-500/20 z-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {(Object.entries(pipelineByStage) as [PipelineStage, PipelinePlayer[]][]).map(
              ([stage, players], stageIdx) => {
                const config = stageConfig[stage]
                const StageIcon = config.icon
                return (
                  <div
                    key={stage}
                    className="space-y-3 animate-slide-up"
                    style={{ animationDelay: `${stageIdx * 100}ms` }}
                  >
                    {/* Column Header with gradient */}
                    <div
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} backdrop-blur-sm`}
                    >
                      <StageIcon className={`w-4 h-4 ${config.color}`} />
                      <span className={`text-sm font-semibold ${config.color}`}>
                        {stageLabels[stage]}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`ml-auto ${config.bgColor} ${config.color} border ${config.borderColor} text-[10px] px-2 py-0.5 font-bold shadow-sm`}
                      >
                        {players.length}
                      </Badge>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {players.map((pp, cardIdx) => (
                        <Card
                          key={pp.player.id}
                          className="bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 p-3 card-hover group"
                          style={{ animationDelay: `${(stageIdx * 100) + (cardIdx * 50)}ms` }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center flex-shrink-0 border border-zinc-700/50 group-hover:border-zinc-600 transition-colors">
                              <User className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                                {pp.player.name}
                              </p>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                {pp.player.position} &middot; {pp.player.club}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] text-zinc-600">
                                  {pp.player.age} anos
                                </span>
                                <span className="text-[10px] text-zinc-300 font-mono">
                                  &euro;{pp.player.marketValue}M
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {pp.scn !== undefined && (
                                  <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/[0.08]">
                                    SCN+ {pp.scn}
                                  </span>
                                )}
                                {pp.vx !== undefined && (
                                  <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/[0.08]">
                                    Vx {pp.vx.toFixed(2)}
                                  </span>
                                )}
                                {pp.rx !== undefined && (
                                  <span className="text-[10px] font-mono text-red-400 px-1.5 py-0.5 rounded bg-red-500/[0.08]">
                                    Rx {pp.rx.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {pp.decision && (
                                <div className="mt-2">
                                  <DecisionBadge
                                    decision={pp.decision as Parameters<typeof DecisionBadge>[0]["decision"]}
                                    size="sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                      {players.length === 0 && (
                        <div className="py-8 text-center text-zinc-700 text-xs border border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/30">
                          Nenhum alvo nesta etapa
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </div>
      )}
    </div>
  )
}
