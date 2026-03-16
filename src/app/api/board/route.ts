import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { checkRateLimit, aiRateLimit } from "@/lib/rate-limit";
import { createAgentRun } from "@/db/queries";
import { canUseAgent } from "@/lib/feature-gates";
import { inngest } from "@/lib/inngest-client";

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "use_agents")) {
      return NextResponse.json(
        { error: "Sem permissao para usar agentes IA" },
        { status: 403 }
      );
    }

    if (!canUseAgent(session!.tier, "BOARD_ADVISOR")) {
      return NextResponse.json(
        { error: "Seu plano nao inclui acesso ao BOARD ADVISOR. Faca upgrade para club_professional." },
        { status: 403 }
      );
    }

    const { success: rateLimitOk } = await checkRateLimit(
      aiRateLimit,
      `ai:${session!.userId}`
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Limite de chamadas IA atingido. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      clubName,
      currentBudget,
      salaryCap,
      strategicGoals,
      currentSquadAssessment,
      windowType,
      leagueContext,
      existingTargets,
      competitorsActivity,
      financialConstraints,
      additionalContext,
    } = body;

    if (!clubName || currentBudget == null || salaryCap == null || !strategicGoals || !currentSquadAssessment || !windowType || !leagueContext) {
      return NextResponse.json(
        { error: "clubName, currentBudget, salaryCap, strategicGoals, currentSquadAssessment, windowType e leagueContext sao obrigatorios" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nao configurada." },
        { status: 503 }
      );
    }

    const inputContext = { clubName, currentBudget, salaryCap, windowType, leagueContext };
    const startTime = Date.now();

    const { runBoardAdvisor } = await import("@/lib/agents/board-advisor-agent");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let result;
    try {
      result = await runBoardAdvisor({
        clubName,
        currentBudget,
        salaryCap,
        strategicGoals,
        currentSquadAssessment,
        windowType,
        leagueContext,
        existingTargets,
        competitorsActivity,
        financialConstraints,
        additionalContext,
      });
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    const agentRun = await createAgentRun({
      agentType: "BOARD_ADVISOR",
      inputContext,
      outputResult: result as unknown as Record<string, unknown>,
      modelUsed: "claude-sonnet-4-20250514",
      durationMs,
      success: true,
      userId: session!.userId,
      orgId: session!.orgId,
    }).catch((err) => {
      console.error("Failed to log agent run:", err);
      return null;
    });

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      await inngest.send({
        name: "cortex/agent.completed",
        data: {
          agentType: "BOARD_ADVISOR",
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
    console.error("BOARD ADVISOR agent error:", error);

    const internalMessage =
      error instanceof Error ? error.message : "Unknown error";

    const { session } = await requireAuth().catch(() => ({ session: null, error: null }));
    if (session) {
      await createAgentRun({
        agentType: "BOARD_ADVISOR",
        inputContext: { error: "request failed" },
        modelUsed: "claude-sonnet-4-20250514",
        success: false,
        error: internalMessage,
        userId: session.userId,
        orgId: session.orgId,
      }).catch(() => {});
    }

    return NextResponse.json({ error: "Erro ao executar briefing executivo" }, { status: 500 });
  }
}
