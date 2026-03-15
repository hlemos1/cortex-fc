/**
 * Feature gating by subscription tier.
 *
 * Each tier defines limits for key features.
 * Check with `canUseFeature()` or `getLimit()` in API routes.
 */

type Tier = "free" | "scout_individual" | "club_professional" | "holding_multiclub";

interface TierLimits {
  analysesPerMonth: number;
  usersPerOrg: number;
  agents: string[];          // which AI agents are available
  algorithms: string[];      // which algorithm scores are visible
  scoutingTargets: number;
  reportsPerMonth: number;
  apiAccess: boolean;
  whiteLabel: boolean;
  sso: boolean;
  exportFormats: string[];
}

const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    analysesPerMonth: 5,
    usersPerOrg: 1,
    agents: ["ORACLE"],
    algorithms: ["SCN_plus", "AST", "CLF"],
    scoutingTargets: 5,
    reportsPerMonth: 1,
    apiAccess: false,
    whiteLabel: false,
    sso: false,
    exportFormats: [],
  },
  scout_individual: {
    analysesPerMonth: 50,
    usersPerOrg: 1,
    agents: ["ORACLE", "SCOUT"],
    algorithms: ["SCN_plus", "AST", "CLF"],
    scoutingTargets: 25,
    reportsPerMonth: 10,
    apiAccess: false,
    whiteLabel: false,
    sso: false,
    exportFormats: ["csv"],
  },
  club_professional: {
    analysesPerMonth: -1, // unlimited
    usersPerOrg: 10,
    agents: ["ORACLE", "ANALISTA", "SCOUT", "BOARD_ADVISOR", "CFO_MODELER", "COACHING_ASSIST"],
    algorithms: ["SCN_plus", "AST", "CLF", "GNE", "WSE", "RBL", "SACE"],
    scoutingTargets: -1,
    reportsPerMonth: -1,
    apiAccess: true,
    whiteLabel: false,
    sso: false,
    exportFormats: ["csv", "pdf"],
  },
  holding_multiclub: {
    analysesPerMonth: -1,
    usersPerOrg: -1,
    agents: ["ORACLE", "ANALISTA", "SCOUT", "BOARD_ADVISOR", "CFO_MODELER", "COACHING_ASSIST"],
    algorithms: ["SCN_plus", "AST", "CLF", "GNE", "WSE", "RBL", "SACE"],
    scoutingTargets: -1,
    reportsPerMonth: -1,
    apiAccess: true,
    whiteLabel: true,
    sso: true,
    exportFormats: ["csv", "pdf", "xlsx"],
  },
};

/**
 * Get limits for a tier
 */
export function getTierLimits(tier: string): TierLimits {
  const validTier = tier in TIER_LIMITS ? (tier as Tier) : "free";
  return TIER_LIMITS[validTier];
}

/**
 * Check if a specific feature is available for a tier
 */
export function canUseFeature(
  tier: string,
  feature: keyof TierLimits
): boolean {
  const limits = getTierLimits(tier);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/**
 * Check if a specific agent is available for a tier
 */
export function canUseAgent(tier: string, agentType: string): boolean {
  const limits = getTierLimits(tier);
  return limits.agents.includes(agentType);
}

/**
 * Check if usage count is within the tier limit.
 * Returns { allowed, remaining, limit }.
 */
export function checkUsageLimit(
  tier: string,
  feature: "analysesPerMonth" | "scoutingTargets" | "reportsPerMonth",
  currentUsage: number
): { allowed: boolean; remaining: number; limit: number } {
  const limits = getTierLimits(tier);
  const limit = limits[feature];

  if (limit === -1) {
    return { allowed: true, remaining: Infinity, limit: -1 };
  }

  return {
    allowed: currentUsage < limit,
    remaining: Math.max(0, limit - currentUsage),
    limit,
  };
}

/**
 * Get the minimum tier required for a feature
 */
export function requiredTierFor(feature: string): Tier {
  const tierOrder: Tier[] = ["free", "scout_individual", "club_professional", "holding_multiclub"];

  for (const tier of tierOrder) {
    const limits = TIER_LIMITS[tier];
    if (feature === "apiAccess" && limits.apiAccess) return tier;
    if (feature === "whiteLabel" && limits.whiteLabel) return tier;
    if (feature === "allAgents" && limits.agents.length === 6) return tier;
    if (feature === "allAlgorithms" && limits.algorithms.length === 7) return tier;
    if (feature === "pdfExport" && limits.exportFormats.includes("pdf")) return tier;
  }

  return "holding_multiclub";
}

/**
 * Tier display names
 */
export const TIER_NAMES: Record<Tier, string> = {
  free: "Free",
  scout_individual: "Scout Individual",
  club_professional: "Club Professional",
  holding_multiclub: "Holding Multi-Club",
};

/**
 * Check if tier A is higher or equal to tier B
 */
export function isTierAtLeast(currentTier: string, requiredTier: string): boolean {
  const order: Record<string, number> = {
    free: 0,
    scout_individual: 1,
    club_professional: 2,
    holding_multiclub: 3,
  };
  return (order[currentTier] ?? 0) >= (order[requiredTier] ?? 0);
}
