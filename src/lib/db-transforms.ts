import type {
  NeuralLayers,
  AlgorithmScores,
  VxComponents,
  RxComponents,
  CortexDecision,
} from "@/types/cortex"

// ============================================
// DB Analysis -> UI types
// ============================================

/**
 * Extract C1-C7 neural layer scores from flat DB analysis fields
 * into the NeuralLayers object expected by NeuralRadar component.
 */
export function toNeuralLayers(analysis: {
  c1Technical: number
  c2Tactical: number
  c3Physical: number
  c4Behavioral: number
  c5Narrative: number
  c6Economic: number
  c7Ai: number
}): NeuralLayers {
  return {
    C1_technical: analysis.c1Technical,
    C2_tactical: analysis.c2Tactical,
    C3_physical: analysis.c3Physical,
    C4_behavioral: analysis.c4Behavioral,
    C5_narrative: analysis.c5Narrative,
    C6_economic: analysis.c6Economic,
    C7_ai: analysis.c7Ai,
  }
}

/**
 * Extract algorithm scores from flat DB analysis fields
 * into the AlgorithmScores object expected by AlgorithmBars component.
 */
export function toAlgorithmScores(analysis: {
  ast: number | null
  clf: number | null
  gne: number | null
  wse: number | null
  rbl: number | null
  sace: number | null
  scnPlus: number | null
}): AlgorithmScores {
  return {
    AST: analysis.ast ?? 0,
    CLF: analysis.clf ?? 0,
    GNE: analysis.gne ?? 0,
    WSE: analysis.wse ?? 0,
    RBL: analysis.rbl ?? 0,
    SACE: analysis.sace ?? 0,
    SCN_plus: analysis.scnPlus ?? 0,
  }
}

/**
 * Cast JSONB vxComponents from DB into typed VxComponents.
 */
export function toVxComponents(raw: unknown): VxComponents {
  const obj = raw as Record<string, number>
  return {
    technical: obj.technical ?? 0,
    marketImpact: obj.marketImpact ?? 0,
    culturalAdaptation: obj.culturalAdaptation ?? 0,
    networkingBenefit: obj.networkingBenefit ?? 0,
    ageDepreciation: obj.ageDepreciation ?? 0,
    liabilities: obj.liabilities ?? 0,
    regulatoryRisk: obj.regulatoryRisk ?? 0,
    totalCost: obj.totalCost ?? 0,
  }
}

/**
 * Cast JSONB rxComponents from DB into typed RxComponents.
 */
export function toRxComponents(raw: unknown): RxComponents {
  const obj = raw as Record<string, number>
  return {
    tacticalGap: obj.tacticalGap ?? 0,
    contextualFit: obj.contextualFit ?? 0,
    experienceProfile: obj.experienceProfile ?? 0,
    narrativeIndex: obj.narrativeIndex ?? 0,
    mentalFortitude: obj.mentalFortitude ?? 0,
    injuryMicroRisk: obj.injuryMicroRisk ?? 0,
    suspensionRisk: obj.suspensionRisk ?? 0,
    valueAtRisk: obj.valueAtRisk ?? 0,
    marketJitter: obj.marketJitter ?? 0,
  }
}

// ============================================
// DB Player -> UI player shape
// ============================================

export interface UIPlayer {
  id: string
  name: string
  age: number | null
  nationality: string
  position: string     // positionDetail or positionCluster
  positionCluster: string
  club: string         // flattened from currentClub relation
  marketValue: number
  salary: number
  contractEnd: string
  photoUrl: string | null
}

/**
 * Transform a DB player (with currentClub relation) into the flat
 * UI shape expected by player list and detail pages.
 */
export function formatPlayerForUI(player: {
  id: string
  name: string
  age: number | null
  nationality: string
  positionDetail: string | null
  positionCluster: string
  currentClub: { name: string } | null
  marketValue: number | null
  salary: number | null
  contractUntil: Date | null
  photoUrl: string | null
}): UIPlayer {
  return {
    id: player.id,
    name: player.name,
    age: player.age,
    nationality: player.nationality,
    position: player.positionDetail ?? player.positionCluster,
    positionCluster: player.positionCluster,
    club: player.currentClub?.name ?? "Sem clube",
    marketValue: player.marketValue ?? 0,
    salary: player.salary ?? 0,
    contractEnd: player.contractUntil
      ? player.contractUntil.toISOString().split("T")[0]
      : "N/A",
    photoUrl: player.photoUrl,
  }
}

// ============================================
// Date formatting
// ============================================

/**
 * Format a Date/timestamp into a locale-friendly date string.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// ============================================
// Analysis for scatter plot
// ============================================

export interface ScatterDataPoint {
  name: string
  vx: number
  rx: number
  decision: CortexDecision
  scn: number
}

/**
 * Transform a DB analysis (with player relation) into scatter data point.
 */
export function toScatterPoint(analysis: {
  vx: number
  rx: number
  decision: string
  scnPlus: number | null
  player: { name: string } | null
}): ScatterDataPoint {
  return {
    name: analysis.player?.name ?? "Desconhecido",
    vx: analysis.vx,
    rx: analysis.rx,
    decision: analysis.decision as CortexDecision,
    scn: analysis.scnPlus ?? 0,
  }
}

// ============================================
// Full analysis UI shape
// ============================================

/**
 * Full transform of a DB analysis row (with player/club/analyst relations)
 * into the flat UI shape that pages consume — replaces MockAnalysis.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toAnalysisUI(analysis: any) {
  const layers = toNeuralLayers(analysis)
  const algorithms = toAlgorithmScores(analysis)
  const vxComponents = toVxComponents(analysis.vxComponents)
  const rxComponents = toRxComponents(analysis.rxComponents)
  const player = analysis.player
    ? formatPlayerForUI(analysis.player)
    : null

  return {
    id: analysis.id as string,
    date: formatDate(analysis.createdAt),
    vx: analysis.vx as number,
    rx: analysis.rx as number,
    vxComponents,
    rxComponents,
    layers,
    algorithms,
    decision: analysis.decision as CortexDecision,
    confidence: analysis.confidence as number,
    reasoning: analysis.reasoning as string,
    recommendedActions: (analysis.recommendedActions ?? []) as string[],
    risks: (analysis.risks ?? []) as string[],
    comparables: (analysis.comparables ?? []) as string[],
    isPublished: (analysis.isPublished ?? false) as boolean,
    createdAt: analysis.createdAt as Date,
    player,
    clubContext: analysis.clubContext
      ? { id: analysis.clubContext.id as string, name: analysis.clubContext.name as string }
      : null,
    analyst: analysis.analyst
      ? { id: analysis.analyst.id as string, name: analysis.analyst.name as string }
      : null,
  }
}

export type AnalysisUI = ReturnType<typeof toAnalysisUI>

/**
 * Transform a DB player (with latestAnalysis) into a scouting-ready UI shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toScoutingPlayerUI(player: any) {
  const base = formatPlayerForUI(player)
  const latest = player.latestAnalysis
  const analysis = latest ? toAnalysisUI(latest) : null

  return {
    ...base,
    scn: analysis?.algorithms.SCN_plus,
    decision: analysis?.decision,
    vx: analysis?.vx,
    rx: analysis?.rx,
    layers: analysis?.layers,
    algorithms: analysis?.algorithms,
  }
}

export type ScoutingPlayerUI = ReturnType<typeof toScoutingPlayerUI>

// ============================================
// Decision color mapping (moved from mock-data)
// ============================================

/**
 * Get color configuration for a Cortex decision.
 * Used by VxRxScatter, DecisionBadge, and other UI components.
 */
export function getDecisionColor(decision: CortexDecision) {
  switch (decision) {
    case "CONTRATAR": return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", fill: "#10b981" }
    case "BLINDAR": return { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", fill: "#3b82f6" }
    case "MONITORAR": return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", fill: "#f59e0b" }
    case "EMPRESTIMO": return { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", fill: "#a855f7" }
    case "RECUSAR": return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", fill: "#ef4444" }
    case "ALERTA_CINZA": return { bg: "bg-zinc-500/20", text: "text-zinc-400", border: "border-zinc-500/30", fill: "#71717a" }
  }
}
