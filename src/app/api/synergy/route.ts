import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { canUseAgent } from "@/lib/feature-gates";
import { checkRateLimit, aiRateLimit } from "@/lib/rate-limit";
import { calculateSynergyIndex } from "@/lib/squad-synergy";
import { db } from "@/db/index";
import { neuralAnalyses, players } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * POST /api/synergy — Calculate squad synergy index for a player
 *
 * Body: { playerName, position, scnPlus, age, vx, rx }
 */
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!canUseAgent(session!.tier, "ANALISTA")) {
      return NextResponse.json(
        { error: "Synergy index requer acesso ao agente ANALISTA" },
        { status: 403 }
      );
    }

    // Rate limit
    const { success: rateLimitOk } = await checkRateLimit(
      aiRateLimit,
      `synergy:${session!.userId}`
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Limite de chamadas atingido. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { playerName, position, scnPlus, age, vx, rx } = body;

    if (!playerName || !position || scnPlus == null || !age || vx == null || rx == null) {
      return NextResponse.json(
        { error: "playerName, position, scnPlus, age, vx, rx sao obrigatorios" },
        { status: 400 }
      );
    }

    // Get squad: only players analyzed by this org's analysts
    const orgAnalyses = await db
      .select({
        playerName: players.name,
        position: players.positionCluster,
        scnPlus: neuralAnalyses.scnPlus,
        age: players.age,
        vx: neuralAnalyses.vx,
        rx: neuralAnalyses.rx,
      })
      .from(neuralAnalyses)
      .innerJoin(players, eq(neuralAnalyses.playerId, players.id))
      .where(sql`${neuralAnalyses.analystId} IN (
        SELECT id FROM users WHERE org_id = ${session!.orgId}
      )`)
      .orderBy(desc(neuralAnalyses.createdAt))
      .limit(500);

    const squad = orgAnalyses.map((a) => ({
      name: a.playerName,
      position: a.position,
      scnPlus: a.scnPlus ?? 50,
      age: a.age ?? 25,
      vx: a.vx ?? 50,
      rx: a.rx ?? 50,
    }));

    const result = calculateSynergyIndex(
      { name: playerName, position, scnPlus, age, vx, rx },
      squad
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Synergy calculation error:", error);
    return NextResponse.json(
      { error: "Erro ao calcular sinergia" },
      { status: 500 }
    );
  }
}
