import { callAgent } from "./base-agent";
import type { OracleInput, OracleOutput, NeuralLayers } from "@/types/cortex";

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
}`;

export async function runOracle(input: OracleInput): Promise<OracleOutput> {
  const userMessage = buildOracleUserMessage(input);

  const result = await callAgent<OracleOutput>({
    agentType: "ORACLE",
    systemPrompt: ORACLE_SYSTEM_PROMPT,
    userMessage,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
  });

  return result.data;
}

function buildOracleUserMessage(input: OracleInput): string {
  const sections: string[] = [];

  sections.push(`## JOGADOR EM ANÁLISE\nPlayer ID: ${input.playerId}`);
  sections.push(`## CLUBE COMPRADOR\nClub Context ID: ${input.clubContextId}`);

  if (input.vxComponents) {
    sections.push(
      `## COMPONENTES Vx (fornecidos)\n${JSON.stringify(input.vxComponents, null, 2)}`
    );
  }

  if (input.rxComponents) {
    sections.push(
      `## COMPONENTES Rx (fornecidos)\n${JSON.stringify(input.rxComponents, null, 2)}`
    );
  }

  if (input.additionalContext) {
    sections.push(`## CONTEXTO ADICIONAL\n${input.additionalContext}`);
  }

  sections.push(
    "\nAnalise os dados acima e emita o parecer ORACLE completo em JSON."
  );

  return sections.join("\n\n");
}

/**
 * Run Oracle with full player data (richer context)
 */
export async function runOracleWithPlayerData(
  input: OracleInput & {
    playerName: string;
    playerAge: number;
    position: string;
    nationality: string;
    currentClub: string;
    marketValue: number;
    contractUntil?: string;
    seasonStats?: Record<string, unknown>;
    buyingClubName: string;
    buyingClubLeague: string;
    buyingClubBudget?: number;
    squadContext?: string;
  }
): Promise<OracleOutput> {
  const userMessage = `## JOGADOR EM ANÁLISE
- Nome: ${input.playerName}
- Idade: ${input.playerAge}
- Posição: ${input.position}
- Nacionalidade: ${input.nationality}
- Clube atual: ${input.currentClub}
- Valor de mercado: €${input.marketValue}M
${input.contractUntil ? `- Contrato até: ${input.contractUntil}` : ""}
${input.seasonStats ? `- Stats da temporada: ${JSON.stringify(input.seasonStats)}` : ""}

## CLUBE COMPRADOR
- Nome: ${input.buyingClubName}
- Liga: ${input.buyingClubLeague}
${input.buyingClubBudget ? `- Budget disponível: €${input.buyingClubBudget}M` : ""}
${input.squadContext ? `- Contexto do elenco: ${input.squadContext}` : ""}

## COMPONENTES Vx
${JSON.stringify(input.vxComponents || {}, null, 2)}

## COMPONENTES Rx
${JSON.stringify(input.rxComponents || {}, null, 2)}

${input.additionalContext ? `## CONTEXTO ADICIONAL\n${input.additionalContext}` : ""}

Analise todos os dados acima usando a metodologia CORTEX FC e emita o parecer ORACLE completo em JSON.`;

  const result = await callAgent<OracleOutput>({
    agentType: "ORACLE",
    systemPrompt: ORACLE_SYSTEM_PROMPT,
    userMessage,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
  });

  return result.data;
}
