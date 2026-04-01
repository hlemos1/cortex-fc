import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { canUseAgent, checkAgentQuota } from "@/lib/feature-gates";
import { hasPermission } from "@/lib/rbac";
import { checkAgentRateLimits } from "@/lib/rate-limit";
import { runAnalista } from "@/lib/agents/analista-agent";
import { createAgentRun } from "@/db/queries";
import type { AnalistaInput } from "@/types/cortex";
import { canUseModel, getDefaultModel } from "@/lib/ai-models";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";
import { parseBody, agentRequestSchema } from "@/lib/api-schemas";

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

    const { data: validatedBody, error: parseError } = await parseBody(request, agentRequestSchema);
    if (parseError) return parseError;
    const body = validatedBody as Record<string, any>;

    // Model selection with tier validation
    const model = body.model || getDefaultModel(session!.tier);
    if (!canUseModel(session!.tier, model)) {
      return NextResponse.json(
        { error: "Model not available for your tier" },
        { status: 403 }
      );
    }

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
    const cacheParams = { matchId: input.matchId, homeTeam: input.homeTeam, awayTeam: input.awayTeam };
    const cached = await getCachedAgentResponse("ANALISTA", cacheParams);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    const agentResult = await runAnalista(input, model);

    // Log agent run with real token usage
    const agentRun = await createAgentRun({
      agentType: "ANALISTA",
      inputContext: input as unknown as Record<string, unknown>,
      outputResult: agentResult.data as unknown as Record<string, unknown>,
      modelUsed: agentResult.model,
      tokensUsed: agentResult.tokensUsed,
      durationMs: agentResult.durationMs,
      success: true,
      userId: session!.userId,
      orgId: session!.orgId,
    }).catch(() => null);

    // Cache the successful result
    await setCachedAgentResponse("ANALISTA", cacheParams, agentResult.data, TTL.DAY);

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
  } catch (error) {
    console.error("ANALISTA agent error:", error);
    return NextResponse.json(
      { error: "Erro ao executar agente ANALISTA" },
      { status: 500 }
    );
  }
}
