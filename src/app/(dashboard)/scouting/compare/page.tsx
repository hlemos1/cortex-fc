"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  GitCompare,
  TrendingUp,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import { AlgorithmBars } from "@/components/cortex/AlgorithmBars"
import { VxRxScatter } from "@/components/cortex/VxRxScatter"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { mockPlayers, getLatestAnalysis, getDecisionColor } from "@/lib/mock-data"
import type { CortexDecision, NeuralLayers } from "@/types/cortex"

const radarColors = ["#10b981", "#3b82f6", "#f59e0b"]

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-zinc-500 text-sm">Carregando comparação...</div></div>}>
      <CompareContent />
    </Suspense>
  )
}

function CompareContent() {
  const searchParams = useSearchParams()
  const ids = searchParams.get("ids")?.split(",") ?? []

  const players = useMemo(() => {
    return ids
      .map((id) => {
        const player = mockPlayers.find((p) => p.id === id)
        if (!player) return null
        const analysis = getLatestAnalysis(id)
        return {
          ...player,
          scn: analysis?.algorithms.SCN_plus,
          decision: analysis?.decision,
          vx: analysis?.vx,
          rx: analysis?.rx,
          layers: analysis?.layers,
          algorithms: analysis?.algorithms,
          confidence: analysis?.confidence,
          reasoning: analysis?.reasoning,
        }
      })
      .filter(Boolean) as Array<{
        id: string
        name: string
        age: number
        nationality: string
        position: string
        positionCluster: string
        club: string
        marketValue: number
        salary: number
        contractEnd: string
        scn?: number
        decision?: CortexDecision
        vx?: number
        rx?: number
        layers?: NeuralLayers
        algorithms?: import("@/types/cortex").AlgorithmScores
        confidence?: number
        reasoning?: string
      }>
  }, [ids])

  // VxRx scatter data for selected players
  const scatterData = useMemo(() => {
    return players
      .filter((p) => p.vx !== undefined && p.rx !== undefined)
      .map((p) => ({
        name: p.name,
        vx: p.vx!,
        rx: p.rx!,
        decision: p.decision!,
        scn: p.scn,
      }))
  }, [players])

  if (players.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/scouting">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
        </div>
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="py-16 text-center">
            <GitCompare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">
              Nenhum jogador selecionado para comparacao.
            </p>
            <Link href="/scouting">
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                Selecionar Jogadores
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const gridCols =
    players.length === 1
      ? "grid-cols-1"
      : players.length === 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-3"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/scouting">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Comparacao de Alvos
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Analise lado a lado de {players.length} jogadores
            </p>
          </div>
        </div>
      </div>

      {/* Player Header Cards */}
      <div className={`grid ${gridCols} gap-4`}>
        {players.map((player, idx) => (
          <Card key={player.id} className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${radarColors[idx]}20` }}
                >
                  <User className="w-6 h-6" style={{ color: radarColors[idx] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-zinc-100 truncate">{player.name}</p>
                  <p className="text-xs text-zinc-500">
                    {player.position} &middot; {player.club} &middot; {player.age} anos
                  </p>
                  <p className="text-xs text-zinc-600">{player.nationality}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-bold font-mono text-zinc-100">
                    &euro;{player.marketValue}M
                  </span>
                  {player.decision && (
                    <DecisionBadge decision={player.decision} size="sm" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics Comparison Table */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Metricas Chave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Metrica
                  </th>
                  {players.map((p, idx) => (
                    <th key={p.id} className="text-center py-2 px-3 text-xs font-medium" style={{ color: radarColors[idx] }}>
                      {p.name.split(" ").pop()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Idade", getter: (p: typeof players[0]) => `${p.age}`, unit: "anos" },
                  { label: "Valor de Mercado", getter: (p: typeof players[0]) => `\u20AC${p.marketValue}M`, unit: "" },
                  { label: "Salario Anual", getter: (p: typeof players[0]) => `\u20AC${p.salary}M`, unit: "" },
                  { label: "Contrato ate", getter: (p: typeof players[0]) => p.contractEnd.slice(0, 7), unit: "" },
                  { label: "Vx (Valor)", getter: (p: typeof players[0]) => p.vx?.toFixed(2) ?? "--", colorClass: "text-emerald-400" },
                  { label: "Rx (Risco)", getter: (p: typeof players[0]) => p.rx?.toFixed(2) ?? "--", colorClass: "text-red-400" },
                  { label: "SCN+", getter: (p: typeof players[0]) => p.scn?.toString() ?? "--", colorClass: "text-cyan-400" },
                  { label: "Confianca", getter: (p: typeof players[0]) => p.confidence ? `${p.confidence}%` : "--", colorClass: "text-amber-400" },
                ].map((metric) => (
                  <tr key={metric.label} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-2.5 px-3 text-xs text-zinc-500">{metric.label}</td>
                    {players.map((p) => (
                      <td
                        key={p.id}
                        className={`py-2.5 px-3 text-center font-mono text-xs font-semibold ${
                          metric.colorClass ?? "text-zinc-300"
                        }`}
                      >
                        {metric.getter(p)} {metric.unit}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Neural Radar Charts */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Camadas Neurais — 7 Dimensoes
          </CardTitle>
          <p className="text-xs text-zinc-600">
            Perfil completo de cada jogador nas 7 camadas do sistema Cortex
          </p>
        </CardHeader>
        <CardContent>
          <div className={`grid ${gridCols} gap-6`}>
            {players.map((player, idx) => (
              <div key={player.id} className="flex flex-col items-center">
                {player.layers && (
                  <NeuralRadar
                    layers={player.layers}
                    playerName={player.name}
                    scnScore={player.scn}
                    size={280}
                  />
                )}
                {!player.layers && (
                  <div className="w-[280px] h-[280px] flex items-center justify-center">
                    <p className="text-zinc-600 text-xs">Sem dados neurais</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Layer-by-layer comparison */}
          {players.every((p) => p.layers) && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Camada
                    </th>
                    {players.map((p, idx) => (
                      <th key={p.id} className="text-center py-2 px-3 text-xs font-medium" style={{ color: radarColors[idx] }}>
                        {p.name.split(" ").pop()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {([
                    ["C1_technical", "C1 Tecnico"],
                    ["C2_tactical", "C2 Tatico"],
                    ["C3_physical", "C3 Fisico"],
                    ["C4_behavioral", "C4 Comportamental"],
                    ["C5_narrative", "C5 Narrativa"],
                    ["C6_economic", "C6 Economico"],
                    ["C7_ai", "C7 IA"],
                  ] as [keyof NeuralLayers, string][]).map(([key, label]) => {
                    const values = players.map((p) => p.layers?.[key] ?? 0)
                    const maxVal = Math.max(...values)
                    return (
                      <tr key={key} className="border-b border-zinc-800/50">
                        <td className="py-2 px-3 text-xs text-zinc-500">{label}</td>
                        {players.map((p, idx) => {
                          const val = p.layers?.[key] ?? 0
                          const isMax = val === maxVal && values.filter((v) => v === maxVal).length === 1
                          return (
                            <td key={p.id} className="py-2 px-3 text-center">
                              <span
                                className={`font-mono text-xs font-semibold ${
                                  isMax ? "text-emerald-400" : "text-zinc-400"
                                }`}
                              >
                                {val}
                              </span>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${val}%`,
                                    backgroundColor: radarColors[idx],
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Algorithm Bars */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-300">
            Algoritmos Proprietarios
          </CardTitle>
          <p className="text-xs text-zinc-600">
            Scores dos 7 algoritmos do sistema Cortex para cada jogador
          </p>
        </CardHeader>
        <CardContent>
          <div className={`grid ${gridCols} gap-6`}>
            {players.map((player) => (
              <div key={player.id}>
                <p className="text-sm font-semibold text-zinc-200 mb-3 text-center">
                  {player.name}
                </p>
                {player.algorithms ? (
                  <AlgorithmBars scores={player.algorithms} />
                ) : (
                  <div className="py-8 text-center text-zinc-600 text-xs">
                    Sem dados de algoritmos
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* VxRx Scatter — Position in Decision Space */}
      {scatterData.length > 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300">
              Posicao no Espaco Decisorio VxRx
            </CardTitle>
            <p className="text-xs text-zinc-600">
              Onde cada alvo se posiciona na matriz de valor vs risco
            </p>
          </CardHeader>
          <CardContent>
            <VxRxScatter data={scatterData} height={350} />
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {(["CONTRATAR", "BLINDAR", "MONITORAR", "RECUSAR", "ALERTA_CINZA"] as const).map(
                (d) => (
                  <DecisionBadge key={d} decision={d} size="sm" />
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reasoning / AI Insights */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-300">
            Parecer Neural — Reasoning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${gridCols} gap-4`}>
            {players.map((player, idx) => (
              <div
                key={player.id}
                className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: radarColors[idx] }}
                  />
                  <p className="text-sm font-semibold text-zinc-200">{player.name}</p>
                </div>
                {player.reasoning ? (
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {player.reasoning}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-600">Sem parecer disponivel.</p>
                )}
                {player.decision && (
                  <div className="mt-3 flex items-center gap-2">
                    <DecisionBadge decision={player.decision} size="sm" />
                    {player.confidence && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {player.confidence}% confianca
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
