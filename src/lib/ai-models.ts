export interface AIModel {
  id: string
  name: string
  description: string
  tier: "free" | "scout_individual" | "club_professional" | "holding_multiclub"
  costPer1kTokens: number // estimated cost in cents
  speed: "fast" | "standard" | "slow"
  quality: "good" | "great" | "best"
}

export const AI_MODELS: AIModel[] = [
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    description: "Rapido e eficiente. Ideal para consultas simples.",
    tier: "free",
    costPer1kTokens: 0.025,
    speed: "fast",
    quality: "good",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Equilibrio entre velocidade e qualidade. Recomendado.",
    tier: "club_professional",
    costPer1kTokens: 0.3,
    speed: "standard",
    quality: "great",
  },
  {
    id: "claude-opus-4-20250115",
    name: "Claude Opus 4",
    description: "Maximo desempenho. Para analises complexas e criticas.",
    tier: "holding_multiclub",
    costPer1kTokens: 1.5,
    speed: "slow",
    quality: "best",
  },
]

// Tier hierarchy for comparison
const TIER_LEVEL: Record<string, number> = {
  free: 0,
  scout_individual: 1,
  club_professional: 2,
  holding_multiclub: 3,
}

export function getAvailableModels(orgTier: string): AIModel[] {
  const level = TIER_LEVEL[orgTier] ?? 0
  return AI_MODELS.filter(m => TIER_LEVEL[m.tier] <= level)
}

export function canUseModel(orgTier: string, modelId: string): boolean {
  const model = AI_MODELS.find(m => m.id === modelId)
  if (!model) return false
  const level = TIER_LEVEL[orgTier] ?? 0
  return TIER_LEVEL[model.tier] <= level
}

export function getDefaultModel(orgTier: string): string {
  const available = getAvailableModels(orgTier)
  // Return the best model available for the tier
  return available[available.length - 1]?.id || "claude-haiku-4-5-20251001"
}
