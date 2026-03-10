// ============================================
// CORTEX FC — Core Types
// The neural architecture of football analytics
// ============================================

// Decision outcomes from VxRx matrix
export type CortexDecision =
  | "CONTRATAR" // Vx high, Rx low — acquire
  | "BLINDAR" // Already have, protect asset
  | "MONITORAR" // Watch, not ready to act
  | "EMPRESTIMO" // Loan out for development
  | "RECUSAR" // Pass
  | "ALERTA_CINZA"; // Mixed signals, investigate deeper

// The 6 AI agents
export type AgentType =
  | "ORACLE" // Central decision engine
  | "ANALISTA" // Match & tactical analysis
  | "SCOUT" // Player scouting & comparison
  | "BOARD_ADVISOR" // Executive recommendations
  | "CFO_MODELER" // Financial projections & valuation
  | "COACHING_ASSIST"; // Tactical integration simulation

// Subscription tiers
export type SubscriptionTier =
  | "free"
  | "scout_individual"
  | "club_professional"
  | "holding_multiclub";

// Player position clusters for neural analysis
export type PlayerCluster =
  | "GK"
  | "CB"
  | "FB"
  | "DM"
  | "CM"
  | "AM"
  | "W"
  | "ST";

// ============================================
// Vx (Value Index) Components
// ============================================
export interface VxComponents {
  technical: number; // T — On-ball quality (0-10)
  marketImpact: number; // M — Brand/commercial value impact (0-10)
  culturalAdaptation: number; // A — BHAR cultural fit score (0-10)
  networkingBenefit: number; // N — Compatriots, language, agent network (0-10)
  ageDepreciation: number; // D — Age curve depreciation factor (0-10)
  liabilities: number; // L — Salary ratio + injury risk (0-10)
  regulatoryRisk: number; // R — Work permit, visa, FFP impact (0-10)
  totalCost: number; // C — Total acquisition cost in millions EUR
}

// ============================================
// Rx (Risk Index) Components
// ============================================
export interface RxComponents {
  tacticalGap: number; // Tg — Gap the player fills (0-10, higher = bigger gap)
  contextualFit: number; // Cx — System/formation fit (0-10)
  experienceProfile: number; // Ep — Experience in similar contexts (0-10)
  narrativeIndex: number; // Ni — Media/fan/dressing room narrative (0-10)
  mentalFortitude: number; // Mf — Pressure handling, big-game record (0-10)
  injuryMicroRisk: number; // Mi — Chronic injury patterns (0-10, higher = worse)
  suspensionRisk: number; // S — Cards, disciplinary record (0-10, higher = worse)
  valueAtRisk: number; // Va — Financial downside exposure (millions EUR)
  marketJitter: number; // Mj — Market volatility for this profile (0-10)
}

// ============================================
// Neural Layer Scores (7 camadas)
// ============================================
export interface NeuralLayers {
  C1_technical: number; // Technical ability (0-100)
  C2_tactical: number; // Tactical intelligence (0-100)
  C3_physical: number; // Physical profile (0-100)
  C4_behavioral: number; // Behavioral/psychological (0-100)
  C5_narrative: number; // Media/narrative impact (0-100)
  C6_economic: number; // Economic value/efficiency (0-100)
  C7_ai: number; // AI composite prediction (0-100)
}

// ============================================
// Proprietary Algorithm Scores
// ============================================
export interface AlgorithmScores {
  AST: number; // Análise de Sinergia Tática (0-100)
  CLF: number; // Compatibilidade Linguística e Filosófica (0-100)
  GNE: number; // Grau de Necessidade Estratégica (0-100)
  WSE: number; // Weight of Systemic Embedding (0-100)
  RBL: number; // Risk-Benefit Loop (0-100)
  SACE: number; // Score de Adaptação Cultural e Emocional (0-100)
  SCN_plus: number; // Score Cortex Neural+ composite (0-100)
}

// ============================================
// Complete Neural Analysis
// ============================================
export interface NeuralAnalysis {
  id: string;
  playerId: string;
  clubContextId: string;
  seasonId: string;

  // Core scores
  vx: number;
  rx: number;
  vxComponents: VxComponents;
  rxComponents: RxComponents;

  // Neural layers
  layers: NeuralLayers;

  // Algorithm scores
  algorithms: AlgorithmScores;

  // Decision
  decision: CortexDecision;
  confidence: number; // 0-100
  reasoning: string;

  // Meta
  analystId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Agent I/O Types
// ============================================
export interface AgentInput {
  type: AgentType;
  context: Record<string, unknown>;
  playerId?: string;
  matchId?: string;
  clubId?: string;
}

export interface AgentOutput {
  type: AgentType;
  result: Record<string, unknown>;
  reasoning: string;
  confidence: number;
  tokensUsed: number;
  durationMs: number;
}

// Oracle specific
export interface OracleInput {
  playerId: string;
  clubContextId: string;
  vxComponents: Partial<VxComponents>;
  rxComponents: Partial<RxComponents>;
  additionalContext?: string;
}

export interface OracleOutput {
  vx: number;
  rx: number;
  decision: CortexDecision;
  confidence: number;
  reasoning: string;
  layers: NeuralLayers;
  algorithms: AlgorithmScores;
  recommendedActions: string[];
  risks: string[];
  comparables: string[]; // Similar historical transfers
}

// Scout specific
export interface ScoutInput {
  position: PlayerCluster;
  ageRange: [number, number];
  budgetMax: number; // millions EUR
  style: string; // e.g. "ball-playing CB", "pressing forward"
  leaguePreference?: string[];
  mustHaveTraits?: string[];
}

export interface ScoutOutput {
  candidates: Array<{
    name: string;
    age: number;
    club: string;
    marketValue: number;
    fitScore: number;
    strengths: string[];
    risks: string[];
  }>;
  reasoning: string;
}

// CFO specific
export interface CfoInput {
  playerId: string;
  proposedFee: number;
  proposedSalary: number;
  contractYears: number;
  sellingClubAsk: number;
}

export interface CfoOutput {
  fairValue: number;
  roiProjection: number; // over contract length
  amortizationPerYear: number;
  totalCostOverContract: number;
  salaryAsPercentOfRevenue: number;
  recommendation: "PROCEED" | "NEGOTIATE" | "WALK_AWAY";
  reasoning: string;
}

// Temporal Evolution
export interface TemporalDataPoint {
  date: Date;
  marketValue: number;
  performanceScore: number;
  neuralScore: number;
  projectedValue: number;
}
