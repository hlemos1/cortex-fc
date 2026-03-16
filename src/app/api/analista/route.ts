import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { canUseAgent } from "@/lib/feature-gates";
import { hasPermission } from "@/lib/rbac";
import { runAnalista } from "@/lib/agents/analista-agent";
import { createAgentRun } from "@/db/queries";
import type { AnalistaInput } from "@/types/cortex";
import { inngest } from "@/lib/inngest-client";

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "use_agents")) {
      return NextResponse.json({ error: "Sem permissao para usar agentes" }, { status: 403 });
    }

    if (!canUseAgent(session!.tier, "ANALISTA")) {
      return NextResponse.json(
        { error: "Seu plano nao inclui acesso ao agente ANALISTA. Faca upgrade para o plano Club Professional." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.matchId || typeof body.matchId !== "string") {
      return NextResponse.json({ error: "matchId obrigatorio" }, { status: 400 });
    }

    if (!body.homeTeam || !body.awayTeam) {
      return NextResponse.json({ error: "homeTeam e awayTeam obrigatorios" }, { status: 400 });
    }

    const input: AnalistaInput = {
      matchId: body.matchId,
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      competition: body.competition ?? "Liga",
      formation: body.formation,
      focusPlayerIds: Array.isArray(body.focusPlayerIds) ? body.focusPlayerIds : [],
      matchEvents: body.matchEvents,
      statsData: body.statsData,
      additionalContext: body.additionalContext,
    };

    const start = Date.now();
    const result = await runAnalista(input);
    const durationMs = Date.now() - start;

    // Log agent run
    const agentRun = await createAgentRun({
      agentType: "ANALISTA",
      inputContext: input as unknown as Record<string, unknown>,
      outputResult: result as unknown as Record<string, unknown>,
      modelUsed: "claude-sonnet-4-20250514",
      durationMs,
      success: true,
      userId: session!.userId,
      orgId: session!.orgId,
    }).catch(() => null);

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      await inngest.send({
        name: "cortex/agent.completed",
        data: {
          agentType: "ANALISTA",
          orgId: session!.orgId,
          userId: session!.userId,
          runId: agentRun?.id ?? "",
        },
      });
    } catch (err) {
      console.error("Failed to send agent.completed event:", err);
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("ANALISTA agent error:", error);
    return NextResponse.json(
      { error: "Erro ao executar agente ANALISTA" },
      { status: 500 }
    );
  }
}
