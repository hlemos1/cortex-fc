import { NextResponse } from "next/server";
import { runScout } from "@/lib/agents/scout-agent";
import { createAgentRun } from "@/db/queries";
import type { ScoutInput, PlayerCluster } from "@/types/cortex";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { scoutAgentSchema } from "@/lib/api-schemas";
import { withAgentAuth } from "@/lib/agents/agent-middleware";

const VALID_POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"];

export async function POST(request: Request) {
  return withAgentAuth(request, "SCOUT", scoutAgentSchema, async (session, body, model) => {
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
      position: body.position as PlayerCluster,
      ageRange: [body.ageRange[0], body.ageRange[1]],
      budgetMax: body.budgetMax,
      style: body.style.slice(0, 500),
      leaguePreference: Array.isArray(body.leaguePreference) ? body.leaguePreference : undefined,
      mustHaveTraits: Array.isArray(body.mustHaveTraits) ? body.mustHaveTraits : undefined,
    };

    // Check agent response cache
    const cacheParams = input as unknown as Record<string, unknown>;
    const cached = await getCachedAgentResponse("SCOUT", cacheParams);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    const agentResult = await runScout(input, model);

    // Log agent run with real token usage
    const agentRun = await createAgentRun({
      agentType: "SCOUT",
      inputContext: input as unknown as Record<string, unknown>,
      outputResult: agentResult.data as unknown as Record<string, unknown>,
      modelUsed: agentResult.model,
      tokensUsed: agentResult.tokensUsed,
      durationMs: agentResult.durationMs,
      success: true,
      userId: session.userId,
      orgId: session.orgId,
    }).catch(() => null);

    // Cache the successful result
    await setCachedAgentResponse("SCOUT", cacheParams, agentResult.data, TTL.DAY);

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      await inngest.send({
        name: "cortex/agent.completed",
        data: {
          agentType: "SCOUT",
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
