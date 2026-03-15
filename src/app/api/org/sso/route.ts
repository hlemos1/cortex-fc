import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { canUseFeature } from "@/lib/feature-gates";
import { getOrgById, updateOrgSso } from "@/db/queries";
import { audit } from "@/lib/audit";

/**
 * GET /api/org/sso — Get SSO config
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const org = await getOrgById(session!.orgId);
    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ssoProvider: org.ssoProvider,
        ssoEntityId: org.ssoEntityId,
        ssoLoginUrl: org.ssoLoginUrl,
        ssoEnabled: org.ssoEnabled,
        // Never expose certificate in GET
      },
    });
  } catch (error) {
    console.error("Failed to get SSO config:", error);
    return NextResponse.json({ error: "Erro ao buscar SSO" }, { status: 500 });
  }
}

/**
 * PATCH /api/org/sso — Update SSO config
 */
export async function PATCH(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    if (!canUseFeature(session!.tier, "sso")) {
      return NextResponse.json(
        { error: "SSO requires holding_multiclub tier" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ssoProvider, ssoEntityId, ssoLoginUrl, ssoCertificate, ssoEnabled } = body;

    if (ssoEnabled && (!ssoProvider || !ssoEntityId || !ssoLoginUrl)) {
      return NextResponse.json(
        { error: "ssoProvider, ssoEntityId and ssoLoginUrl are required to enable SSO" },
        { status: 400 }
      );
    }

    const updated = await updateOrgSso(session!.orgId, {
      ssoProvider,
      ssoEntityId,
      ssoLoginUrl,
      ssoCertificate,
      ssoEnabled,
    });

    audit({
      orgId: session!.orgId,
      userId: session!.userId,
      action: "sso.updated",
      entityType: "organization",
      entityId: session!.orgId,
      metadata: { ssoProvider, ssoEnabled },
      request,
    });

    return NextResponse.json({
      data: {
        ssoProvider: updated.ssoProvider,
        ssoEntityId: updated.ssoEntityId,
        ssoLoginUrl: updated.ssoLoginUrl,
        ssoEnabled: updated.ssoEnabled,
      },
    });
  } catch (error) {
    console.error("Failed to update SSO:", error);
    return NextResponse.json({ error: "Erro ao atualizar SSO" }, { status: 500 });
  }
}
