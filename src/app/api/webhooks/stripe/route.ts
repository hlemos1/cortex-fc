import { NextResponse } from "next/server";
import { getStripe, priceIdToTier } from "@/lib/stripe";
import { db } from "@/db/index";
import { organizations, auditLogs, notifications, orgMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { getUsageQuotaLimits, isTierAtLeast, TIER_NAMES } from "@/lib/feature-gates";
import { getOrgUsageThisMonth } from "@/db/queries";

/**
 * Find org by Stripe customer ID
 */
async function getOrgByStripeCustomerId(customerId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);
  return org || null;
}

/**
 * Update org subscription tier
 */
async function updateOrgTier(
  orgId: string,
  tier: "free" | "scout_individual" | "club_professional" | "holding_multiclub",
  subscriptionId?: string | null
) {
  await db
    .update(organizations)
    .set({
      tier,
      ...(subscriptionId !== undefined ? { stripeSubscriptionId: subscriptionId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * Create audit log entry for billing events
 */
async function logBillingEvent(
  orgId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    orgId,
    action,
    entityType: "subscription",
    metadata,
  });
}

/**
 * Check if a Stripe event was already processed (idempotency).
 * Uses the audit log entityId to store the event ID.
 */
async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, "stripe_event"),
        eq(auditLogs.entityId, eventId)
      )
    )
    .limit(1);
  return !!existing;
}

/**
 * Mark a Stripe event as processed
 */
async function markEventProcessed(eventId: string, orgId: string, action: string) {
  await db.insert(auditLogs).values({
    orgId,
    action: `stripe.${action}`,
    entityType: "stripe_event",
    entityId: eventId,
    metadata: { processedAt: new Date().toISOString() },
  });
}

/**
 * Get admin user IDs for an org (for notifications)
 */
async function getOrgAdminIds(orgId: string): Promise<string[]> {
  const admins = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "admin")));
  return admins.map((a) => a.userId);
}

/**
 * Notify org admins about a billing event
 */
async function notifyOrgAdmins(
  orgId: string,
  type: string,
  title: string,
  body: string
) {
  const adminIds = await getOrgAdminIds(orgId);
  if (adminIds.length === 0) return;

  await db.insert(notifications).values(
    adminIds.map((userId) => ({
      orgId,
      userId,
      type,
      title,
      body,
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: skip if event already processed
  const alreadyProcessed = await isEventAlreadyProcessed(event.id);
  if (alreadyProcessed) {
    logger.info("Stripe webhook event already processed, skipping", { stripeEventId: event.id });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      // -- Checkout completed --
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const tier = session.metadata?.tier;

        if (orgId && tier) {
          await updateOrgTier(
            orgId,
            tier as "scout_individual" | "club_professional" | "holding_multiclub",
            session.subscription as string
          );

          await logBillingEvent(orgId, "billing.checkout_completed", {
            tier,
            subscriptionId: session.subscription,
            amountTotal: session.amount_total,
            currency: session.currency,
            userId: session.metadata?.userId,
            interval: session.metadata?.interval,
          });

          await markEventProcessed(event.id, orgId, "checkout_completed");
        }
        break;
      }

      // -- Subscription updated (plan change) --
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const newTier = priceId ? priceIdToTier(priceId) : null;

        if (newTier) {
          const previousTier = org.tier;
          await updateOrgTier(org.id, newTier);

          await logBillingEvent(org.id, "billing.subscription_updated", {
            previousTier,
            newTier,
            priceId,
            subscriptionId: subscription.id,
            status: subscription.status,
          });

          // Handle downgrade: check if current usage exceeds new tier limits
          if (!isTierAtLeast(newTier, previousTier)) {
            const usage = await getOrgUsageThisMonth(org.id);
            const newLimits = getUsageQuotaLimits(newTier);
            const warnings: string[] = [];

            if (newLimits.analysesPerMonth !== -1 && usage.analyses > newLimits.analysesPerMonth) {
              warnings.push(`Analises: ${usage.analyses}/${newLimits.analysesPerMonth}`);
            }
            if (newLimits.agentRunsPerMonth !== -1 && usage.agentRuns > newLimits.agentRunsPerMonth) {
              warnings.push(`Execucoes de agente: ${usage.agentRuns}/${newLimits.agentRunsPerMonth}`);
            }

            if (warnings.length > 0) {
              const previousName = TIER_NAMES[previousTier as keyof typeof TIER_NAMES] ?? previousTier;
              const newName = TIER_NAMES[newTier as keyof typeof TIER_NAMES] ?? newTier;
              await notifyOrgAdmins(
                org.id,
                "billing_downgrade_warning",
                "Aviso: uso excede limites do novo plano",
                `Sua assinatura foi alterada de ${previousName} para ${newName}. ` +
                `O uso atual excede os limites do novo plano: ${warnings.join(", ")}. ` +
                `Funcionalidades podem ser limitadas ate o proximo ciclo de cobranca.`
              );
            }
          }

          await markEventProcessed(event.id, org.id, "subscription_updated");
        }
        break;
      }

      // -- Subscription deleted (cancel) --
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        const previousTier = org.tier;
        await updateOrgTier(org.id, "free", null);

        await logBillingEvent(org.id, "billing.subscription_deleted", {
          previousTier,
          subscriptionId: subscription.id,
          canceledAt: subscription.canceled_at,
        });

        await notifyOrgAdmins(
          org.id,
          "billing_canceled",
          "Assinatura cancelada",
          `Sua assinatura foi cancelada. O plano foi revertido para Free.`
        );

        await markEventProcessed(event.id, org.id, "subscription_deleted");
        break;
      }

      // -- Invoice paid (successful payment) --
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        await logBillingEvent(org.id, "billing.invoice_paid", {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          invoiceUrl: invoice.hosted_invoice_url,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        });

        await markEventProcessed(event.id, org.id, "invoice_paid");
        break;
      }

      // -- Invoice payment failed --
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        await logBillingEvent(org.id, "billing.payment_failed", {
          invoiceId: invoice.id,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          attemptCount: invoice.attempt_count,
          nextPaymentAttempt: invoice.next_payment_attempt,
        });

        await notifyOrgAdmins(
          org.id,
          "payment_failed",
          "Falha no pagamento",
          `O pagamento da sua assinatura falhou. Verifique seu metodo de pagamento para evitar a suspensao do servico.`
        );

        await markEventProcessed(event.id, org.id, "payment_failed");
        break;
      }

      default:
        // Unhandled event type — acknowledge without processing
        logger.debug("Unhandled Stripe webhook event type", { eventType: event.type });
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const errorObj = err instanceof Error ? err : undefined;
    const message = errorObj?.message ?? "Unknown error";
    logger.error("Webhook processing failed", { eventType: event.type, stripeEventId: event.id }, errorObj);
    return NextResponse.json(
      { error: "Webhook processing failed", detail: message },
      { status: 500 }
    );
  }
}
