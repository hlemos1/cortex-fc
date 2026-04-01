import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { checkAgentRateLimits } from "@/lib/rate-limit";
import { createAgentRun } from "@/db/queries";
import { isValidUUID } from "@/lib/validation";
import { canUseAgent, checkAgentQuota } from "@/lib/feature-gates";
import { canUseModel, getDefaultModel } from "@/lib/ai-models";
import { checkAndAlertUsage } from "@/lib/cost-alerts";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { parseBody, agentRequestSchema } from "@/lib/api-schemas";

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    // RBAC check
    if (!hasPermission(session!.role, "use_agents")) {
      return NextResponse.json(
        { error: "Sem permissao para usar agentes IA" },
        { status: 403 }
      );
    }

    // Feature gate: check if tier allows ORACLE agent
    if (!canUseAgent(session!.tier, "ORACLE")) {
      return NextResponse.json(
        { error: "Seu plano nao inclui acesso ao agente ORACLE. Faca upgrade para continuar." },
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

    const { data: body, error: parseError } = await parseBody(req, agentRequestSchema);
    if (parseError) return parseError;

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

    // Model selection with tier validation
    const model = body.model || getDefaultModel(session!.tier);
    if (!canUseModel(session!.tier, model)) {
      return NextResponse.json(
        { error: "Model not available for your tier" },
        { status: 403 }
      );
    }

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
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nao configurada." },
        { status: 503 }
      );
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
      agentResult = await runOracleWithPlayerData({
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
      }, model);
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
      userId: session!.userId,
      orgId: session!.orgId,
    }).catch((err) => {
      // Don't fail the request if audit log fails
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
          orgId: session!.orgId,
          userId: session!.userId,
          runId: agentRun?.id ?? "",
          playerId,
        },
      });
    } catch (err) {
      console.error("Failed to send agent.completed event:", err);
    }

    // Check usage alerts after successful run
    try {
      await checkAndAlertUsage(session!.orgId, session!.tier, session!.userId);
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
  } catch (error) {
    console.error("ORACLE agent error:", error);

    const internalMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log failed run with internal details
    const { session } = await requireAuth().catch(() => ({ session: null, error: null }));
    if (session) {
      await createAgentRun({
        agentType: "ORACLE",
        inputContext: { error: "request failed" },
        modelUsed: "claude-sonnet-4-20250514",
        success: false,
        error: internalMessage,
        userId: session.userId,
        orgId: session.orgId,
      }).catch(() => {});
    }

    return NextResponse.json({ error: "Erro ao executar analise neural" }, { status: 500 });
  }
}
