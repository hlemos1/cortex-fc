import type { VxComponents } from "@/types/cortex";

/**
 * Vx (Value Index) Calculator
 *
 * Formula: Vx = (T + M + A + N - D - L - R) / C
 *
 * Where:
 *   T = Technical score (on-ball quality)
 *   M = Market impact (brand/commercial value)
 *   A = Cultural adaptation (BHAR model)
 *   N = Networking benefit (compatriots, agent network)
 *   D = Age depreciation (career curve factor)
 *   L = Liabilities (salary burden + injury risk)
 *   R = Regulatory risk (work permit, visa, FFP)
 *   C = Total acquisition cost (millions EUR)
 *
 * Interpretation:
 *   Vx > 2.0  = Exceptional value
 *   Vx 1.5-2.0 = Strong value
 *   Vx 1.0-1.5 = Fair value
 *   Vx 0.5-1.0 = Below average
 *   Vx < 0.5  = Poor value / overpay risk
 */

export function calculateVx(components: VxComponents): number {
  const { technical, marketImpact, culturalAdaptation, networkingBenefit } =
    components;
  const { ageDepreciation, liabilities, regulatoryRisk, totalCost } =
    components;

  // Guard: cost cannot be zero
  if (totalCost <= 0) {
    return 0;
  }

  const positives = technical + marketImpact + culturalAdaptation + networkingBenefit;
  const negatives = ageDepreciation + liabilities + regulatoryRisk;

  // Normalize: components are 0-10, cost is in millions
  // Scale factor converts component sum to EUR-equivalent value
  const SCALE_FACTOR = 2.5; // Each point ~ EUR 2.5M of perceived value
  const rawValue = (positives - negatives) * SCALE_FACTOR;

  const vx = rawValue / totalCost;

  // Round to 2 decimal places
  return Math.round(vx * 100) / 100;
}

/**
 * Age depreciation curve
 * Players peak at ~27, decline accelerates after 30
 */
export function calculateAgeDepreciation(age: number): number {
  if (age <= 23) return 1.0; // Young, appreciating
  if (age <= 26) return 1.5; // Approaching peak
  if (age <= 28) return 2.0; // Peak
  if (age <= 30) return 3.5; // Starting decline
  if (age <= 32) return 5.5; // Significant depreciation
  if (age <= 34) return 7.5;
  return 9.0; // End of career
}

/**
 * Salary burden score
 * Based on salary as percentage of club's wage budget
 */
export function calculateSalaryBurden(
  annualSalary: number, // millions EUR
  clubWageBudget: number // millions EUR
): number {
  if (clubWageBudget <= 0) return 5;
  const ratio = annualSalary / clubWageBudget;
  if (ratio < 0.03) return 1;
  if (ratio < 0.06) return 2;
  if (ratio < 0.1) return 4;
  if (ratio < 0.15) return 6;
  if (ratio < 0.2) return 8;
  return 10;
}

/**
 * Injury risk score based on historical data
 */
export function calculateInjuryRisk(
  daysMissedLast3Seasons: number
): number {
  if (daysMissedLast3Seasons < 30) return 1;
  if (daysMissedLast3Seasons < 60) return 2;
  if (daysMissedLast3Seasons < 120) return 4;
  if (daysMissedLast3Seasons < 200) return 6;
  if (daysMissedLast3Seasons < 300) return 8;
  return 10;
}
