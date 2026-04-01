import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { getStripe, PRICE_IDS, type TierKey, type BillingInterval } from "@/lib/stripe";
import { db } from "@/db/index";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { parseBody, checkoutSchema } from "@/lib/api-schemas";

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json(
        { error: "Apenas administradores podem gerenciar assinatura" },
        { status: 403 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe nao configurado" },
        { status: 503 }
      );
    }

    const { data: body, error: parseError } = await parseBody(req, checkoutSchema);
    if (parseError) return parseError;
    const { tier, interval } = body as {
      tier: TierKey;
      interval: BillingInterval;
    };

    if (!tier || !PRICE_IDS[tier]) {
      return NextResponse.json(
        { error: "Plano invalido. Escolha: scout_individual, club_professional, ou holding_multiclub" },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[tier][interval];
    if (!priceId) {
      return NextResponse.json(
        { error: "Plano nao configurado. Configure STRIPE_PRICE_* no ambiente." },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, session!.orgId),
    });

    if (!org) {
      return NextResponse.json({ error: "Organizacao nao encontrada" }, { status: 404 });
    }

    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        metadata: { orgId: org.id },
        name: org.name,
      });
      customerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId: customerId })
        .where(eq(organizations.id, org.id));
    }

    // Use NEXT_PUBLIC_APP_URL as primary, then origin header, then NEXTAUTH_URL
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      req.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";

    // Trial only applies if org is currently on free tier
    const trialDays = org.tier === "free" ? 14 : undefined;

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        orgId: org.id,
        tier,
        userId: session!.userId,
        interval,
      },
      subscription_data: {
        metadata: {
          orgId: org.id,
          tier,
          userId: session!.userId,
          interval,
        },
        trial_period_days: trialDays,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    logger.error("Stripe checkout error", {}, err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: "Erro ao criar sessao de pagamento" },
      { status: 500 }
    );
  }
}
