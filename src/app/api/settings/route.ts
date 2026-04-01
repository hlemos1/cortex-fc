import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserPreferences, upsertUserPreferences } from "@/db/queries";
import { parseBody, settingsUpdateSchema } from "@/lib/api-schemas";

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

    const { data: body, error: parseError } = await parseBody(request, settingsUpdateSchema);
    if (parseError) return parseError;

    // Remove undefined keys — only send fields actually provided
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        sanitized[key] = value;
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
