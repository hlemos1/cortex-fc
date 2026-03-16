import Image from "next/image"
import Link from "next/link"
import {
  User,
  MapPin,
  Calendar,
  Banknote,
  ArrowLeft,
  Activity,
  Globe,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { UpgradePrompt } from "@/components/cortex/UpgradePrompt"
import { PositionHeatmap } from "@/components/cortex/PositionHeatmap"
import { PlayerAgentsBar } from "@/components/cortex/PlayerAgentsBar"
import { PlayerQuickStats } from "@/components/cortex/PlayerQuickStats"
import { CoachingAssistPanel } from "@/components/cortex/CoachingAssistPanel"
import { SimilarPlayers } from "@/components/cortex/SimilarPlayers"
import { ProfileTabs } from "./ProfileTabs"
import { getPlayerById, getPlayerSeasonStats, getPlayerMatchPerformance, getPlayerTransfers } from "@/db/queries"
import { getSimilarPlayers } from "@/db/queries/similar-players"
import { HeroParallax } from "./HeroParallax"
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

  const [dbPlayer, seasonStats, matchPerformance, transferHistory, similarPlayers] = await Promise.all([
    getPlayerById(id),
    getPlayerSeasonStats(id),
    getPlayerMatchPerformance(id),
    getPlayerTransfers(id),
    getSimilarPlayers(id),
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

  const accentLine =
    player.position.includes("Atacante") || player.position.includes("Ponta")
      ? "from-red-500 via-red-400 to-red-600"
      : player.position.includes("Meio")
        ? "from-amber-500 via-amber-400 to-amber-600"
        : player.position.includes("Zagueiro") || player.position.includes("Lateral")
          ? "from-blue-500 via-blue-400 to-blue-600"
          : player.position.includes("Goleiro")
            ? "from-emerald-500 via-emerald-400 to-emerald-600"
            : "from-zinc-500 via-zinc-400 to-zinc-600"

  // Contract urgency check
  const contractDate = player.contractEnd !== "N/A" ? new Date(player.contractEnd) : null
  const now = new Date()
  const monthsUntilExpiry = contractDate
    ? (contractDate.getFullYear() - now.getFullYear()) * 12 + (contractDate.getMonth() - now.getMonth())
    : null
  const contractUrgent6 = monthsUntilExpiry !== null && monthsUntilExpiry <= 6
  const contractUrgent12 = monthsUntilExpiry !== null && monthsUntilExpiry <= 12

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
      <HeroParallax>
      <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${positionColor} to-zinc-900/80 border border-zinc-800`}>
        <div className={`h-0.5 bg-gradient-to-r ${accentLine}`} />
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
                <span className={`flex items-center gap-1 ${contractUrgent6 ? "text-red-400 border border-red-500/50 rounded-full px-2 py-0.5 -my-0.5" : ""}`}>
                  <Clock className="w-3 h-3" />
                  Contrato ate: {player.contractEnd}
                  {contractUrgent12 && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </HeroParallax>

      {/* Quick Stats Ribbon */}
      <PlayerQuickStats
        vx={latest?.vx}
        rx={latest?.rx}
        scnPlus={latest?.algorithms.SCN_plus}
        decision={latest?.decision as import("@/types/cortex").CortexDecision | undefined}
        appearances={seasonStats?.appearances}
        goals={seasonStats?.goals}
        assists={seasonStats?.assists}
        rating={seasonStats?.avgRating ?? undefined}
        marketValue={player.marketValue}
        age={player.age ?? undefined}
      />

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
        <ProfileTabs
          vx={latest.vx}
          rx={latest.rx}
          decision={latest.decision}
          confidence={latest.confidence}
          vxComponents={latest.vxComponents}
          rxComponents={latest.rxComponents}
          layers={latest.layers}
          algorithms={latest.algorithms}
          reasoning={latest.reasoning}
          playerName={player.name}
          positionCluster={player.positionCluster}
          positionDetail={dbPlayer.positionDetail ?? undefined}
          seasonStats={seasonStats}
          matchPerformance={matchPerformance.map((m) => ({
            date: typeof m.date === "string" ? m.date : new Date(m.date).toISOString().slice(0, 10),
            rating: m.rating,
            xg: m.xg,
            goals: m.goals,
          }))}
          transferHistory={transferHistory}
          analyses={analyses.map((a) => ({
            id: a.id,
            date: a.date,
            vx: a.vx,
            rx: a.rx,
            decision: a.decision,
            confidence: a.confidence,
            algorithms: a.algorithms,
          }))}
        />
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

      {/* Similar Players */}
      <SimilarPlayers players={similarPlayers} currentPlayerId={id} />

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
