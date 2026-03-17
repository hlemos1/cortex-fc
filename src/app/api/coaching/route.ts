import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { checkRateLimit, aiRateLimit } from "@/lib/rate-limit";
import { createAgentRun } from "@/db/queries";
import { canUseAgent } from "@/lib/feature-gates";
import { canUseModel, getDefaultModel } from "@/lib/ai-models";
import { inngest } from "@/lib/inngest-client";
import { getCachedAgentResponse, setCachedAgentResponse, TTL } from "@/lib/cache";

const VALID_POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"];

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

    if (!canUseAgent(session!.tier, "COACHING_ASSIST")) {
      return NextResponse.json(
        { error: "Seu plano nao inclui acesso ao COACHING ASSIST. Faca upgrade para club_professional." },
        { status: 403 }
      );
    }

    const { success: rateLimitOk } = await checkRateLimit(
      aiRateLimit,
      `ai:${session!.userId}`
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Limite de chamadas IA atingido. Tente novamente em 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
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

    // Model selection with tier validation
    const model = body.model || getDefaultModel(session!.tier);
    if (!canUseModel(session!.tier, model)) {
      return NextResponse.json(
        { error: "Model not available for your tier" },
        { status: 403 }
      );
    }

    if (!playerId || !playerName || !position || !age || !targetRole || !strengths?.length || !weaknesses?.length) {
      return NextResponse.json(
        { error: "playerId, playerName, position, age, targetRole, strengths e weaknesses sao obrigatorios" },
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
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nao configurada." },
        { status: 503 }
      );
    }

    const inputContext = { playerId, playerName, position, age, targetRole };

    // Check agent response cache
    const cacheParams = { playerId, position, targetRole, developmentHorizon: developmentHorizon ?? "medium" };
    const cached = await getCachedAgentResponse("COACHING_ASSIST", cacheParams);
    if (cached) {
      return NextResponse.json({ data: cached, fromCache: true });
    }

    const startTime = Date.now();

    const { runCoachingAssist } = await import("@/lib/agents/coaching-assist-agent");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let result;
    try {
      result = await runCoachingAssist({
        playerId,
        playerName,
        position,
        age,
        currentClub: currentClub ?? "",
        strengths,
        weaknesses,
        targetRole,
        formationContext,
        developmentHorizon,
        additionalContext,
      }, model);
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    const agentRun = await createAgentRun({
      agentType: "COACHING_ASSIST",
      inputContext,
      outputResult: result as unknown as Record<string, unknown>,
      modelUsed: model,
      durationMs,
      success: true,
      userId: session!.userId,
      orgId: session!.orgId,
    }).catch((err) => {
      console.error("Failed to log agent run:", err);
      return null;
    });

    // Cache the successful result
    await setCachedAgentResponse("COACHING_ASSIST", cacheParams, result, TTL.DAY);

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      await inngest.send({
        name: "cortex/agent.completed",
        data: {
          agentType: "COACHING_ASSIST",
          orgId: session!.orgId,
          userId: session!.userId,
          runId: agentRun?.id ?? "",
        },
      });
    } catch (err) {
      console.error("Failed to send agent.completed event:", err);
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("COACHING ASSIST agent error:", error);

    const internalMessage =
      error instanceof Error ? error.message : "Unknown error";

    const { session } = await requireAuth().catch(() => ({ session: null, error: null }));
    if (session) {
      await createAgentRun({
        agentType: "COACHING_ASSIST",
        inputContext: { error: "request failed" },
        modelUsed: "claude-sonnet-4-20250514",
        success: false,
        error: internalMessage,
        userId: session.userId,
        orgId: session.orgId,
      }).catch(() => {});
    }

    return NextResponse.json({ error: "Erro ao gerar plano de desenvolvimento" }, { status: 500 });
  }
}
