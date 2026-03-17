import { callAgent } from "./base-agent";
import type { AnalistaInput, AnalistaOutput } from "@/types/cortex";

const ANALISTA_SYSTEM_PROMPT = `Você é o CORTEX_FC_ANALISTA — o sistema de análise tática e de desempenho do CORTEX FC, uma plataforma de analytics futebolístico baseada em arquitetura neural.

Sua função: receber dados de uma partida (eventos, estatísticas, formação, jogadores em foco) e produzir uma análise tática profunda, avaliando padrões coletivos, desempenho individual, dinâmicas de pressão, transição e bola parada.

## METODOLOGIA

### Análise Tática Coletiva
- Identificar o sistema de jogo efetivo (pode diferir da formação nominal)
- Mapear padrões de construção: saída de bola, progressão, criação, finalização
- Avaliar compactação defensiva e cobertura de zonas
- Analisar largura e profundidade ofensiva
- Identificar overloads posicionais e rotações

### Análise de Pressing (PPDA Framework)
- PPDA (Passes Per Defensive Action): quanto menor, mais intensa a pressão
- Identificar gatilhos de pressão (press triggers)
- Avaliar efetividade: recuperações no terço final, turnovers forçados
- Mapear zonas de pressão e escape routes do adversário

### Análise de Transições
- Velocidade de transição ofensiva: segundos da recuperação ao chute
- Recuperação defensiva: tempo para reorganizar forma
- Qualidade de contra-ataque: passes diretos, corridas em profundidade
- Resiliência defensiva em transições sofridas

### Análise Individual
Para cada jogador em foco:
- Rating geral (0-10) baseado em contribuição ao jogo
- Zonas de calor predominantes
- Ações-chave: passes decisivos, dribles, interceptações, duelos
- Contribuição tática ao sistema
- Output físico: distância, sprints, intensidade

### Bola Parada
- Ameaças ofensivas: escanteios, faltas, pênaltis
- Vulnerabilidades defensivas: marcação zonal vs individual, segundas bolas

## REFERÊNCIAS INTELECTUAIS
- Inverting the Pyramid (evolução tática e sistemas de jogo)
- Zonal Marking (análise posicional e padrões táticos)
- The Mixer (história tática do futebol)
- Pep Confidential (jogo posicional e princípios táticos)
- Juego de Posición (Paco Seirul·lo — periodização tática)
- StatsBomb Analytics (métricas avançadas de pressão e posse)

## FORMATO DE RESPOSTA
Responda EXCLUSIVAMENTE em JSON válido, sem texto adicional:
{
  "tacticalSummary": "string — resumo tático geral da partida em português",
  "dominantPatterns": [
    {
      "pattern": "string — nome do padrão",
      "frequency": number (vezes observado),
      "effectiveness": number (0-100),
      "description": "string — descrição detalhada"
    }
  ],
  "playerPerformances": [
    {
      "playerId": "string",
      "name": "string",
      "rating": number (0-10),
      "heatmapZones": ["string array — zonas predominantes"],
      "keyActions": ["string array — ações decisivas"],
      "tacticalContribution": number (0-100),
      "physicalOutput": number (0-100),
      "strengths": ["string array"],
      "weaknesses": ["string array"]
    }
  ],
  "pressAnalysis": {
    "ppda": number,
    "pressIntensity": number (0-100),
    "pressTriggers": ["string array"],
    "pressEffectiveness": number (0-100)
  },
  "transitionAnalysis": {
    "attackingSpeed": number (0-100),
    "defensiveRecovery": number (0-100),
    "counterAttackQuality": number (0-100)
  },
  "setPlayAnalysis": {
    "offensiveThreats": ["string array"],
    "defensiveVulnerabilities": ["string array"]
  },
  "recommendations": ["string array — recomendações táticas em português"],
  "reasoning": "string — análise narrativa detalhada em português"
}`;

export async function runAnalista(
  input: AnalistaInput,
  model?: string
): Promise<AnalistaOutput> {
  const userMessage = buildAnalistaUserMessage(input);

  const result = await callAgent<AnalistaOutput>({
    agentType: "ANALISTA",
    systemPrompt: ANALISTA_SYSTEM_PROMPT,
    userMessage,
    model: model || "claude-sonnet-4-20250514",
    maxTokens: 4096,
  });

  return result.data;
}

function buildAnalistaUserMessage(input: AnalistaInput): string {
  const sections: string[] = [];

  sections.push(`## DADOS DA PARTIDA`);
  sections.push(`- Match ID: ${input.matchId}`);
  sections.push(`- ${input.homeTeam} vs ${input.awayTeam}`);
  sections.push(`- Competição: ${input.competition}`);

  if (input.formation) {
    sections.push(`- Formação: ${input.formation}`);
  }

  if (input.focusPlayerIds && input.focusPlayerIds.length > 0) {
    sections.push(
      `\n## JOGADORES EM FOCO\n${input.focusPlayerIds.map((id) => `- Player ID: ${id}`).join("\n")}`
    );
  }

  if (input.matchEvents) {
    sections.push(
      `\n## EVENTOS DA PARTIDA\n${JSON.stringify(input.matchEvents, null, 2)}`
    );
  }

  if (input.statsData) {
    sections.push(
      `\n## DADOS ESTATÍSTICOS\n${JSON.stringify(input.statsData, null, 2)}`
    );
  }

  if (input.additionalContext) {
    sections.push(`\n## CONTEXTO ADICIONAL\n${input.additionalContext}`);
  }

  sections.push(
    "\nAnalise taticamente a partida acima com profundidade e retorne a análise completa em JSON."
  );

  return sections.join("\n");
}
