import Image from "next/image"
import Link from "next/link"
import {
  User,
  MapPin,
  Calendar,
  Banknote,
  FileText,
  ArrowLeft,
  Activity,
  Globe,
  Shield,
  Cpu,
  BarChart3,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import { AlgorithmBars } from "@/components/cortex/AlgorithmBars"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { UpgradePrompt } from "@/components/cortex/UpgradePrompt"
import { SeasonStats } from "@/components/cortex/SeasonStats"
import { PerformanceChart } from "@/components/cortex/PerformanceChart"
import { PositionHeatmap } from "@/components/cortex/PositionHeatmap"
import { TransferTimeline } from "@/components/cortex/TransferTimeline"
import { PlayerAgentsBar } from "@/components/cortex/PlayerAgentsBar"
import { CoachingAssistPanel } from "@/components/cortex/CoachingAssistPanel"
import { getPlayerById, getPlayerSeasonStats, getPlayerMatchPerformance, getPlayerTransfers } from "@/db/queries"
import {
  formatPlayerForUI,
  toNeuralLayers,
  toAlgorithmScores,
  toVxComponents,
  toRxComponents,
  formatDate,
} from "@/lib/db-transforms"

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [dbPlayer, seasonStats, matchPerformance, transferHistory] = await Promise.all([
    getPlayerById(id),
    getPlayerSeasonStats(id),
    getPlayerMatchPerformance(id),
    getPlayerTransfers(id),
  ])

  if (!dbPlayer) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-lg">Jogador nao encontrado</p>
          <Link href="/players">
            <Button variant="ghost" className="mt-4 text-emerald-400 hover:text-emerald-300">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar para lista
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const player = formatPlayerForUI(dbPlayer)
  const analyses = dbPlayer.analyses.map((a) => ({
    id: a.id,
    date: formatDate(a.createdAt),
    vx: a.vx,
    rx: a.rx,
    vxComponents: toVxComponents(a.vxComponents),
    rxComponents: toRxComponents(a.rxComponents),
    layers: toNeuralLayers(a),
    algorithms: toAlgorithmScores(a),
    decision: a.decision,
    confidence: a.confidence,
    reasoning: a.reasoning,
    createdAt: a.createdAt,
  }))

  const latest = analyses[0] ?? null

  const positionColor =
    player.position.includes("Atacante") || player.position.includes("Ponta")
      ? "from-red-900/40 via-red-950/20"
      : player.position.includes("Meio")
        ? "from-amber-900/40 via-amber-950/20"
        : player.position.includes("Zagueiro") || player.position.includes("Lateral")
          ? "from-blue-900/40 via-blue-950/20"
          : player.position.includes("Goleiro")
            ? "from-emerald-900/40 via-emerald-950/20"
            : "from-zinc-800/60 via-zinc-900/30"

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back button */}
      <Link href="/players">
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-500 hover:text-emerald-400 -ml-2 group transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </Link>

      {/* Player Hero Header */}
      <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${positionColor} to-zinc-900/80 border border-zinc-800 animate-slide-up stagger-1`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.05),_transparent_60%)]" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo placeholder */}
            <div className="w-28 h-28 rounded-xl bg-zinc-800/80 flex items-center justify-center flex-shrink-0 border border-zinc-700/50 ring-2 ring-zinc-700/30 ring-offset-2 ring-offset-zinc-900 overflow-hidden">
              {player.photoUrl ? (
                <Image
                  src={player.photoUrl}
                  alt={player.name}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  priority
                />
              ) : (
                <span className="text-2xl font-bold text-zinc-600">
                  {player.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                </span>
              )}
            </div>

            {/* Player info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold gradient-text tracking-tight">{player.name}</h1>
                  <p className="text-sm text-zinc-400 mt-1">{player.position}</p>
                </div>
                {latest && (
                  <div className="animate-scale-in">
                    <DecisionBadge decision={latest.decision} size="lg" />
                  </div>
                )}
              </div>

              {/* Pill badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-300">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  {player.age ?? "—"} anos
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-300">
                  <Globe className="w-3 h-3 text-zinc-500" />
                  {player.nationality}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-300">
                  <Banknote className="w-3 h-3 text-emerald-500" />
                  <span className="font-mono">&euro;{player.marketValue}M</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-300">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  {player.club}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1">
                  <Banknote className="w-3 h-3" />
                  Salario: &euro;{player.salary}M/ano
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Contrato ate: {player.contractEnd}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Actions Bar */}
      <PlayerAgentsBar
        playerId={id}
        playerName={player.name}
        position={player.positionCluster as import("@/types/cortex").PlayerCluster}
        age={player.age ?? 25}
        currentClub={player.club}
        marketValue={player.marketValue ?? 0}
        analysisId={latest?.id}
      />

      {latest ? (
        <>
          {/* VxRx + Decision Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover animate-slide-up stagger-2">
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
                      {latest.vx.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">Vx (Valor)</p>
                  </div>
                  <div className="w-px h-12 bg-zinc-800" />
                  <div className="text-center">
                    <p className="text-3xl font-bold font-mono text-red-400">
                      {latest.rx.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">Rx (Risco)</p>
                  </div>
                </div>
                <Separator className="bg-zinc-800 my-4" />
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-2">Decisao ORACLE</p>
                  <DecisionBadge decision={latest.decision} size="lg" />
                  <p className="text-xs text-zinc-600 mt-2 font-mono">
                    Confianca: {latest.confidence}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vx Components */}
            <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover animate-slide-up stagger-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Componentes Vx
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "T — Tecnico", value: latest.vxComponents.technical },
                  { label: "M — Impacto Mercado", value: latest.vxComponents.marketImpact },
                  { label: "A — Adaptacao Cultural", value: latest.vxComponents.culturalAdaptation },
                  { label: "N — Networking", value: latest.vxComponents.networkingBenefit },
                  { label: "D — Depreciacao Idade", value: latest.vxComponents.ageDepreciation },
                  { label: "L — Passivos", value: latest.vxComponents.liabilities },
                  { label: "R — Risco Regulatorio", value: latest.vxComponents.regulatoryRisk },
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
                    &euro;{latest.vxComponents.totalCost}M
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Rx Components */}
            <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover animate-slide-up stagger-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  Componentes Rx
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Tg — Gap Tatico", value: latest.rxComponents.tacticalGap },
                  { label: "Cx — Fit Contextual", value: latest.rxComponents.contextualFit },
                  { label: "Ep — Experiencia", value: latest.rxComponents.experienceProfile },
                  { label: "Ni — Indice Narrativo", value: latest.rxComponents.narrativeIndex },
                  { label: "Mf — Fortaleza Mental", value: latest.rxComponents.mentalFortitude },
                  { label: "Mi — Risco Lesao", value: latest.rxComponents.injuryMicroRisk },
                  { label: "S — Risco Suspensao", value: latest.rxComponents.suspensionRisk },
                  { label: "Mj — Jitter Mercado", value: latest.rxComponents.marketJitter },
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
                    &euro;{latest.rxComponents.valueAtRisk}M
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Neural Radar + Algorithm Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover animate-slide-up stagger-5">
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
                  layers={latest.layers}
                  playerName={player.name}
                  scnScore={latest.algorithms.SCN_plus}
                  size={340}
                />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover animate-slide-up stagger-5">
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
                <AlgorithmBars scores={latest.algorithms} />
              </CardContent>
            </Card>
          </div>

          {/* Reasoning */}
          <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Parecer ORACLE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-300 leading-relaxed">{latest.reasoning}</p>
            </CardContent>
          </Card>

          {/* Season Stats */}
          {seasonStats && (
            <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
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

          {/* Performance Chart + Position Heatmap */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchPerformance.length > 0 && (
              <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover animate-slide-up md:col-span-2">
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

            <Card className="bg-zinc-900/80 border-zinc-800 glass card-hover animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Mapa de Posicao
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                <PositionHeatmap
                  positionCluster={player.positionCluster}
                  positionDetail={dbPlayer.positionDetail ?? undefined}
                />
              </CardContent>
            </Card>
          </div>

          {/* Transfer Timeline */}
          {transferHistory.length > 0 && (
            <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
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

          {/* Analysis History — Timeline */}
          {analyses.length > 1 && (
            <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
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
                <div className="relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/30 via-zinc-700/50 to-transparent" />

                  <div className="space-y-4">
                    {analyses.map((a, index) => (
                      <div
                        key={a.id}
                        className="relative pl-10 animate-slide-up"
                        style={{ animationDelay: `${(index + 1) * 100}ms` }}
                      >
                        {/* Timeline dot */}
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
                              <DecisionBadge decision={a.decision} size="sm" />
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
        </>
      ) : (
        <>
          <Card className="bg-zinc-900/80 border-zinc-800 glass animate-scale-in">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-zinc-700" />
              </div>
              <p className="text-zinc-500">Nenhuma analise neural disponivel para este jogador.</p>
              <Link href="/analysis/new">
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
                  Executar ORACLE
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Position Heatmap (always available) */}
          <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up max-w-sm mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Mapa de Posicao
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <PositionHeatmap
                positionCluster={player.positionCluster}
                positionDetail={dbPlayer.positionDetail ?? undefined}
              />
            </CardContent>
          </Card>

          {/* Upgrade prompt for AI analysis */}
          <UpgradePrompt
            feature="Analise Neural com IA"
            description="Desbloqueie analises avancadas com inteligencia artificial para avaliar jogadores com o motor ORACLE."
            requiredTier="club_professional"
            variant="inline"
          />
        </>
      )}

      {/* Coaching Assist */}
      <CoachingAssistPanel
        playerId={id}
        playerName={player.name}
        position={player.positionCluster as import("@/types/cortex").PlayerCluster}
        age={player.age ?? 25}
        currentClub={player.club}
      />

      {/* Action button */}
      <div className="flex justify-end animate-fade-in">
        <Link href="/analysis/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-emerald-900/40 hover:-translate-y-0.5">
            <Activity className="w-4 h-4 mr-2" />
            Nova Analise
          </Button>
        </Link>
      </div>
    </div>
  )
}
