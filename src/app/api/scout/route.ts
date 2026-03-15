import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { canUseAgent } from "@/lib/feature-gates";
import { runScout } from "@/lib/agents/scout-agent";
import { createAgentRun } from "@/db/queries";
import type { ScoutInput } from "@/types/cortex";

const VALID_POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"];

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!canUseAgent(session!.tier, "SCOUT")) {
      return NextResponse.json(
        { error: "Seu plano nao inclui acesso ao agente SCOUT. Faca upgrade para o plano Club Professional." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    if (!body.position || !VALID_POSITIONS.includes(body.position)) {
      return NextResponse.json({ error: "Posicao invalida" }, { status: 400 });
    }

    if (!Array.isArray(body.ageRange) || body.ageRange.length !== 2) {
      return NextResponse.json({ error: "Faixa etaria invalida" }, { status: 400 });
    }

    if (typeof body.budgetMax !== "number" || body.budgetMax <= 0) {
      return NextResponse.json({ error: "Orcamento invalido" }, { status: 400 });
    }

    if (!body.style || typeof body.style !== "string") {
      return NextResponse.json({ error: "Estilo de jogo obrigatorio" }, { status: 400 });
    }

    const input: ScoutInput = {
      position: body.position,
      ageRange: [body.ageRange[0], body.ageRange[1]],
      budgetMax: body.budgetMax,
      style: body.style.slice(0, 500),
      leaguePreference: Array.isArray(body.leaguePreference) ? body.leaguePreference : undefined,
      mustHaveTraits: Array.isArray(body.mustHaveTraits) ? body.mustHaveTraits : undefined,
    };

    const result = await runScout(input);

    // Log agent run
    await createAgentRun({
      agentType: "SCOUT",
      inputContext: input as unknown as Record<string, unknown>,
      outputResult: result as unknown as Record<string, unknown>,
      modelUsed: "claude-sonnet-4-20250514",
      success: true,
      userId: session!.userId,
      orgId: session!.orgId,
    }).catch(() => {});

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("SCOUT agent error:", error);
    return NextResponse.json(
      { error: "Erro ao executar agente SCOUT" },
      { status: 500 }
    );
  }
}
