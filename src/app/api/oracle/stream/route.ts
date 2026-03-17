import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { hasPermission } from "@/lib/rbac"
import { checkRateLimit, aiRateLimit } from "@/lib/rate-limit"
import { createAgentRun } from "@/db/queries"
import { isValidUUID } from "@/lib/validation"
import { canUseAgent } from "@/lib/feature-gates"
import { callAgentStreaming } from "@/lib/agents/base-agent"
import { inngest } from "@/lib/inngest-client"
import type { OracleOutput } from "@/types/cortex"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Oracle system prompt (same as oracle-agent.ts)
const ORACLE_SYSTEM_PROMPT = `Você é o CORTEX_FC_ORACLE — o sistema central de decisão do CORTEX FC, uma plataforma de analytics futebolístico baseada em arquitetura neural.

Sua função: receber dados de um jogador e o contexto do clube comprador, calcular os scores neurais, e emitir uma recomendação clara de decisão (CONTRATAR, BLINDAR, MONITORAR, EMPRÉSTIMO, RECUSAR, ou ALERTA_CINZA).

## METODOLOGIA

### Índice Vx (Value Index)
Mede o valor real do jogador em relação ao custo.
- Vx > 1.5 = Alto valor
- Vx 1.0-1.5 = Valor justo
- Vx < 1.0 = Valor insuficiente

### Índice Rx (Risk Index)
Mede o risco da operação considerando fatores táticos, comportamentais e financeiros.
- Rx < 0.8 = Baixo risco
- Rx 0.8-1.5 = Risco moderado
- Rx > 1.5 = Alto risco

### 7 Camadas Neurais (0-100 cada)
C1_technical, C2_tactical, C3_physical, C4_behavioral, C5_narrative, C6_economic, C7_ai

### Algoritmos Proprietários (0-100 cada)
- AST: Análise de Sinergia Tática
- CLF: Compatibilidade Linguística e Filosófica
- GNE: Grau de Necessidade Estratégica
- WSE: Weight of Systemic Embedding
- RBL: Risk-Benefit Loop
- SACE: Score de Adaptação Cultural e Emocional
- SCN_plus: Score Cortex Neural+ (composto)

### Matriz de Decisão
|           | Rx < 0.8    | Rx 0.8-1.5    | Rx > 1.5       |
|-----------|-------------|---------------|----------------|
| Vx > 1.5  | CONTRATAR   | CONTRATAR     | ALERTA_CINZA   |
| Vx 1.0-1.5| MONITORAR   | MONITORAR     | RECUSAR        |
| Vx < 1.0  | EMPRÉSTIMO  | RECUSAR       | RECUSAR        |

Se o jogador já está no elenco e tem Vx > 1.5 → BLINDAR.

## REFERÊNCIAS INTELECTUAIS
- Moneyball (análise contra-intuitiva de valor)
- Thinking Fast and Slow (vieses cognitivos em decisões de transferência)
- The Numbers Game (probabilidade no futebol)
- Sharp Sports Betting (modelagem de risco)

## FORMATO DE RESPOSTA
Responda EXCLUSIVAMENTE em JSON válido, sem texto adicional:
{
  "vx": number,
  "rx": number,
  "decision": "CONTRATAR" | "BLINDAR" | "MONITORAR" | "EMPRESTIMO" | "RECUSAR" | "ALERTA_CINZA",
  "confidence": number (0-100),
  "reasoning": "string com análise detalhada em português",
  "layers": {
    "C1_technical": number, "C2_tactical": number, "C3_physical": number,
    "C4_behavioral": number, "C5_narrative": number, "C6_economic": number, "C7_ai": number
  },
  "algorithms": {
    "AST": number, "CLF": number, "GNE": number, "WSE": number,
    "RBL": number, "SACE": number, "SCN_plus": number
  },
  "recommendedActions": ["string array com próximos passos"],
  "risks": ["string array com riscos identificados"],
  "comparables": ["transferências históricas similares para referência"]
}`

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    // RBAC check
    if (!hasPermission(session!.role, "use_agents")) {
      return new Response(JSON.stringify({ error: "Sem permissao para usar agentes IA" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Feature gate
    if (!canUseAgent(session!.tier, "ORACLE")) {
      return new Response(
        JSON.stringify({ error: "Seu plano nao inclui acesso ao agente ORACLE. Faca upgrade para continuar." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    // Rate limit
    const { success: rateLimitOk } = await checkRateLimit(aiRateLimit, `ai:${session!.userId}`)
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Limite de chamadas IA atingido. Tente novamente em 1 minuto." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await req.json()
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
    } = body

    if (!playerId || !clubContextId || !playerName || !position) {
      return new Response(
        JSON.stringify({ error: "playerId, clubContextId, playerName, and position are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!isValidUUID(playerId) || !isValidUUID(clubContextId)) {
      return new Response(
        JSON.stringify({ error: "playerId and clubContextId must be valid UUIDs" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY nao configurada." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    }

    // Build user message (same as runOracleWithPlayerData)
    const userMessage = `## JOGADOR EM ANÁLISE
- Nome: ${playerName}
- Idade: ${age ?? 25}
- Posição: ${position}
- Nacionalidade: ${nationality ?? ""}
- Clube atual: ${currentClub ?? ""}
- Valor de mercado: €${marketValue ?? 0}M
${contractEnd ? `- Contrato até: ${contractEnd}` : ""}

## CLUBE COMPRADOR
- Nome: ${targetClubName ?? ""}
- Liga: ${targetClubLeague ?? ""}

## COMPONENTES Vx
{}

## COMPONENTES Rx
{}

Analise todos os dados acima usando a metodologia CORTEX FC e emita o parecer ORACLE completo em JSON.`

    const inputContext = {
      playerId,
      clubContextId,
      playerName,
      position,
      age: age ?? 25,
      nationality: nationality ?? "",
      currentClub: currentClub ?? "",
      marketValue: marketValue ?? 0,
    }

    const startTime = Date.now()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await callAgentStreaming<OracleOutput>({
            agentType: "ORACLE",
            systemPrompt: ORACLE_SYSTEM_PROMPT,
            userMessage,
            model: "claude-sonnet-4-20250514",
            maxTokens: 4096,
            onToken: (text) => {
              controller.enqueue(
                encoder.encode(`event: token\ndata: ${JSON.stringify({ text })}\n\n`)
              )
            },
            onComplete: () => {
              // Result will be sent after parsing
            },
          })

          const durationMs = Date.now() - startTime

          // Audit log
          const agentRun = await createAgentRun({
            agentType: "ORACLE",
            inputContext,
            outputResult: result as unknown as Record<string, unknown>,
            modelUsed: "claude-sonnet-4-20250514",
            durationMs,
            success: true,
            userId: session!.userId,
            orgId: session!.orgId,
          }).catch((err) => {
            console.error("Failed to log agent run:", err)
            return null
          })

          // Emit inngest event
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
            })
          } catch (err) {
            console.error("Failed to send agent.completed event:", err)
          }

          controller.enqueue(
            encoder.encode(`event: complete\ndata: ${JSON.stringify({ result })}\n\n`)
          )
          controller.close()
        } catch (error) {
          console.error("ORACLE streaming error:", error)

          // Log failed run
          await createAgentRun({
            agentType: "ORACLE",
            inputContext: { error: "streaming request failed" },
            modelUsed: "claude-sonnet-4-20250514",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            userId: session!.userId,
            orgId: session!.orgId,
          }).catch(() => {})

          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "Erro ao executar analise neural" })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("ORACLE stream route error:", error)
    return new Response(
      JSON.stringify({ error: "Erro ao iniciar streaming" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
