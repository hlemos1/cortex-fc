import { NextResponse } from "next/server";
import { createAgentRun } from "@/db/queries";
import type { PlayerCluster, CoachingAssistInput } from "@/types/cortex";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { coachingAgentSchema } from "@/lib/api-schemas";
import { withAgentAuth } from "@/lib/agents/agent-middleware";

const VALID_POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"];

export async function POST(req: Request) {
  return withAgentAuth(
    req,
    "COACHING_ASSIST",
    coachingAgentSchema,
    async (session, body, model) => {
      const {
        playerId,
        playerName,
        position,
        age,
        currentClub,
        strengths,
        weaknesses,
        targetRole,
        formationContext,
        developmentHorizon,
        additionalContext,
      } = body;

      if (
        !playerId ||
        !playerName ||
        !position ||
        !age ||
        !targetRole ||
        !strengths?.length ||
        !weaknesses?.length
      ) {
        return NextResponse.json(
          {
            error:
              "playerId, playerName, position, age, targetRole, strengths e weaknesses sao obrigatorios",
          },
          { status: 400 }
        );
      }

      if (!VALID_POSITIONS.includes(position)) {
        return NextResponse.json(
          { error: `Posicao invalida. Use: ${VALID_POSITIONS.join(", ")}` },
          { status: 400 }
        );
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: "ANTHROPIC_API_KEY nao configurada." }, { status: 503 });
      }

      const inputContext = { playerId, playerName, position, age, targetRole };

      // Check agent response cache
      const cacheParams = {
        playerId,
        position,
        targetRole,
        developmentHorizon: developmentHorizon ?? "medium",
      };
      const cached = await getCachedAgentResponse("COACHING_ASSIST", cacheParams);
      if (cached) {
        return NextResponse.json({ data: cached, fromCache: true });
      }

      const startTime = Date.now();

      const { runCoachingAssist } = await import("@/lib/agents/coaching-assist-agent");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      let agentResult;
      try {
        agentResult = await runCoachingAssist(
          {
            playerId,
            playerName,
            position: position as PlayerCluster,
            age,
            currentClub: currentClub ?? "",
            strengths,
            weaknesses,
            targetRole,
            formationContext,
            developmentHorizon: developmentHorizon as CoachingAssistInput["developmentHorizon"],
            additionalContext,
          },
          model
        );
      } finally {
        clearTimeout(timeout);
      }

      const durationMs = Date.now() - startTime;

      const agentRun = await createAgentRun({
        agentType: "COACHING_ASSIST",
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
      await setCachedAgentResponse("COACHING_ASSIST", cacheParams, agentResult.data, TTL.DAY);

      // Emit event for background processing (notifications, cache invalidation, webhooks)
      try {
        await inngest.send({
          name: "cortex/agent.completed",
          data: {
            agentType: "COACHING_ASSIST",
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
    }
  );
}
