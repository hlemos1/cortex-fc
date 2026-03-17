import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserPreferences, upsertUserPreferences } from "@/db/queries";

/**
 * GET /api/settings — Return user preferences for current org
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const prefs = await getUserPreferences(session!.userId, session!.orgId);

    // Return defaults if no record exists yet
    const data = prefs ?? {
      aiModel: "claude-sonnet-4-20250514",
      maxTokens: 4096,
      temperature: 0.7,
      notifyContracts: true,
      notifyReports: true,
      notifyScouting: true,
      notifyRisk: true,
      density: "normal",
      language: "pt-BR",
      soundEnabled: false,
      hapticEnabled: true,
      soundVolume: 0.3,
    };

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Settings GET error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar preferencias" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings — Update user preferences
 */
export async function PATCH(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();

    // Whitelist allowed fields
    const allowed: Record<string, boolean> = {
      aiModel: true,
      maxTokens: true,
      temperature: true,
      notifyContracts: true,
      notifyReports: true,
      notifyScouting: true,
      notifyRisk: true,
      density: true,
      language: true,
      soundEnabled: true,
      hapticEnabled: true,
      soundVolume: true,
    };

    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (allowed[key]) {
        sanitized[key] = body[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo valido para atualizar" },
        { status: 400 }
      );
    }

    const updated = await upsertUserPreferences(
      session!.userId,
      session!.orgId,
      sanitized
    );

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("Settings PATCH error:", err);
    return NextResponse.json(
      { error: "Erro ao salvar preferencias" },
      { status: 500 }
    );
  }
}
