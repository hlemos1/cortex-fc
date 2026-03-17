import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
} from "@/db/queries";

/**
 * GET /api/simulator — List saved scenarios for current user
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const scenarios = await getScenarios(session!.orgId, session!.userId);
    return NextResponse.json({
      data: scenarios.map((s) => ({
        ...s,
        createdAt: s.createdAt?.toISOString() ?? null,
        updatedAt: s.updatedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("Simulator GET error:", err);
    return NextResponse.json({ error: "Erro ao buscar cenarios" }, { status: 500 });
  }
}

/**
 * POST /api/simulator — Create a new scenario
 *   { name, data }
 */
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    if (!body.name || !body.data) {
      return NextResponse.json({ error: "name and data are required" }, { status: 400 });
    }

    const scenario = await createScenario({
      orgId: session!.orgId,
      userId: session!.userId,
      name: body.name,
      data: body.data,
    });

    return NextResponse.json({ data: scenario }, { status: 201 });
  } catch (err) {
    console.error("Simulator POST error:", err);
    return NextResponse.json({ error: "Erro ao criar cenario" }, { status: 500 });
  }
}

/**
 * PATCH /api/simulator — Update a scenario
 *   { id, name?, data? }
 */
export async function PATCH(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: { name?: string; data?: unknown } = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.data !== undefined) updates.data = body.data;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await updateScenario(body.id, session!.userId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Cenario nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("Simulator PATCH error:", err);
    return NextResponse.json({ error: "Erro ao atualizar cenario" }, { status: 500 });
  }
}

/**
 * DELETE /api/simulator — Delete a scenario
 *   { id }
 */
export async function DELETE(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deleteScenario(body.id, session!.userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Simulator DELETE error:", err);
    return NextResponse.json({ error: "Erro ao excluir cenario" }, { status: 500 });
  }
}
