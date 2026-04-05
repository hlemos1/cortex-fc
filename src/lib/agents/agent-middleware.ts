/**
 * Agent middleware — elimina boilerplate duplicado em 6 rotas de agente.
 *
 * Fowler: Extract Function — 70 linhas de auth+RBAC+quota+rate-limit+model
 * repetidas em oracle, scout, analista, board, cfo, coaching.
 *
 * Uso:
 *   export async function POST(req: Request) {
 *     return withAgentAuth(req, "ORACLE", agentRequestSchema, async (session, body, model) => {
 *       // logica especifica do agente
 *     });
 *   }
 */

import { NextResponse } from "next/server";
import type { z } from "zod";
import type { AgentType } from "@/types/cortex";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { checkAgentRateLimits } from "@/lib/rate-limit";
import { canUseAgent, checkAgentQuota } from "@/lib/feature-gates";
import { canUseModel, getDefaultModel } from "@/lib/ai-models";
import { parseBody } from "@/lib/api-schemas";

export interface AgentSession {
  userId: string;
  orgId: string;
  tier: string;
  role: string;
}

/**
 * Middleware que encapsula os 8 checks comuns a todas as rotas de agente:
 * 1. Auth (requireAuth)
 * 2. RBAC (hasPermission use_agents)
 * 3. Feature gate (canUseAgent por tipo)
 * 4. Quota mensal (checkAgentQuota)
 * 5. Rate limit user + org (checkAgentRateLimits)
 * 6. Body validation (parseBody com Zod schema)
 * 7. Model selection (getDefaultModel por tier)
 * 8. Model validation (canUseModel por tier)
 */
export async function withAgentAuth<TSchema extends z.ZodType>(
  req: Request,
  agentType: AgentType,
  schema: TSchema,
  handler: (session: AgentSession, body: z.infer<TSchema>, model: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // 1. Auth
    const { session, error } = await requireAuth();
    if (error) return error;

    // 2. RBAC
    if (!hasPermission(session!.role, "use_agents")) {
      return NextResponse.json({ error: "Sem permissao para usar agentes IA" }, { status: 403 });
    }

    // 3. Feature gate
    if (!canUseAgent(session!.tier, agentType)) {
      return NextResponse.json(
        {
          error: `Seu plano nao inclui acesso ao agente ${agentType}. Faca upgrade para continuar.`,
        },
        { status: 403 }
      );
    }

    // 4. Quota
    const agentQuota = await checkAgentQuota(session!.orgId, session!.tier);
    if (!agentQuota.allowed) {
      return NextResponse.json(
        {
          error:
            "Limite de execucoes de agente atingido para este mes. Faca upgrade para continuar.",
          usage: agentQuota.usage,
          limit: agentQuota.limit,
        },
        { status: 429 }
      );
    }

    // 5. Rate limit
    const rateCheck = await checkAgentRateLimits(session!.userId, session!.orgId);
    if (!rateCheck.allowed) {
      const msg =
        rateCheck.limitType === "org"
          ? "Limite de chamadas IA da organizacao atingido. Tente novamente em breve."
          : "Limite de chamadas IA atingido. Tente novamente em 1 minuto.";
      return NextResponse.json(
        { error: msg, retryAfter: rateCheck.retryAfter },
        {
          status: 429,
          headers: rateCheck.retryAfter ? { "Retry-After": String(rateCheck.retryAfter) } : {},
        }
      );
    }

    // 6. Body validation
    const { data: body, error: parseError } = await parseBody(req, schema);
    if (parseError) return parseError;

    // 7+8. Model selection + validation
    const model =
      ((body as Record<string, unknown>).model as string) || getDefaultModel(session!.tier);
    if (!canUseModel(session!.tier, model)) {
      return NextResponse.json({ error: "Model not available for your tier" }, { status: 403 });
    }

    // Delegate to agent-specific handler
    return await handler(
      {
        userId: session!.userId,
        orgId: session!.orgId,
        tier: session!.tier,
        role: session!.role,
      },
      body,
      model
    );
  } catch (err) {
    console.error(`[${agentType}] Agent error:`, err);
    return NextResponse.json({ error: `Erro ao executar agente ${agentType}` }, { status: 500 });
  }
}
