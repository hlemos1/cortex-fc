import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserOrgs } from "@/db/queries";

/**
 * Switch active organization for the current user.
 * Returns org details to be stored client-side for session update.
 */
export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId obrigatorio" }, { status: 400 });
    }

    // Verify user is member of the target org
    const userOrgs = await getUserOrgs(session!.userId);
    const targetOrg = userOrgs.find((o) => o.orgId === orgId);

    if (!targetOrg) {
      return NextResponse.json({ error: "Voce nao e membro desta organizacao" }, { status: 403 });
    }

    return NextResponse.json({
      data: {
        orgId: targetOrg.orgId,
        orgName: targetOrg.orgName,
        orgSlug: targetOrg.orgSlug,
        role: targetOrg.role,
        tier: targetOrg.orgTier,
      },
    });
  } catch (error) {
    console.error("Failed to switch org:", error);
    return NextResponse.json({ error: "Erro ao trocar organizacao" }, { status: 500 });
  }
}
