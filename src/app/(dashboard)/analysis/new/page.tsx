"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Search,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { AlgorithmBars } from "@/components/cortex/AlgorithmBars"
import { useAutoSave } from "@/hooks/useAutoSave"
import type { CortexDecision, NeuralLayers, AlgorithmScores, OracleOutput } from "@/types/cortex"

interface APIPlayer {
  id: string
  name: string
  nationality: string
  age: number | null
  positionCluster: string
  positionDetail: string | null
  currentClub: { id: string; name: string } | null
  marketValue: number | null
  currentClubId: string | null
}

const steps = [
  { id: 1, label: "Jogador" },
  { id: 2, label: "Contexto" },
  { id: 3, label: "Vx" },
  { id: 4, label: "Rx" },
  { id: 5, label: "Neural" },
]

interface SliderFieldProps {
  label: string
  tooltip: string
  value: number
  max?: number
  onChange: (v: number) => void
  color?: string
  aiFilled?: boolean
}

function SliderField({ label, tooltip, value, max = 10, onChange, color = "emerald", aiFilled }: SliderFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-zinc-400">{label}</Label>
          {aiFilled && <AIBadge />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-zinc-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 text-zinc-200 border-zinc-700 max-w-xs text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
        <span className={`text-xs font-mono font-semibold text-${color}-400`}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={max === 100 ? 1 : 0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  )
}

const AI_PROGRESS_MESSAGES = [
  "Inicializando ORACLE...",
  "Processando camada C1 — Tecnico...",
  "Processando camada C2 — Tatico...",
  "Processando camada C3 — Fisico...",
  "Calculando matriz VxRx...",
  "Gerando algoritmos proprietarios...",
  "Formulando parecer neural...",
]

function AILoadingOverlay({ messageIndex }: { messageIndex: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
        <div className="relative">
          <Brain className="w-16 h-16 text-emerald-400 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-emerald-500/30 animate-ping" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-zinc-100">Gerando Analise Neural com IA</p>
          <p className="text-sm text-emerald-400 font-mono animate-pulse">
            {AI_PROGRESS_MESSAGES[messageIndex % AI_PROGRESS_MESSAGES.length]}
          </p>
        </div>
        <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(95, ((messageIndex + 1) / AI_PROGRESS_MESSAGES.length) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600">Isso pode levar 10-30 segundos</p>
      </div>
    </div>
  )
}

function AIBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 ml-1.5">
      <Sparkles className="w-2.5 h-2.5" />
      IA
    </span>
  )
}

function computeDecision(vx: number, rx: number): CortexDecision {
  if (vx >= 1.5 && rx <= 0.8) return "BLINDAR"
  if (vx >= 1.5 && rx <= 1.2) return "CONTRATAR"
  if (vx >= 1.0 && rx <= 1.0) return "MONITORAR"
  if (vx < 1.0 && rx <= 0.8) return "EMPRESTIMO"
  if (rx > 1.5) return "RECUSAR"
  if (vx >= 1.0 && rx > 1.0 && rx <= 1.5) return "ALERTA_CINZA"
  return "MONITORAR"
}

export default function NewAnalysisPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [playerSearch, setPlayerSearch] = useState("")
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [clubContext, setClubContext] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiProgressIndex, setAiProgressIndex] = useState(0)
  const [aiFilledFields, setAiFilledFields] = useState(false)
  const [aiReasoning, setAiReasoning] = useState("")
  const [aiRecommendedActions, setAiRecommendedActions] = useState<string[]>([])
  const [aiRisks, setAiRisks] = useState<string[]>([])
  const [aiComparables, setAiComparables] = useState<string[]>([])
  const aiProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Players from API
  const [players, setPlayers] = useState<APIPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch("/api/players")
        const json = await res.json()
        setPlayers(json.data ?? [])
      } catch (err) {
        console.error("Failed to fetch players:", err)
      } finally {
        setLoadingPlayers(false)
      }
    }
    fetchPlayers()
  }, [])

  // Vx components
  const [technical, setTechnical] = useState(5)
  const [marketImpact, setMarketImpact] = useState(5)
  const [culturalAdaptation, setCulturalAdaptation] = useState(5)
  const [networkingBenefit, setNetworkingBenefit] = useState(5)
  const [ageDepreciation, setAgeDepreciation] = useState(5)
  const [liabilities, setLiabilities] = useState(3)
  const [regulatoryRisk, setRegulatoryRisk] = useState(2)
  const [totalCost, setTotalCost] = useState(20)

  // Rx components
  const [tacticalGap, setTacticalGap] = useState(5)
  const [contextualFit, setContextualFit] = useState(5)
  const [experienceProfile, setExperienceProfile] = useState(5)
  const [narrativeIndex, setNarrativeIndex] = useState(5)
  const [mentalFortitude, setMentalFortitude] = useState(5)
  const [injuryMicroRisk, setInjuryMicroRisk] = useState(3)
  const [suspensionRisk, setSuspensionRisk] = useState(2)
  const [valueAtRisk, setValueAtRisk] = useState(5)
  const [marketJitter, setMarketJitter] = useState(3)

  // Neural layers
  const [c1, setC1] = useState(60)
  const [c2, setC2] = useState(60)
  const [c3, setC3] = useState(60)
  const [c4, setC4] = useState(60)
  const [c5, setC5] = useState(60)
  const [c6, setC6] = useState(60)
  const [c7, setC7] = useState(60)

  // Auto-save draft
  interface DraftData {
    step: number
    selectedPlayerId: string
    clubContext: string
    technical: number
    marketImpact: number
    c1: number; c2: number; c3: number; c4: number; c5: number; c6: number; c7: number
  }
  const { save: saveDraft, load: loadDraft, clear: clearDraft, lastSaved } = useAutoSave<DraftData>({ key: "analysis-new" })

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      if (draft.selectedPlayerId) setSelectedPlayerId(draft.selectedPlayerId)
      if (draft.clubContext) setClubContext(draft.clubContext)
      if (draft.step) setStep(draft.step)
      if (draft.technical) setTechnical(draft.technical)
      if (draft.marketImpact) setMarketImpact(draft.marketImpact)
      if (draft.c1) setC1(draft.c1)
      if (draft.c2) setC2(draft.c2)
      if (draft.c3) setC3(draft.c3)
      if (draft.c4) setC4(draft.c4)
      if (draft.c5) setC5(draft.c5)
      if (draft.c6) setC6(draft.c6)
      if (draft.c7) setC7(draft.c7)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save draft on changes
  useEffect(() => {
    if (showResult) return
    saveDraft({ step, selectedPlayerId, clubContext, technical, marketImpact, c1, c2, c3, c4, c5, c6, c7 })
  }, [step, selectedPlayerId, clubContext, technical, marketImpact, c1, c2, c3, c4, c5, c6, c7, showResult, saveDraft])

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)

  const filteredPlayers = useMemo(() => {
    if (!playerSearch) return players
    const q = playerSearch.toLowerCase()
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.currentClub?.name ?? "").toLowerCase().includes(q) ||
        (p.positionDetail ?? p.positionCluster).toLowerCase().includes(q)
    )
  }, [playerSearch, players])

  // Unique clubs for the context selector
  const clubOptions = useMemo(() => {
    const clubMap = new Map<string, string>()
    players.forEach((p) => {
      if (p.currentClub) {
        clubMap.set(p.currentClubId ?? p.currentClub.id, p.currentClub.name)
      }
    })
    return Array.from(clubMap.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [players])

  // Set default club context when clubs load
  useEffect(() => {
    if (clubOptions.length > 0 && !clubContext) {
      setClubContext(clubOptions[0][0])
    }
  }, [clubOptions, clubContext])

  // Compute Vx and Rx
  const vx = useMemo(() => {
    const positive = (technical + marketImpact + culturalAdaptation + networkingBenefit) / 4
    const negative = (liabilities + regulatoryRisk) / 2
    const ageFactor = ageDepreciation / 10
    return Math.round(((positive * ageFactor * 10 - negative) / (totalCost > 0 ? Math.sqrt(totalCost) : 1) + 0.8) * 100) / 100
  }, [technical, marketImpact, culturalAdaptation, networkingBenefit, ageDepreciation, liabilities, regulatoryRisk, totalCost])

  const rx = useMemo(() => {
    const risk = (injuryMicroRisk + suspensionRisk + marketJitter) / 3
    const fit = (tacticalGap + contextualFit + experienceProfile + narrativeIndex + mentalFortitude) / 5
    return Math.round(((risk * 1.5 - fit * 0.3 + valueAtRisk / 20 + 0.5)) * 100) / 100
  }, [tacticalGap, contextualFit, experienceProfile, narrativeIndex, mentalFortitude, injuryMicroRisk, suspensionRisk, valueAtRisk, marketJitter])

  const clampedVx = Math.max(0.1, Math.min(3.0, vx))
  const clampedRx = Math.max(0.1, Math.min(3.0, rx))
  const decision = computeDecision(clampedVx, clampedRx)

  const layers: NeuralLayers = {
    C1_technical: c1,
    C2_tactical: c2,
    C3_physical: c3,
    C4_behavioral: c4,
    C5_narrative: c5,
    C6_economic: c6,
    C7_ai: c7,
  }

  const avgLayer = (c1 + c2 + c3 + c4 + c5 + c6 + c7) / 7
  const algorithms: AlgorithmScores = {
    AST: Math.min(100, Math.round(avgLayer * 0.92 + 5)),
    CLF: Math.min(100, Math.round(avgLayer * 0.88 + 7)),
    GNE: Math.min(100, Math.round(avgLayer * 0.95 + 3)),
    WSE: Math.min(100, Math.round(avgLayer * 0.90 + 5)),
    RBL: Math.min(100, Math.round(avgLayer * 0.93 + 4)),
    SACE: Math.min(100, Math.round(avgLayer * 0.87 + 8)),
    SCN_plus: Math.min(100, Math.round(avgLayer * 0.94 + 3)),
  }

  const canProceed = step === 1 ? !!selectedPlayerId : true

  const selectedClubName = clubOptions.find(([id]) => id === clubContext)?.[1] ?? ""

  async function handleSaveAnalysis() {
    if (!selectedPlayerId || !clubContext) return
    setIsSaving(true)
    try {
      const body = {
        playerId: selectedPlayerId,
        clubContextId: clubContext,
        vx: clampedVx,
        rx: clampedRx,
        vxComponents: {
          technical,
          marketImpact,
          culturalAdaptation,
          networkingBenefit,
          ageDepreciation,
          liabilities,
          regulatoryRisk,
          totalCost,
        },
        rxComponents: {
          tacticalGap,
          contextualFit,
          experienceProfile,
          narrativeIndex,
          mentalFortitude,
          injuryMicroRisk,
          suspensionRisk,
          valueAtRisk,
          marketJitter,
        },
        c1Technical: c1,
        c2Tactical: c2,
        c3Physical: c3,
        c4Behavioral: c4,
        c5Narrative: c5,
        c6Economic: c6,
        c7Ai: c7,
        ast: algorithms.AST,
        clf: algorithms.CLF,
        gne: algorithms.GNE,
        wse: algorithms.WSE,
        rbl: algorithms.RBL,
        sace: algorithms.SACE,
        scnPlus: algorithms.SCN_plus,
        decision,
        confidence: (() => {
          const layerValues = [c1, c2, c3, c4, c5, c6, c7];
          const avg = layerValues.reduce((a, b) => a + b, 0) / layerValues.length;
          const variance = layerValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / layerValues.length;
          return Math.round(Math.max(60, Math.min(98, 95 - (variance / 20))));
        })(),
        reasoning: aiFilledFields && aiReasoning
          ? aiReasoning.slice(0, 5000)
          : `Analise neural executada via ORACLE para ${selectedPlayer?.name} no contexto de ${selectedClubName}. Vx=${clampedVx.toFixed(2)}, Rx=${clampedRx.toFixed(2)}.`,
      }

      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error("Failed to save analysis:", err)
      } else {
        clearDraft()
      }
    } catch (err) {
      console.error("Failed to save analysis:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const generateWithAI = useCallback(async () => {
    if (!selectedPlayer || !clubContext) return
    setIsGeneratingAI(true)
    setAiError("")
    setAiProgressIndex(0)

    // Start cycling progress messages
    aiProgressTimer.current = setInterval(() => {
      setAiProgressIndex((prev) => prev + 1)
    }, 3000)

    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          clubContextId: clubContext,
          playerName: selectedPlayer.name,
          position: selectedPlayer.positionDetail || selectedPlayer.positionCluster,
          age: selectedPlayer.age,
          nationality: selectedPlayer.nationality,
          currentClub: selectedPlayer.currentClub?.name || "",
          marketValue: selectedPlayer.marketValue,
          contractEnd: null,
          targetClubName: selectedClubName,
          targetClubLeague: "",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na API")
      }

      const { data } = (await res.json()) as { data: OracleOutput }

      // Fill Vx-related components: map from ORACLE Vx to slider-friendly values
      // ORACLE returns vx as a float (e.g. 1.5). We reverse-engineer slider values.
      // For simplicity we use the neural layers to derive component estimates.
      const layerAvg = (
        data.layers.C1_technical +
        data.layers.C2_tactical +
        data.layers.C3_physical +
        data.layers.C4_behavioral +
        data.layers.C5_narrative +
        data.layers.C6_economic +
        data.layers.C7_ai
      ) / 7

      // Set Vx components (scale 0-10 from layer percentages)
      setTechnical(Math.round(data.layers.C1_technical / 10))
      setMarketImpact(Math.round(data.layers.C5_narrative / 10))
      setCulturalAdaptation(Math.round(data.layers.C4_behavioral / 10))
      setNetworkingBenefit(Math.round(Math.min(10, data.algorithms.CLF / 10)))
      setAgeDepreciation(Math.round(Math.min(10, data.layers.C3_physical / 10)))
      setLiabilities(Math.round(Math.max(0, 10 - data.layers.C6_economic / 10)))
      setRegulatoryRisk(Math.round(Math.max(0, Math.min(10, (100 - data.algorithms.SACE) / 10))))
      setTotalCost(selectedPlayer.marketValue ?? 20)

      // Set Rx components
      setTacticalGap(Math.round(Math.min(10, data.algorithms.GNE / 10)))
      setContextualFit(Math.round(Math.min(10, data.algorithms.AST / 10)))
      setExperienceProfile(Math.round(Math.min(10, data.layers.C2_tactical / 10)))
      setNarrativeIndex(Math.round(Math.min(10, data.layers.C5_narrative / 10)))
      setMentalFortitude(Math.round(Math.min(10, data.layers.C4_behavioral / 10)))
      setInjuryMicroRisk(Math.round(Math.max(0, Math.min(10, (100 - data.layers.C3_physical) / 10))))
      setSuspensionRisk(Math.round(Math.max(0, Math.min(10, (100 - data.layers.C4_behavioral) / 12))))
      setValueAtRisk(Math.round(Math.max(0, (selectedPlayer.marketValue ?? 20) * (data.rx / 3))))
      setMarketJitter(Math.round(Math.max(0, Math.min(10, data.rx * 3))))

      // Set Neural layers directly
      setC1(Math.round(data.layers.C1_technical))
      setC2(Math.round(data.layers.C2_tactical))
      setC3(Math.round(data.layers.C3_physical))
      setC4(Math.round(data.layers.C4_behavioral))
      setC5(Math.round(data.layers.C5_narrative))
      setC6(Math.round(data.layers.C6_economic))
      setC7(Math.round(data.layers.C7_ai))

      // Store AI-specific outputs
      setAiReasoning(data.reasoning || "")
      setAiRecommendedActions(data.recommendedActions || [])
      setAiRisks(data.risks || [])
      setAiComparables(data.comparables || [])
      setAiFilledFields(true)

      // Jump to the review step
      setStep(5)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar analise."
      setAiError(msg + " Tente novamente ou preencha manualmente.")
    } finally {
      if (aiProgressTimer.current) {
        clearInterval(aiProgressTimer.current)
        aiProgressTimer.current = null
      }
      setIsGeneratingAI(false)
    }
  }, [selectedPlayer, clubContext, selectedClubName])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* AI Loading Overlay */}
      {isGeneratingAI && <AILoadingOverlay messageIndex={aiProgressIndex} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/analysis">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 -ml-2 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Nova Analise Neural
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-zinc-500">
              Configure os parametros e execute o ORACLE
            </p>
            {lastSaved && !showResult && (
              <span className="text-[10px] text-zinc-600 font-mono">
                Rascunho salvo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === s.id
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : step > s.id
                  ? "bg-zinc-800 text-emerald-400 cursor-pointer"
                  : "bg-zinc-900 text-zinc-600"
              }`}
            >
              {step > s.id ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-4 text-center">{s.id}</span>
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${step > s.id ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form area */}
        <div className="lg:col-span-2">
          {/* Step 1: Select Player */}
          {step === 1 && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-300">
                  Etapa 1 — Selecionar Jogador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPlayers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                    <span className="ml-2 text-sm text-zinc-500">Carregando jogadores...</span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        placeholder="Buscar jogador..."
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                      {filteredPlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => setSelectedPlayerId(player.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                            selectedPlayerId === player.id
                              ? "border-emerald-500/50 bg-emerald-500/10"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0">
                            {player.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{player.name}</p>
                            <p className="text-[11px] text-zinc-500">
                              {player.positionDetail ?? player.positionCluster} &middot; {player.currentClub?.name ?? "Sem clube"}
                            </p>
                          </div>
                          {selectedPlayerId === player.id && (
                            <Check className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Club Context */}
          {step === 2 && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-300">
                  Etapa 2 — Contexto do Clube
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-zinc-400">Clube que esta analisando a contratacao</Label>
                  <select
                    value={clubContext}
                    onChange={(e) => setClubContext(e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300 outline-none focus:border-emerald-500"
                  >
                    {clubOptions.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500 mb-2">Contexto selecionado:</p>
                  <p className="text-sm text-zinc-300">
                    Analise de <span className="text-emerald-400 font-semibold">{selectedPlayer?.name}</span> para{" "}
                    <span className="text-blue-400 font-semibold">{selectedClubName}</span>
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    O ORACLE ira avaliar fit tatico, economico e cultural para este contexto especifico.
                  </p>
                </div>

                {/* AI Generation Section */}
                <Separator className="bg-zinc-800" />
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-400">Geracao Automatica</p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Use o agente ORACLE para preencher automaticamente todos os campos da analise
                    (camadas neurais, algoritmos, Vx/Rx, decisao e parecer). Voce pode ajustar os
                    valores depois.
                  </p>
                  <Button
                    onClick={generateWithAI}
                    disabled={isGeneratingAI || !selectedPlayer}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Gerar Analise Neural com IA
                  </Button>
                  {aiError && (
                    <p className="text-xs text-red-400 bg-red-500/10 rounded p-2 border border-red-500/20">
                      {aiError}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-600 text-center">
                    Ou continue manualmente usando os botoes de navegacao
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Vx Components */}
          {step === 3 && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-300">
                  Etapa 3 — Componentes Vx (Valor)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <SliderField label="T — Qualidade Tecnica" tooltip="Avaliacao da qualidade tecnica com bola: passe, controle, finalizacao, drible (0-10)" value={technical} onChange={setTechnical} aiFilled={aiFilledFields} />
                <SliderField label="M — Impacto de Mercado" tooltip="Impacto comercial/marca: visibilidade, camisas vendidas, atencao da midia (0-10)" value={marketImpact} onChange={setMarketImpact} aiFilled={aiFilledFields} />
                <SliderField label="A — Adaptacao Cultural" tooltip="Score BHAR de fit cultural: idioma, estilo de vida, historico em contextos similares (0-10)" value={culturalAdaptation} onChange={setCulturalAdaptation} aiFilled={aiFilledFields} />
                <SliderField label="N — Networking" tooltip="Beneficio de rede: compatriotas no elenco, relacao com agentes, conexoes (0-10)" value={networkingBenefit} onChange={setNetworkingBenefit} aiFilled={aiFilledFields} />
                <SliderField label="D — Depreciacao por Idade" tooltip="Fator de curva de idade: 10 = jovem com alta valorizacao, 1 = veterano em declinio (0-10)" value={ageDepreciation} onChange={setAgeDepreciation} aiFilled={aiFilledFields} />
                <Separator className="bg-zinc-800" />
                <SliderField label="L — Passivos" tooltip="Risco de passivos: ratio salarial, historico de lesoes, custos ocultos (0-10, maior = pior)" value={liabilities} onChange={setLiabilities} color="red" aiFilled={aiFilledFields} />
                <SliderField label="R — Risco Regulatorio" tooltip="Risco regulatorio: work permit, visto, impacto FFP, restricoes de registro (0-10, maior = pior)" value={regulatoryRisk} onChange={setRegulatoryRisk} color="red" aiFilled={aiFilledFields} />
                <Separator className="bg-zinc-800" />
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Label className="text-xs text-zinc-400">C — Custo Total (M EUR)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-zinc-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 text-zinc-200 border-zinc-700 max-w-xs text-xs">
                        Custo total projetado da aquisicao em milhoes de euros (taxa de transferencia + bonus + comissoes)
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-200 font-mono"
                    min={0}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Rx Components */}
          {step === 4 && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-300">
                  Etapa 4 — Componentes Rx (Risco)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <SliderField label="Tg — Gap Tatico" tooltip="Quao grande e a lacuna que o jogador preenche no sistema tatico (0-10, maior = preenche lacuna critica)" value={tacticalGap} onChange={setTacticalGap} aiFilled={aiFilledFields} />
                <SliderField label="Cx — Fit Contextual" tooltip="Encaixe no sistema/formacao: quao bem o jogador se adapta ao estilo de jogo (0-10)" value={contextualFit} onChange={setContextualFit} aiFilled={aiFilledFields} />
                <SliderField label="Ep — Perfil de Experiencia" tooltip="Experiencia em contextos similares: liga, nivel de competicao, pressao (0-10)" value={experienceProfile} onChange={setExperienceProfile} aiFilled={aiFilledFields} />
                <SliderField label="Ni — Indice Narrativo" tooltip="Impacto narrativo: reacao da midia, torcida, vestiario (0-10)" value={narrativeIndex} onChange={setNarrativeIndex} aiFilled={aiFilledFields} />
                <SliderField label="Mf — Fortaleza Mental" tooltip="Capacidade de lidar com pressao, jogos grandes, adversidade (0-10)" value={mentalFortitude} onChange={setMentalFortitude} aiFilled={aiFilledFields} />
                <Separator className="bg-zinc-800" />
                <SliderField label="Mi — Micro-Risco Lesao" tooltip="Padrao de lesoes cronicas, fragilidade muscular, historico (0-10, maior = pior)" value={injuryMicroRisk} onChange={setInjuryMicroRisk} color="red" aiFilled={aiFilledFields} />
                <SliderField label="S — Risco de Suspensao" tooltip="Historico disciplinar: cartoes, suspensoes, incidentes (0-10, maior = pior)" value={suspensionRisk} onChange={setSuspensionRisk} color="red" aiFilled={aiFilledFields} />
                <SliderField label="Mj — Jitter de Mercado" tooltip="Volatilidade do mercado para este perfil de jogador (0-10, maior = mais volatil)" value={marketJitter} onChange={setMarketJitter} color="amber" aiFilled={aiFilledFields} />
                <Separator className="bg-zinc-800" />
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Label className="text-xs text-zinc-400">Va — Valor em Risco (M EUR)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-zinc-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 text-zinc-200 border-zinc-700 max-w-xs text-xs">
                        Exposicao financeira negativa: quanto pode ser perdido no pior cenario
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    value={valueAtRisk}
                    onChange={(e) => setValueAtRisk(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-200 font-mono"
                    min={0}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Neural Layers */}
          {step === 5 && !showResult && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-300">
                  Etapa 5 — Camadas Neurais (C1-C7)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <SliderField label="C1 — Habilidade Tecnica" tooltip="Score de habilidade tecnica pura: controle, passe, finalizacao, visao de jogo" value={c1} max={100} onChange={setC1} aiFilled={aiFilledFields} />
                <SliderField label="C2 — Inteligencia Tatica" tooltip="Leitura de jogo, posicionamento, decisoes em campo, awareness" value={c2} max={100} onChange={setC2} aiFilled={aiFilledFields} />
                <SliderField label="C3 — Perfil Fisico" tooltip="Atributos fisicos: velocidade, resistencia, forca, agilidade" value={c3} max={100} onChange={setC3} aiFilled={aiFilledFields} />
                <SliderField label="C4 — Comportamental" tooltip="Perfil psicologico: lideranca, disciplina, resiliencia, mentalidade" value={c4} max={100} onChange={setC4} aiFilled={aiFilledFields} />
                <SliderField label="C5 — Narrativa" tooltip="Impacto de midia/narrativa: como a contratacao e percebida publicamente" value={c5} max={100} onChange={setC5} aiFilled={aiFilledFields} />
                <SliderField label="C6 — Economico" tooltip="Eficiencia economica: relacao custo-beneficio, potencial de valorizacao" value={c6} max={100} onChange={setC6} aiFilled={aiFilledFields} />
                <SliderField label="C7 — Composito IA" tooltip="Score composito gerado pelo modelo de IA preditiva do CORTEX" value={c7} max={100} onChange={setC7} aiFilled={aiFilledFields} />
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {showResult && (
            <div className="space-y-6">
              <Card className="bg-zinc-900/80 border-zinc-800 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Resultado ORACLE
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-zinc-100">{selectedPlayer?.name}</p>
                      <p className="text-sm text-zinc-500">
                        {selectedPlayer?.positionDetail ?? selectedPlayer?.positionCluster} &middot; {selectedPlayer?.currentClub?.name ?? "Sem clube"} → {selectedClubName}
                      </p>
                    </div>
                    <DecisionBadge decision={decision} size="lg" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-2xl font-bold font-mono text-emerald-400">{clampedVx.toFixed(2)}</p>
                      <p className="text-xs text-zinc-600 mt-1">Vx (Valor)</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-2xl font-bold font-mono text-red-400">{clampedRx.toFixed(2)}</p>
                      <p className="text-xs text-zinc-600 mt-1">Rx (Risco)</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-2xl font-bold font-mono text-cyan-400">{algorithms.SCN_plus}</p>
                      <p className="text-xs text-zinc-600 mt-1">SCN+</p>
                    </div>
                  </div>

                  <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                      {aiFilledFields ? (
                        <>Parecer ORACLE <AIBadge /></>
                      ) : (
                        "Parecer Simulado:"
                      )}
                    </p>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {aiFilledFields && aiReasoning ? aiReasoning : (
                        <>
                          Com base nos parametros fornecidos, {selectedPlayer?.name} apresenta um indice de valor (Vx) de{" "}
                          {clampedVx.toFixed(2)} contra um risco (Rx) de {clampedRx.toFixed(2)}.{" "}
                          {decision === "CONTRATAR" && "A relacao risco-retorno e favoravel. Recomenda-se avancar com a negociacao."}
                          {decision === "BLINDAR" && "O jogador demonstra alto valor com risco controlado. Prioridade maxima para protecao contratual."}
                          {decision === "MONITORAR" && "Os indicadores sugerem potencial, mas e necessario acompanhamento antes de decisao definitiva."}
                          {decision === "RECUSAR" && "O nivel de risco supera o valor potencial. Nao recomendado neste momento."}
                          {decision === "ALERTA_CINZA" && "Sinais mistos detectados. Investigacao aprofundada e necessaria antes de qualquer decisao."}
                          {decision === "EMPRESTIMO" && "O perfil sugere que um emprestimo seria a melhor estrategia de desenvolvimento."}
                        </>
                      )}
                    </p>
                  </div>

                  {/* AI-generated extras */}
                  {aiFilledFields && (aiRecommendedActions.length > 0 || aiRisks.length > 0 || aiComparables.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {aiRecommendedActions.length > 0 && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">Proximos Passos</p>
                          <ul className="space-y-1">
                            {aiRecommendedActions.map((action, i) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-0.5">&#8226;</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiRisks.length > 0 && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">Riscos Identificados</p>
                          <ul className="space-y-1">
                            {aiRisks.map((risk, i) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                <span className="text-red-500 mt-0.5">&#8226;</span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiComparables.length > 0 && (
                        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">Comparaveis</p>
                          <ul className="space-y-1">
                            {aiComparables.map((comp, i) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                <span className="text-cyan-500 mt-0.5">&#8226;</span>
                                {comp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900/80 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400">Radar Neural</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <NeuralRadar layers={layers} playerName={selectedPlayer?.name} scnScore={algorithms.SCN_plus} size={300} />
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/80 border-zinc-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400">Algoritmos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AlgorithmBars scores={algorithms} />
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => { setShowResult(false); setStep(1); setAiFilledFields(false); setAiReasoning(""); setAiRecommendedActions([]); setAiRisks([]); setAiComparables([]) }}
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
                >
                  Nova Analise
                </Button>
                <Button
                  onClick={async () => {
                    await handleSaveAnalysis()
                    router.push("/analysis")
                  }}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar e Ver Todas Analises"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Sidebar */}
        {!showResult && (
          <div className="space-y-4">
            <Card className="bg-zinc-900/80 border-zinc-800 sticky top-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-zinc-500 uppercase tracking-wider">
                  Preview em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlayer && (
                  <div className="text-center pb-3 border-b border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-200">{selectedPlayer.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {selectedPlayer.positionDetail ?? selectedPlayer.positionCluster} &middot; {selectedPlayer.currentClub?.name ?? "Sem clube"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-lg font-bold font-mono text-emerald-400">
                      {clampedVx.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-zinc-600">Vx</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-lg font-bold font-mono text-red-400">
                      {clampedRx.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-zinc-600">Rx</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-zinc-600 mb-1">Decisao Preliminar</p>
                  <DecisionBadge decision={decision} size="md" />
                </div>

                <Separator className="bg-zinc-800" />

                <div className="text-center">
                  <p className="text-[10px] text-zinc-600 mb-1">SCN+ Estimado</p>
                  <p className="text-lg font-bold font-mono text-cyan-400">{algorithms.SCN_plus}</p>
                </div>

                {step === 5 && (
                  <NeuralRadar layers={layers} size={200} />
                )}
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              )}
              {step < 5 ? (
                <Button
                  onClick={() => canProceed && setStep(step + 1)}
                  disabled={!canProceed}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  Proximo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowResult(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  Executar ORACLE
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
