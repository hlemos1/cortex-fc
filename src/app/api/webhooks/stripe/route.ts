import { NextResponse } from "next/server";
import { getStripe, priceIdToTier } from "@/lib/stripe";
import { db } from "@/db/index";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const tier = session.metadata?.tier;

        if (orgId && tier) {
          await db
            .update(organizations)
            .set({
              tier: tier as "scout_individual" | "club_professional" | "holding_multiclub",
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId));

          console.log(`[Stripe] Org ${orgId} upgraded to ${tier}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;

        if (orgId) {
          const priceId = subscription.items.data[0]?.price?.id;
          const newTier = priceId ? priceIdToTier(priceId) : null;

          if (newTier) {
            await db
              .update(organizations)
              .set({
                tier: newTier,
                updatedAt: new Date(),
              })
              .where(eq(organizations.id, orgId));

            console.log(`[Stripe] Org ${orgId} subscription updated to ${newTier}`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;

        if (orgId) {
          await db
            .update(organizations)
            .set({
              tier: "free",
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId));

          console.log(`[Stripe] Org ${orgId} downgraded to free (subscription canceled)`);
        }
        break;
      }

      default:
        // Unhandled event type — log but don't fail
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
