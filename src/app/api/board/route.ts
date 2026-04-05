import { NextResponse } from "next/server";
import { createAgentRun } from "@/db/queries";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { boardAgentSchema } from "@/lib/api-schemas";
import { withAgentAuth } from "@/lib/agents/agent-middleware";

export async function POST(req: Request) {
  return withAgentAuth(req, "BOARD_ADVISOR", boardAgentSchema, async (session, body, model) => {
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

    if (
      !clubName ||
      currentBudget == null ||
      salaryCap == null ||
      !strategicGoals ||
      !currentSquadAssessment ||
      !windowType ||
      !leagueContext
    ) {
      return NextResponse.json(
        {
          error:
            "clubName, currentBudget, salaryCap, strategicGoals, currentSquadAssessment, windowType e leagueContext sao obrigatorios",
        },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY nao configurada." }, { status: 503 });
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
      agentResult = await runBoardAdvisor(
        {
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
        },
        model
      );
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
      userId: session.userId,
      orgId: session.orgId,
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
          orgId: session.orgId,
          userId: session.userId,
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
  });
}
