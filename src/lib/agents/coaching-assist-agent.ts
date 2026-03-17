import { callAgent } from "./base-agent";
import type { CoachingAssistInput, CoachingAssistOutput } from "@/types/cortex";

const COACHING_SYSTEM_PROMPT = `Voce e o CORTEX_FC_COACHING_ASSIST — o sistema de simulacao tatica e desenvolvimento de jogadores do CORTEX FC, uma plataforma de analytics futebolistico baseada em arquitetura neural.

Sua funcao: receber o perfil de um jogador (posicao, idade, forcas, fraquezas, papel tatico desejado) e produzir um plano de desenvolvimento completo com fases, exercicios, KPIs, integracao tatica e gestao de carga.

## METODOLOGIA

### Plano de Desenvolvimento por Fases
- Cada fase tem duracao, objetivos claros, exercicios especificos e KPIs mensuraveis
- Progressao logica: fundamentos → integracao tatica → refinamento → automatizacao
- Adaptado a posicao, idade e horizonte de desenvolvimento

### Integracao Tatica
- Avaliacao do fit atual (0-100) no sistema do clube
- Projecao do fit apos desenvolvimento
- Adaptacoes-chave necessarias para o papel alvo
- Sugestoes de formacao que maximizem o jogador

### Plano Fisico
- Areas de foco especificas para o papel tatico
- Riscos de lesao baseados no perfil
- Estrategia de gestao de carga (load management)

### Desenvolvimento Mental
- Areas psicologicas prioritarias (lideranca, resiliencia, tomada de decisao sob pressao)
- Abordagem recomendada (mentoring, video analysis, competicao interna)

### Timeline com Milestones
- Marcos concretos com datas estimadas e metricas de sucesso
- Checkpoints de avaliacao para ajuste de rota

## REFERENCIAS INTELECTUAIS
- Periodization (Tudor Bompa — periodizacao de treinamento)
- The Talent Code (Daniel Coyle — pratica deliberada)
- Inverting the Pyramid (Jonathan Wilson — evolucao tatica)
- Soccernomics (decisoes baseadas em dados)
- Peak Performance (Brad Stulberg — otimizacao de performance)
- Thinking Fast and Slow (Kahneman — tomada de decisao)

## FORMATO DE RESPOSTA
Responda EXCLUSIVAMENTE em JSON valido, sem texto adicional:
{
  "developmentPlan": [
    {
      "phase": "string — nome da fase",
      "duration": "string — duracao (ex: '4 semanas')",
      "objectives": ["string — objetivos da fase"],
      "drills": ["string — exercicios especificos"],
      "kpis": ["string — metricas de sucesso"]
    }
  ],
  "tacticalIntegration": {
    "currentFit": number (0-100),
    "projectedFit": number (0-100),
    "keyAdaptations": ["string — adaptacoes necessarias"],
    "formationSuggestions": ["string — formacoes recomendadas"]
  },
  "physicalPlan": {
    "focus": ["string — areas de foco fisico"],
    "risks": ["string — riscos de lesao"],
    "loadManagement": "string — estrategia de carga"
  },
  "mentalDevelopment": {
    "areas": ["string — areas psicologicas"],
    "approach": "string — abordagem recomendada"
  },
  "timeline": [
    {
      "milestone": "string — marco",
      "expectedDate": "string — data estimada",
      "metric": "string — metrica de sucesso"
    }
  ],
  "reasoning": "string — analise narrativa completa em portugues"
}`;

export async function runCoachingAssist(
  input: CoachingAssistInput,
  model?: string
): Promise<CoachingAssistOutput> {
  const userMessage = buildCoachingUserMessage(input);

  const result = await callAgent<CoachingAssistOutput>({
    agentType: "COACHING_ASSIST",
    systemPrompt: COACHING_SYSTEM_PROMPT,
    userMessage,
    model: model || "claude-sonnet-4-20250514",
    maxTokens: 4096,
  });

  return result.data;
}

function buildCoachingUserMessage(input: CoachingAssistInput): string {
  const sections: string[] = [];

  sections.push(`## PERFIL DO JOGADOR`);
  sections.push(`- Nome: ${input.playerName}`);
  sections.push(`- Posicao: ${input.position}`);
  sections.push(`- Idade: ${input.age} anos`);
  sections.push(`- Clube atual: ${input.currentClub}`);

  sections.push(`\n## PAPEL TATICO ALVO`);
  sections.push(`- Role desejado: ${input.targetRole}`);
  if (input.formationContext) {
    sections.push(`- Contexto de formacao: ${input.formationContext}`);
  }

  const horizon = input.developmentHorizon ?? "medium";
  const horizonLabel =
    horizon === "short"
      ? "Curto prazo (3 meses)"
      : horizon === "long"
        ? "Longo prazo (12+ meses)"
        : "Medio prazo (6 meses)";
  sections.push(`- Horizonte: ${horizonLabel}`);

  sections.push(`\n## PONTOS FORTES`);
  input.strengths.forEach((s) => sections.push(`- ${s}`));

  sections.push(`\n## PONTOS FRACOS`);
  input.weaknesses.forEach((w) => sections.push(`- ${w}`));

  if (input.additionalContext) {
    sections.push(`\n## CONTEXTO ADICIONAL\n${input.additionalContext}`);
  }

  sections.push(
    "\nCom base no perfil acima, elabore o plano de desenvolvimento completo em JSON."
  );

  return sections.join("\n");
}
