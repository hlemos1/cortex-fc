import { NextResponse } from "next/server";
import { createAgentRun } from "@/db/queries";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { cfoAgentSchema } from "@/lib/api-schemas";
import { withAgentAuth } from "@/lib/agents/agent-middleware";

export async function POST(req: Request) {
  return withAgentAuth(req, "CFO_MODELER", cfoAgentSchema, async (session, body, model) => {
    const { playerId, proposedFee, proposedSalary, contractYears, sellingClubAsk } = body;

    if (
      !playerId ||
      proposedFee == null ||
      proposedSalary == null ||
      !contractYears ||
      sellingClubAsk == null
    ) {
      return NextResponse.json(
        {
          error:
            "playerId, proposedFee, proposedSalary, contractYears e sellingClubAsk sao obrigatorios",
        },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY nao configurada." }, { status: 503 });
    }

    const inputContext = { playerId, proposedFee, proposedSalary, contractYears, sellingClubAsk };

    // Check agent response cache
    const cacheParams = { playerId, proposedFee, proposedSalary, contractYears, sellingClubAsk };
    const cached = await getCachedAgentResponse("CFO_MODELER", cacheParams);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    const startTime = Date.now();

    const { runCfo } = await import("@/lib/agents/cfo-agent");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let agentResult;
    try {
      agentResult = await runCfo(
        { playerId, proposedFee, proposedSalary, contractYears, sellingClubAsk },
        model
      );
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    const agentRun = await createAgentRun({
      agentType: "CFO_MODELER",
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
    await setCachedAgentResponse("CFO_MODELER", cacheParams, agentResult.data, TTL.DAY);

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      await inngest.send({
        name: "cortex/agent.completed",
        data: {
          agentType: "CFO_MODELER",
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
