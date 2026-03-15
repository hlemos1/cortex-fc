import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { scoutingTargets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { isValidUUID } from "@/lib/validation";
import { hasPermission } from "@/lib/rbac";

// PATCH — update scouting target (status, priority, notes, targetPrice)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const validStatuses = ["watching", "contacted", "negotiating", "closed", "passed"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Status invalido" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.priority !== undefined) {
      const validPriorities = ["high", "medium", "low"];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json({ error: "Prioridade invalida" }, { status: 400 });
      }
      updates.priority = body.priority;
    }

    if (body.notes !== undefined) {
      updates.notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;
    }

    if (body.targetPrice !== undefined) {
      updates.targetPrice = typeof body.targetPrice === "number" ? body.targetPrice : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nenhuma alteracao fornecida" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(scoutingTargets)
      .set(updates)
      .where(
        and(
          eq(scoutingTargets.id, id),
          eq(scoutingTargets.orgId, session!.orgId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Target nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update scouting target:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE — remove scouting target
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_team")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "ID invalido" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(scoutingTargets)
      .where(
        and(
          eq(scoutingTargets.id, id),
          eq(scoutingTargets.orgId, session!.orgId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Target nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: { id: deleted.id } });
  } catch (error) {
    console.error("Failed to delete scouting target:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
