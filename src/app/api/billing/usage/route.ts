import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getOrgUsageThisMonth } from "@/db/queries";
import { getUsageQuotaLimits, getUsagePercent, TIER_NAMES } from "@/lib/feature-gates";
import { db } from "@/db/index";
import { organizations, reports } from "@/db/schema";
import { eq, and, gte, isNull, count } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { logger } from "@/lib/logger";

/**
 * GET /api/billing/usage
 * Returns comprehensive usage stats for the current org this month.
 */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const orgId = session!.orgId;

    // Get org info
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      return NextResponse.json({ error: "Organizacao nao encontrada" }, { status: 404 });
    }

    const tier = org.tier;
    const limits = getUsageQuotaLimits(tier);

    // Get usage this month
    const usage = await getOrgUsageThisMonth(orgId);

    // Get reports count this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [reportsResult] = await db
      .select({ value: count() })
      .from(reports)
      .where(
        and(
          eq(reports.orgId, orgId),
          gte(reports.createdAt, startOfMonth),
          isNull(reports.deletedAt)
        )
      );

    const reportsUsed = reportsResult?.value ?? 0;

    // Get billing period end from Stripe subscription if available
    let billingPeriodEnd: string | null = null;
    let trialEndsAt: string | null = org.trialEndsAt?.toISOString() ?? null;

    if (org.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(org.stripeSubscriptionId) as Stripe.Subscription;
        // In Stripe clover API, current_period_end is on the subscription item
        const firstItem = subscription.items?.data?.[0];
        if (firstItem?.current_period_end) {
          billingPeriodEnd = new Date(firstItem.current_period_end * 1000).toISOString();
        }
        if (subscription.trial_end) {
          trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
        }
      } catch (err) {
        logger.warn("Failed to fetch Stripe subscription for usage endpoint", {
          orgId,
          subscriptionId: org.stripeSubscriptionId,
        });
      }
    }

    // Build the reportsPerMonth limit from the original TIER_LIMITS
    // (USAGE_QUOTA_LIMITS doesn't have reports, so we use feature-gates getTierLimits)
    const { getTierLimits } = await import("@/lib/feature-gates");
    const tierLimits = getTierLimits(tier);

    return NextResponse.json({
      usage: {
        analyses: {
          used: usage.analyses,
          limit: limits.analysesPerMonth,
          percentage: getUsagePercent(usage.analyses, limits.analysesPerMonth),
        },
        agentRuns: {
          used: usage.agentRuns,
          limit: limits.agentRunsPerMonth,
          percentage: getUsagePercent(usage.agentRuns, limits.agentRunsPerMonth),
        },
        reports: {
          used: reportsUsed,
          limit: tierLimits.reportsPerMonth,
          percentage: getUsagePercent(reportsUsed, tierLimits.reportsPerMonth),
        },
      },
      tier,
      tierDisplayName: TIER_NAMES[tier as keyof typeof TIER_NAMES] ?? tier,
      billingPeriodEnd,
      trialEndsAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to fetch billing usage", { orgId: session!.orgId }, err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: "Erro ao buscar uso", detail: message },
      { status: 500 }
    );
  }
}
