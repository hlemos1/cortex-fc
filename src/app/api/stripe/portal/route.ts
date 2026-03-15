import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db/index";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    if (!org?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Nenhuma assinatura ativa encontrada" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: "Erro ao abrir portal de pagamento" },
      { status: 500 }
    );
  }
}
