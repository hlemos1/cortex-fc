import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazy-initialized Stripe client.
 * Avoids crashing at build time when STRIPE_SECRET_KEY is not set.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Price IDs from Stripe Dashboard — set these in .env
export const PRICE_IDS = {
  scout_individual: {
    monthly: process.env.STRIPE_PRICE_SCOUT_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_SCOUT_YEARLY ?? "",
  },
  club_professional: {
    monthly: process.env.STRIPE_PRICE_CLUB_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_CLUB_YEARLY ?? "",
  },
  holding_multiclub: {
    monthly: process.env.STRIPE_PRICE_HOLDING_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_HOLDING_YEARLY ?? "",
  },
} as const;

export type TierKey = keyof typeof PRICE_IDS;
export type BillingInterval = "monthly" | "yearly";

/**
 * Map a Stripe price ID back to a tier
 */
export function priceIdToTier(priceId: string): TierKey | null {
  for (const [tier, prices] of Object.entries(PRICE_IDS)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return tier as TierKey;
    }
  }
  return null;
}

/**
 * Validate that all required Stripe env vars are configured.
 */
export function validateStripeConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
  // Check at least one price is configured
  const hasAnyPrice = Object.values(PRICE_IDS).some(
    (tier) => tier.monthly || tier.yearly
  );
  if (!hasAnyPrice) missing.push("STRIPE_PRICE_* (at least one)");
  return { valid: missing.length === 0, missing };
}
