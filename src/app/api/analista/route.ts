import { NextResponse } from "next/server";
import { runAnalista } from "@/lib/agents/analista-agent";
import { createAgentRun } from "@/db/queries";
import type { AnalistaInput } from "@/types/cortex";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { analistaAgentSchema } from "@/lib/api-schemas";
import { withAgentAuth } from "@/lib/agents/agent-middleware";

export async function POST(request: Request) {
  return withAgentAuth(request, "ANALISTA", analistaAgentSchema, async (session, body, model) => {
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

    // Check agent response cache
    const cacheParams = {
      matchId: input.matchId,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
    };
    const cached = await getCachedAgentResponse("ANALISTA", cacheParams);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    const agentResult = await runAnalista(input, model);

    const agentRun = await createAgentRun({
      agentType: "ANALISTA",
      inputContext: input as unknown as Record<string, unknown>,
      outputResult: agentResult.data as unknown as Record<string, unknown>,
      modelUsed: agentResult.model,
      tokensUsed: agentResult.tokensUsed,
      durationMs: agentResult.durationMs,
      success: true,
      userId: session.userId,
      orgId: session.orgId,
    }).catch(() => null);

    await setCachedAgentResponse("ANALISTA", cacheParams, agentResult.data, TTL.DAY);

    try {
      await inngest.send({
        name: "cortex/agent.completed",
        data: {
          agentType: "ANALISTA",
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
        durationMs: agentResult.durationMs,
      },
    });
  });
}
