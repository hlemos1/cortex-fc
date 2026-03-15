import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { canUseFeature } from "@/lib/feature-gates";
import { getOrgById, updateOrgBranding } from "@/db/queries";
import { audit } from "@/lib/audit";

/**
 * GET /api/org/branding — Get org branding settings
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const org = await getOrgById(session!.orgId);
    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        name: org.name,
        logoUrl: org.logoUrl,
        brandPrimaryColor: org.brandPrimaryColor,
        brandAccentColor: org.brandAccentColor,
        brandDarkBg: org.brandDarkBg,
        customDomain: org.customDomain,
        faviconUrl: org.faviconUrl,
      },
    });
  } catch (error) {
    console.error("Failed to get branding:", error);
    return NextResponse.json({ error: "Erro ao buscar branding" }, { status: 500 });
  }
}

/**
 * PATCH /api/org/branding — Update org branding
 */
export async function PATCH(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    if (!canUseFeature(session!.tier, "whiteLabel")) {
      return NextResponse.json(
        { error: "White-label requires holding_multiclub tier" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { brandPrimaryColor, brandAccentColor, brandDarkBg, customDomain, faviconUrl, logoUrl } = body;

    const updated = await updateOrgBranding(session!.orgId, {
      brandPrimaryColor,
      brandAccentColor,
      brandDarkBg,
      customDomain,
      faviconUrl,
      logoUrl,
    });

    audit({
      orgId: session!.orgId,
      userId: session!.userId,
      action: "branding.updated",
      entityType: "organization",
      entityId: session!.orgId,
      metadata: body,
      request,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update branding:", error);
    return NextResponse.json({ error: "Erro ao atualizar branding" }, { status: 500 });
  }
}
