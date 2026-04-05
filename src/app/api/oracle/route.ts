import { NextResponse } from "next/server";
import { createAgentRun } from "@/db/queries";
import { isValidUUID } from "@/lib/validation";
import { checkAndAlertUsage } from "@/lib/cost-alerts";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { agentRequestSchema } from "@/lib/api-schemas";
import { withAgentAuth } from "@/lib/agents/agent-middleware";

export async function POST(req: Request) {
  return withAgentAuth(req, "ORACLE", agentRequestSchema, async (session, body, model) => {
    const {
      playerId,
      clubContextId,
      playerName,
      position,
      age,
      nationality,
      currentClub,
      marketValue,
      contractEnd,
      targetClubName,
      targetClubLeague,
    } = body;

    if (!playerId || !clubContextId || !playerName || !position) {
      return NextResponse.json(
        { error: "playerId, clubContextId, playerName, and position are required" },
        { status: 400 }
      );
    }

    if (!isValidUUID(playerId) || !isValidUUID(clubContextId)) {
      return NextResponse.json(
        { error: "playerId and clubContextId must be valid UUIDs" },
        { status: 400 }
      );
    }

    // Check agent response cache
    const cacheParams = { playerId, clubContextId };
    const cached = await getCachedAgentResponse("ORACLE", cacheParams);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY nao configurada." }, { status: 503 });
    }

    const inputContext = {
      playerId,
      clubContextId,
      playerName,
      position,
      age: age ?? 25,
      nationality: nationality ?? "",
      currentClub: currentClub ?? "",
      marketValue: marketValue ?? 0,
    };

    const startTime = Date.now();

    // Import dynamically with timeout
    const { runOracleWithPlayerData } = await import("@/lib/agents/oracle-agent");

    // Run with 60s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let agentResult;
    try {
      agentResult = await runOracleWithPlayerData(
        {
          playerId,
          clubContextId,
          vxComponents: {},
          rxComponents: {},
          playerName,
          playerAge: age ?? 25,
          position,
          nationality: nationality ?? "",
          currentClub: currentClub ?? "",
          marketValue: marketValue ?? 0,
          contractUntil: contractEnd,
          buyingClubName: targetClubName ?? "",
          buyingClubLeague: targetClubLeague ?? "",
        },
        model
      );
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    // Audit log with real token usage
    const agentRun = await createAgentRun({
      agentType: "ORACLE",
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
    await setCachedAgentResponse("ORACLE", cacheParams, agentResult.data, TTL.DAY);

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      await inngest.send({
        name: "cortex/agent.completed",
        data: {
          agentType: "ORACLE",
          orgId: session.orgId,
          userId: session.userId,
          runId: agentRun?.id ?? "",
          playerId,
        },
      });
    } catch (err) {
      console.error("Failed to send agent.completed event:", err);
    }

    // Check usage alerts after successful run
    try {
      await checkAndAlertUsage(session.orgId, session.tier, session.userId);
    } catch (err) {
      console.error("Failed to check usage alerts:", err);
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
