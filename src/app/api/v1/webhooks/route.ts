import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { canUseFeature } from "@/lib/feature-gates";
import { createWebhook, getOrgWebhooks, deleteWebhook } from "@/db/queries";
import crypto from "crypto";

const VALID_EVENTS = [
  "analysis_complete",
  "report_generated",
  "scouting_target_added",
  "agent_run_complete",
];

/**
 * GET /api/v1/webhooks — List webhooks
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const hooks = await getOrgWebhooks(session!.orgId);
    return NextResponse.json({ data: hooks });
  } catch (error) {
    console.error("Failed to list webhooks:", error);
    return NextResponse.json({ error: "Erro ao listar webhooks" }, { status: 500 });
  }
}

/**
 * POST /api/v1/webhooks — Register a webhook
 */
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    if (!canUseFeature(session!.tier, "apiAccess")) {
      return NextResponse.json(
        { error: "Webhooks require club_professional tier or higher" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, events } = body;

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Validate events
    const validatedEvents = (events ?? VALID_EVENTS).filter((e: string) =>
      VALID_EVENTS.includes(e)
    );
    if (validatedEvents.length === 0) {
      return NextResponse.json(
        { error: `Invalid events. Valid: ${VALID_EVENTS.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate signing secret
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    const hook = await createWebhook({
      orgId: session!.orgId,
      url,
      secret,
      events: validatedEvents,
    });

    return NextResponse.json({
      data: { ...hook, secret },
      warning: "Save the secret now. It cannot be retrieved again.",
    });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json({ error: "Erro ao criar webhook" }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/webhooks — Remove a webhook
 */
export async function DELETE(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const url = new URL(request.url);
    const hookId = url.searchParams.get("id");
    if (!hookId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deleteWebhook(hookId, session!.orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return NextResponse.json({ error: "Erro ao deletar webhook" }, { status: 500 });
  }
}
