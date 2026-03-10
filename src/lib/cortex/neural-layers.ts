import type { NeuralLayers, AlgorithmScores } from "@/types/cortex";

/**
 * Neural Layer Aggregation
 *
 * The 7 camadas (layers) of the CORTEX neural model:
 *   C1 — Technical (on-ball quality, passing, shooting, dribbling)
 *   C2 — Tactical (positioning, decision-making, system understanding)
 *   C3 — Physical (speed, endurance, strength, recovery)
 *   C4 — Behavioral (discipline, leadership, mentality, work rate)
 *   C5 — Narrative (media profile, fan perception, marketability)
 *   C6 — Economic (cost efficiency, resale potential, salary ratio)
 *   C7 — AI (composite neural prediction from all data)
 *
 * Each layer scores 0-100.
 * The composite SCN+ (Score Cortex Neural Plus) weighs all layers.
 */

// Default layer weights (configurable per club context)
const DEFAULT_WEIGHTS: Record<keyof NeuralLayers, number> = {
  C1_technical: 0.20,
  C2_tactical: 0.18,
  C3_physical: 0.12,
  C4_behavioral: 0.15,
  C5_narrative: 0.08,
  C6_economic: 0.15,
  C7_ai: 0.12,
};

/**
 * Calculate weighted composite score from all layers
 */
export function calculateComposite(
  layers: NeuralLayers,
  weights: Partial<Record<keyof NeuralLayers, number>> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  // Normalize weights to sum to 1
  const totalWeight = Object.values(w).reduce((sum, v) => sum + v, 0);

  let score = 0;
  for (const [key, weight] of Object.entries(w)) {
    const layerKey = key as keyof NeuralLayers;
    score += layers[layerKey] * (weight / totalWeight);
  }

  return Math.round(score * 100) / 100;
}

/**
 * Calculate algorithm scores from neural layers and context
 */
export function calculateAlgorithms(
  layers: NeuralLayers,
  context: {
    squadNeed: number; // 0-100 how much the squad needs this profile
    culturalMatch: number; // 0-100 language, nationality, philosophy fit
    systemFit: number; // 0-100 how well player fits the tactical system
  }
): AlgorithmScores {
  const { squadNeed, culturalMatch, systemFit } = context;

  // AST — Análise de Sinergia Tática
  // How well does this player's profile synergize with existing squad
  const AST = Math.round(
    layers.C2_tactical * 0.35 +
    systemFit * 0.35 +
    layers.C1_technical * 0.15 +
    layers.C3_physical * 0.15
  );

  // CLF — Compatibilidade Linguística e Filosófica
  // Cultural and philosophical alignment
  const CLF = Math.round(
    culturalMatch * 0.5 +
    layers.C4_behavioral * 0.3 +
    layers.C5_narrative * 0.2
  );

  // GNE — Grau de Necessidade Estratégica
  // How strategically necessary is this signing
  const GNE = Math.round(
    squadNeed * 0.5 +
    layers.C2_tactical * 0.2 +
    layers.C6_economic * 0.15 +
    layers.C3_physical * 0.15
  );

  // WSE — Weight of Systemic Embedding
  // How deeply will this player integrate into the system
  const WSE = Math.round(
    systemFit * 0.3 +
    layers.C2_tactical * 0.25 +
    layers.C4_behavioral * 0.25 +
    culturalMatch * 0.2
  );

  // RBL — Risk-Benefit Loop
  // Balance of upside vs downside
  const RBL = Math.round(
    layers.C6_economic * 0.3 +
    layers.C1_technical * 0.25 +
    layers.C3_physical * 0.2 +
    (100 - layers.C4_behavioral) * 0.25 // Inverted: low behavioral = high risk
  );

  // SACE — Score de Adaptação Cultural e Emocional
  // Emotional and cultural adaptation potential
  const SACE = Math.round(
    culturalMatch * 0.35 +
    layers.C4_behavioral * 0.35 +
    layers.C5_narrative * 0.15 +
    layers.C2_tactical * 0.15
  );

  // SCN+ — Score Cortex Neural Plus (master composite)
  const SCN_plus = Math.round(
    (AST + CLF + GNE + WSE + RBL + SACE) / 6
  );

  return {
    AST: Math.min(100, Math.max(0, AST)),
    CLF: Math.min(100, Math.max(0, CLF)),
    GNE: Math.min(100, Math.max(0, GNE)),
    WSE: Math.min(100, Math.max(0, WSE)),
    RBL: Math.min(100, Math.max(0, RBL)),
    SACE: Math.min(100, Math.max(0, SACE)),
    SCN_plus: Math.min(100, Math.max(0, SCN_plus)),
  };
}

/**
 * Position-specific weight presets
 * Different positions have different evaluation priorities
 */
export const POSITION_WEIGHTS: Record<string, Partial<Record<keyof NeuralLayers, number>>> = {
  GK: {
    C1_technical: 0.22,
    C2_tactical: 0.12,
    C3_physical: 0.18,
    C4_behavioral: 0.20,
    C5_narrative: 0.05,
    C6_economic: 0.13,
    C7_ai: 0.10,
  },
  CB: {
    C1_technical: 0.15,
    C2_tactical: 0.22,
    C3_physical: 0.18,
    C4_behavioral: 0.18,
    C5_narrative: 0.05,
    C6_economic: 0.12,
    C7_ai: 0.10,
  },
  ST: {
    C1_technical: 0.25,
    C2_tactical: 0.15,
    C3_physical: 0.15,
    C4_behavioral: 0.12,
    C5_narrative: 0.10,
    C6_economic: 0.13,
    C7_ai: 0.10,
  },
  AM: {
    C1_technical: 0.28,
    C2_tactical: 0.18,
    C3_physical: 0.10,
    C4_behavioral: 0.12,
    C5_narrative: 0.08,
    C6_economic: 0.14,
    C7_ai: 0.10,
  },
};
