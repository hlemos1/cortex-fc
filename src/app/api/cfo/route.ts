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

    if (!canUseAgent(session!.tier, "CFO_MODELER")) {
      return NextResponse.json(
        { error: "Seu plano nao inclui acesso ao agente CFO. Faca upgrade para club_professional." },
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
    const { playerId, proposedFee, proposedSalary, contractYears, sellingClubAsk } = body;

    // Model selection with tier validation
    const model = body.model || getDefaultModel(session!.tier);
    if (!canUseModel(session!.tier, model)) {
      return NextResponse.json(
        { error: "Model not available for your tier" },
        { status: 403 }
      );
    }

    if (!playerId || proposedFee == null || proposedSalary == null || !contractYears || sellingClubAsk == null) {
      return NextResponse.json(
        { error: "playerId, proposedFee, proposedSalary, contractYears e sellingClubAsk sao obrigatorios" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nao configurada." },
        { status: 503 }
      );
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
      agentResult = await runCfo({ playerId, proposedFee, proposedSalary, contractYears, sellingClubAsk }, model);
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
      userId: session!.userId,
      orgId: session!.orgId,
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
    console.error("CFO agent error:", error);

    const internalMessage =
      error instanceof Error ? error.message : "Unknown error";

    const { session } = await requireAuth().catch(() => ({ session: null, error: null }));
    if (session) {
      await createAgentRun({
        agentType: "CFO_MODELER",
        inputContext: { error: "request failed" },
        modelUsed: "claude-sonnet-4-20250514",
        success: false,
        error: internalMessage,
        userId: session.userId,
        orgId: session.orgId,
      }).catch(() => {});
    }

    return NextResponse.json({ error: "Erro ao executar modelagem financeira" }, { status: 500 });
  }
}
