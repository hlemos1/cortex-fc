"use client"

import {
  Activity,
  Cpu,
  TrendingUp,
  Clock,
  BarChart3,
  Shield,
  FileText,
  Globe,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TabNav } from "@/components/ui/tab-nav"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import { AlgorithmBars } from "@/components/cortex/AlgorithmBars"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { SeasonStats } from "@/components/cortex/SeasonStats"
import { PerformanceChart } from "@/components/cortex/PerformanceChart"
import { PositionHeatmap } from "@/components/cortex/PositionHeatmap"
import { TransferTimeline } from "@/components/cortex/TransferTimeline"
import { AnalysisDiff } from "@/components/cortex/AnalysisDiff"
import type { CortexDecision, NeuralLayers, AlgorithmScores } from "@/types/cortex"

interface ProfileTabsProps {
  vx: number
  rx: number
  decision: string
  confidence: number
  vxComponents: {
    technical: number
    marketImpact: number
    culturalAdaptation: number
    networkingBenefit: number
    ageDepreciation: number
    liabilities: number
    regulatoryRisk: number
    totalCost: number
  }
  rxComponents: {
    tacticalGap: number
    contextualFit: number
    experienceProfile: number
    narrativeIndex: number
    mentalFortitude: number
    injuryMicroRisk: number
    suspensionRisk: number
    marketJitter: number
    valueAtRisk: number
  }
  layers: NeuralLayers
  algorithms: AlgorithmScores
  reasoning: string | null
  playerName: string
  positionCluster: string
  positionDetail?: string
  seasonStats: {
    appearances: number
    minutesPlayed: number
    goals: number
    assists: number
    avgRating: number | null
    xg: number | null
    xa: number | null
    passAccuracy: number | null
    tackles: number
    interceptions: number
    yellowCards: number
    redCards: number
    duelsWonPct: number | null
  } | null
  matchPerformance: Array<{ date: string; rating: number | null; xg: number | null; goals: number }>
  transferHistory: Array<{
    id: string
    date: string
    fromClub: string | null
    toClub: string | null
    fee: number | null
    type: string | null
  }>
  analyses: Array<{
    id: string
    date: string
    vx: number
    rx: number
    decision: string
    confidence: number
    algorithms: AlgorithmScores
  }>
}

export function ProfileTabs({
  vx,
  rx,
  decision,
  confidence,
  vxComponents,
  rxComponents,
  layers,
  algorithms,
  reasoning,
  playerName,
  positionCluster,
  positionDetail,
  seasonStats,
  matchPerformance,
  transferHistory,
  analyses,
}: ProfileTabsProps) {
  const typedDecision = decision as CortexDecision

  const tabs = [
    {
      id: "overview",
      label: "Visao Geral",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: "neural",
      label: "Analise Neural",
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: "performance",
      label: "Performance",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "history",
      label: "Historico",
      icon: <Clock className="w-4 h-4" />,
      count: analyses.length,
    },
  ]

  return (
    <TabNav tabs={tabs} defaultTab="overview">
      {(activeTab) => (
        <>
          {/* Tab: Visao Geral */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* VxRx Score */}
              <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    VxRx Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8 mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold font-mono text-emerald-400">
                        {vx.toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">Vx (Valor)</p>
                    </div>
                    <div className="w-px h-12 bg-zinc-800" />
                    <div className="text-center">
                      <p className="text-3xl font-bold font-mono text-red-400">
                        {rx.toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">Rx (Risco)</p>
                    </div>
                  </div>
                  <Separator className="bg-zinc-800 my-4" />
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 mb-2">Decisao ORACLE</p>
                    <DecisionBadge decision={typedDecision} size="lg" />
                    <p className="text-xs text-zinc-600 mt-2 font-mono">
                      Confianca: {confidence}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Vx Components */}
              <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    Componentes Vx
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "T — Tecnico", value: vxComponents.technical },
                    { label: "M — Impacto Mercado", value: vxComponents.marketImpact },
                    { label: "A — Adaptacao Cultural", value: vxComponents.culturalAdaptation },
                    { label: "N — Networking", value: vxComponents.networkingBenefit },
                    { label: "D — Depreciacao Idade", value: vxComponents.ageDepreciation },
                    { label: "L — Passivos", value: vxComponents.liabilities },
                    { label: "R — Risco Regulatorio", value: vxComponents.regulatoryRisk },
                  ].map((comp) => (
                    <div key={comp.label} className="flex items-center justify-between group">
                      <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{comp.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${comp.value * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-zinc-400 w-6 text-right">
                          {comp.value}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Separator className="bg-zinc-800 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-semibold">C — Custo Total</span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      &euro;{vxComponents.totalCost}M
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Rx Components */}
              <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    Componentes Rx
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Tg — Gap Tatico", value: rxComponents.tacticalGap },
                    { label: "Cx — Fit Contextual", value: rxComponents.contextualFit },
                    { label: "Ep — Experiencia", value: rxComponents.experienceProfile },
                    { label: "Ni — Indice Narrativo", value: rxComponents.narrativeIndex },
                    { label: "Mf — Fortaleza Mental", value: rxComponents.mentalFortitude },
                    { label: "Mi — Risco Lesao", value: rxComponents.injuryMicroRisk },
                    { label: "S — Risco Suspensao", value: rxComponents.suspensionRisk },
                    { label: "Mj — Jitter Mercado", value: rxComponents.marketJitter },
                  ].map((comp) => (
                    <div key={comp.label} className="flex items-center justify-between group">
                      <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{comp.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                            style={{ width: `${comp.value * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-zinc-400 w-6 text-right">
                          {comp.value}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Separator className="bg-zinc-800 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-semibold">Va — Valor em Risco</span>
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                      &euro;{rxComponents.valueAtRisk}M
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab: Analise Neural */}
          {activeTab === "neural" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-500" />
                      <div>
                        <span>Radar Neural — 7 Camadas</span>
                        <p className="text-[11px] text-zinc-600 font-normal mt-0.5">
                          Perfil multidimensional de performance e potencial
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <NeuralRadar
                      layers={layers}
                      playerName={playerName}
                      scnScore={algorithms.SCN_plus}
                      size={340}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      <div>
                        <span>Algoritmos Proprietarios</span>
                        <p className="text-[11px] text-zinc-600 font-normal mt-0.5">
                          Scores compostos dos modelos CortexFC
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AlgorithmBars scores={algorithms} />
                  </CardContent>
                </Card>
              </div>

              {/* Reasoning / Parecer ORACLE */}
              <Card className="bg-zinc-900/80 border-zinc-800 glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    Parecer ORACLE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-300 leading-relaxed">{reasoning}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab: Performance */}
          {activeTab === "performance" && (
            <div className="space-y-6 animate-fade-in">
              {seasonStats && (
                <Card className="bg-zinc-900/80 border-zinc-800 glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-500" />
                      Estatisticas da Temporada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SeasonStats stats={seasonStats} />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matchPerformance.length > 0 && (
                  <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Desempenho por Jogo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PerformanceChart data={matchPerformance} metric="rating" />
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      Mapa de Posicao
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center py-4">
                    <PositionHeatmap
                      positionCluster={positionCluster}
                      positionDetail={positionDetail}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tab: Historico */}
          {activeTab === "history" && (
            <div className="space-y-6 animate-fade-in">
              {transferHistory.length > 0 && (
                <Card className="bg-zinc-900/80 border-zinc-800 glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-500" />
                      Historico de Transferencias
                      <span className="ml-auto text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {transferHistory.length} movimentacoes
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TransferTimeline transfers={transferHistory} />
                  </CardContent>
                </Card>
              )}

              {analyses.length > 1 && (
                <Card className="bg-zinc-900/80 border-zinc-800 glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Historico de Analises
                      <span className="ml-auto text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {analyses.length} registros
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Analysis Diff: latest vs previous */}
                    <AnalysisDiff
                      current={{
                        date: analyses[0].date,
                        vx: analyses[0].vx,
                        rx: analyses[0].rx,
                        scnPlus: analyses[0].algorithms.SCN_plus,
                        decision: analyses[0].decision,
                        confidence: analyses[0].confidence,
                      }}
                      previous={{
                        date: analyses[1].date,
                        vx: analyses[1].vx,
                        rx: analyses[1].rx,
                        scnPlus: analyses[1].algorithms.SCN_plus,
                        decision: analyses[1].decision,
                        confidence: analyses[1].confidence,
                      }}
                    />

                    <div className="relative mt-4">
                      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/30 via-zinc-700/50 to-transparent" />

                      <div className="space-y-4">
                        {analyses.map((a, index) => (
                          <div
                            key={a.id}
                            className="relative pl-10 animate-slide-up"
                            style={{ animationDelay: `${(index + 1) * 100}ms` }}
                          >
                            <div className={`absolute left-3 top-3 w-3 h-3 rounded-full border-2 ${
                              index === 0
                                ? "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : "bg-zinc-800 border-zinc-600"
                            }`} />

                            <div className={`rounded-lg border p-4 transition-all duration-200 hover:bg-zinc-800/40 ${
                              index === 0
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-zinc-800/50 bg-zinc-900/30"
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-zinc-500 font-mono">{a.date}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-zinc-600 font-mono">
                                    Conf. {a.confidence}%
                                  </span>
                                  <DecisionBadge decision={a.decision as CortexDecision} size="sm" />
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-600 uppercase">Vx</span>
                                  <span className="font-mono text-emerald-400 text-sm font-semibold">
                                    {a.vx.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-600 uppercase">Rx</span>
                                  <span className="font-mono text-red-400 text-sm font-semibold">
                                    {a.rx.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-600 uppercase">SCN+</span>
                                  <span className="font-mono text-cyan-400 text-sm font-semibold">
                                    {a.algorithms.SCN_plus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </TabNav>
  )
}
