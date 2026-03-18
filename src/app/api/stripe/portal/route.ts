import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db/index";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

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

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, session!.orgId),
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organizacao nao encontrada" },
        { status: 404 }
      );
    }

    let customerId = org.stripeCustomerId;

    // If org doesn't have a Stripe customer yet, create one
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

      logger.info("Created Stripe customer for portal access", {
        orgId: org.id,
        stripeCustomerId: customerId,
      });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      req.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    logger.error("Stripe portal error", {}, err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: "Erro ao abrir portal de pagamento" },
      { status: 500 }
    );
  }
}
