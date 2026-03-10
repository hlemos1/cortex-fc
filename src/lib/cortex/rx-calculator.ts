import type { RxComponents } from "@/types/cortex";

/**
 * Rx (Risk Index) Calculator
 *
 * Formula: Rx = (Tg + Cx + Ep + Ni + Mf - Mi - S) / (Va + Mj)
 *
 * Where:
 *   Tg = Tactical gap (how much the squad needs this profile)
 *   Cx = Contextual fit (system/formation compatibility)
 *   Ep = Experience profile (similar league/pressure experience)
 *   Ni = Narrative index (media/fan/dressing room fit)
 *   Mf = Mental fortitude (big-game temperament)
 *   Mi = Injury micro-risk (chronic patterns)
 *   S  = Suspension risk (disciplinary record)
 *   Va = Value at risk (financial downside in millions EUR)
 *   Mj = Market jitter (price volatility for this profile)
 *
 * Interpretation:
 *   Rx < 0.8  = Low risk, safe move
 *   Rx 0.8-1.2 = Moderate risk, acceptable
 *   Rx 1.2-1.8 = Elevated risk, proceed with caution
 *   Rx > 1.8  = High risk, flag for review
 */

export function calculateRx(components: RxComponents): number {
  const {
    tacticalGap,
    contextualFit,
    experienceProfile,
    narrativeIndex,
    mentalFortitude,
    injuryMicroRisk,
    suspensionRisk,
    valueAtRisk,
    marketJitter,
  } = components;

  const positives =
    tacticalGap + contextualFit + experienceProfile + narrativeIndex + mentalFortitude;
  const negatives = injuryMicroRisk + suspensionRisk;

  // The risk denominator: financial exposure + market volatility
  // Higher exposure = higher denominator = lower Rx (counterintuitive but correct:
  // we want to penalize low "safety net" scores)
  // So we invert: higher risk factors in denominator REDUCE the ratio,
  // meaning the risk mitigation factors need to be stronger

  const riskExposure = valueAtRisk + marketJitter;

  // Guard: avoid division by zero
  if (riskExposure <= 0) {
    return 0;
  }

  const SCALE_FACTOR = 1.5;
  const adjustedPositives = (positives - negatives) * SCALE_FACTOR;

  const rx = adjustedPositives / riskExposure;

  return Math.round(rx * 100) / 100;
}

/**
 * Calculate tactical gap score
 * How much does the squad need this specific profile?
 */
export function calculateTacticalGap(
  squadDepthAtPosition: number, // how many players at this position
  avgQualityAtPosition: number, // avg rating 0-10
  isStarterQuality: boolean
): number {
  if (squadDepthAtPosition === 0) return 10; // Critical need
  if (squadDepthAtPosition === 1 && isStarterQuality) return 8;
  if (squadDepthAtPosition === 1) return 6;
  if (avgQualityAtPosition < 5) return 7;
  if (avgQualityAtPosition < 7) return 4;
  return 2; // Well-covered position
}

/**
 * Mental fortitude score from big-game data
 */
export function calculateMentalFortitude(
  goalsInKnockouts: number,
  penaltiesScored: number,
  penaltiesMissed: number,
  internationalCaps: number
): number {
  let score = 5; // baseline

  // Knockout performance
  if (goalsInKnockouts > 5) score += 2;
  else if (goalsInKnockouts > 2) score += 1;

  // Penalty record
  const penaltyRatio =
    penaltiesScored + penaltiesMissed > 0
      ? penaltiesScored / (penaltiesScored + penaltiesMissed)
      : 0.5;
  if (penaltyRatio > 0.8) score += 1;
  else if (penaltyRatio < 0.5) score -= 1;

  // International experience
  if (internationalCaps > 50) score += 2;
  else if (internationalCaps > 20) score += 1;

  return Math.max(0, Math.min(10, score));
}
