import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { checkAgentRateLimits } from "@/lib/rate-limit";
import { createAgentRun } from "@/db/queries";
import { canUseAgent, checkAgentQuota } from "@/lib/feature-gates";
import { canUseModel, getDefaultModel } from "@/lib/ai-models";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { parseBody, agentRequestSchema } from "@/lib/api-schemas";

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

    // Quota check: agent runs per month
    const agentQuota = await checkAgentQuota(session!.orgId, session!.tier);
    if (!agentQuota.allowed) {
      return NextResponse.json(
        {
          error: "Limite de execucoes de agente atingido para este mes. Faca upgrade para continuar.",
          usage: agentQuota.usage,
          limit: agentQuota.limit,
        },
        { status: 429 }
      );
    }

    // Rate limit (user + org)
    const rateCheck = await checkAgentRateLimits(session!.userId, session!.orgId);
    if (!rateCheck.allowed) {
      const msg = rateCheck.limitType === "org"
        ? "Limite de chamadas IA da organizacao atingido. Tente novamente em breve."
        : "Limite de chamadas IA atingido. Tente novamente em 1 minuto.";
      return NextResponse.json(
        { error: msg, retryAfter: rateCheck.retryAfter },
        { status: 429, headers: rateCheck.retryAfter ? { "Retry-After": String(rateCheck.retryAfter) } : {} }
      );
    }

    const { data: validatedBody, error: parseError } = await parseBody(req, agentRequestSchema);
    if (parseError) return parseError;
    const body = validatedBody as Record<string, any>;
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

    // Model selection with tier validation
    const model = body.model || getDefaultModel(session!.tier);
    if (!canUseModel(session!.tier, model)) {
      return NextResponse.json(
        { error: "Model not available for your tier" },
        { status: 403 }
      );
    }

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

    // Check agent response cache
    const cacheParams = { clubName, currentBudget, salaryCap, windowType, leagueContext };
    const cached = await getCachedAgentResponse("BOARD_ADVISOR", cacheParams);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    const startTime = Date.now();

    const { runBoardAdvisor } = await import("@/lib/agents/board-advisor-agent");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let agentResult;
    try {
      agentResult = await runBoardAdvisor({
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
      }, model);
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    const agentRun = await createAgentRun({
      agentType: "BOARD_ADVISOR",
      inputContext,
      outputResult: agentResult.data as unknown as Record<string, unknown>,
      modelUsed: agentResult.model,
      tokensUsed: agentResult.tokensUsed,
      durationMs,
      success: true,
      userId: session!.userId,
      orgId: session!.orgId,
    }).catch((err) => {
      console.error("Failed to log agent run:", err);
      return null;
    });

    // Cache the successful result
    await setCachedAgentResponse("BOARD_ADVISOR", cacheParams, agentResult.data, TTL.DAY);

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

    return NextResponse.json({
      data: agentResult.data,
      meta: {
        tokensUsed: agentResult.tokensUsed,
        inputTokens: agentResult.inputTokens,
        outputTokens: agentResult.outputTokens,
        costUsd: agentResult.costUsd,
        model: agentResult.model,
        durationMs,
      },
    });
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
