/**
 * RAG Context Builder.
 *
 * Builds contextual information from the org's data
 * to enrich Claude chat conversations.
 */

import { db } from "@/db/index";
import { eq, desc, sql, count, avg } from "drizzle-orm";
import {
  players,
  neuralAnalyses,
  scoutingTargets,
  clubs,
  organizations,
} from "@/db/schema";

export interface RagContext {
  orgSummary: string;
  recentAnalyses: string;
  squadOverview: string;
  scoutingPipeline: string;
}

/**
 * Build RAG context for a chat conversation.
 * Fetches org-relevant data and formats it as natural language.
 */
export async function buildRagContext(orgId: string): Promise<RagContext> {
  const [org, recentAnalysisList, targetList, squadStats] = await Promise.all([
    getOrgSummary(orgId),
    getRecentAnalysesContext(orgId),
    getScoutingContext(orgId),
    getSquadContext(orgId),
  ]);

  return {
    orgSummary: org,
    recentAnalyses: recentAnalysisList,
    squadOverview: squadStats,
    scoutingPipeline: targetList,
  };
}

async function getOrgSummary(orgId: string): Promise<string> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });
  if (!org) return "Organizacao nao encontrada.";

  return `Organizacao: ${org.name} | Tier: ${org.tier} | Slug: ${org.slug}`;
}

async function getRecentAnalysesContext(orgId: string): Promise<string> {
  const analyses = await db.query.neuralAnalyses.findMany({
    where: sql`${neuralAnalyses.analystId} IN (
      SELECT id FROM users WHERE org_id = ${orgId}
    )`,
    with: {
      player: true,
      clubContext: true,
    },
    orderBy: [desc(neuralAnalyses.createdAt)],
    limit: 10,
  });

  if (analyses.length === 0) return "Nenhuma analise neural recente.";

  const lines = analyses.map((a) => {
    const playerName = a.player?.name ?? "Desconhecido";
    const club = a.clubContext?.name ?? "";
    return `- ${playerName} (${club}): SCN+=${a.scnPlus?.toFixed(1)}, Decisao=${a.decision}, Confianca=${a.confidence?.toFixed(0)}%, Vx=${a.vx?.toFixed(1)}, Rx=${a.rx?.toFixed(1)}`;
  });

  return `Ultimas ${analyses.length} analises neurais:\n${lines.join("\n")}`;
}

async function getScoutingContext(orgId: string): Promise<string> {
  const targets = await db
    .select({
      priority: scoutingTargets.priority,
      status: scoutingTargets.status,
      targetPrice: scoutingTargets.targetPrice,
      playerName: players.name,
      position: players.positionCluster,
      clubName: clubs.name,
    })
    .from(scoutingTargets)
    .innerJoin(players, eq(scoutingTargets.playerId, players.id))
    .leftJoin(clubs, eq(players.currentClubId, clubs.id))
    .where(eq(scoutingTargets.orgId, orgId))
    .orderBy(desc(scoutingTargets.createdAt))
    .limit(15);

  if (targets.length === 0) return "Nenhum alvo de scouting no pipeline.";

  const lines = targets.map((t) =>
    `- ${t.playerName} (${t.position}, ${t.clubName ?? "sem clube"}): Prioridade=${t.priority}, Status=${t.status}, Valor alvo=${t.targetPrice ? `€${t.targetPrice}M` : "N/D"}`
  );

  return `Pipeline de scouting (${targets.length} alvos):\n${lines.join("\n")}`;
}

async function getSquadContext(orgId: string): Promise<string> {
  // Get players that have been analyzed by this org's analysts
  const orgAnalystFilter = sql`${neuralAnalyses.analystId} IN (
    SELECT id FROM users WHERE org_id = ${orgId}
  )`;

  const [totalPlayers] = await db
    .select({ value: count() })
    .from(players);

  const positionDist = await db
    .select({
      position: players.positionCluster,
      count: count(),
      avgMarketValue: avg(players.marketValue),
    })
    .from(players)
    .groupBy(players.positionCluster);

  const [scnAvg] = await db
    .select({ avg: avg(neuralAnalyses.scnPlus) })
    .from(neuralAnalyses)
    .where(orgAnalystFilter);

  const posLines = positionDist.map(
    (p) => `  ${p.position}: ${p.count} jogadores, valor medio €${Number(p.avgMarketValue ?? 0).toFixed(1)}M`
  );

  return `Base de dados: ${totalPlayers.value} jogadores\nSCN+ medio geral: ${Number(scnAvg.avg ?? 0).toFixed(1)}\nDistribuicao por posicao:\n${posLines.join("\n")}`;
}

/**
 * Build the full system prompt for chat, including RAG context.
 */
export function buildChatSystemPrompt(rag: RagContext): string {
  return `Voce e o assistente de IA do CORTEX FC, uma plataforma de analytics neural para futebol profissional.

Voce tem acesso ao contexto da organizacao do usuario e pode responder perguntas sobre jogadores, analises, scouting, taticas, e decisoes de transferencia.

CONTEXTO DA ORGANIZACAO:
${rag.orgSummary}

DADOS DO ELENCO:
${rag.squadOverview}

ANALISES RECENTES:
${rag.recentAnalyses}

SCOUTING:
${rag.scoutingPipeline}

INSTRUCOES:
- Responda sempre em portugues (PT-BR)
- Seja direto e objetivo
- Use dados reais do contexto acima quando relevante
- Quando comparar jogadores, cite SCN+, Vx, Rx e decisao
- Para perguntas sobre tatica, considere a posicao e o perfil do jogador
- Se nao tiver dados suficientes, diga que nao ha informacao disponivel
- Nunca invente dados que nao estao no contexto
- Formate numeros com precisao (1 casa decimal para scores, 0 para percentuais)`;
}

/**
 * Generate contextual question suggestions based on org data.
 */
export function generateSuggestions(rag: RagContext): string[] {
  const suggestions: string[] = [
    "Qual o panorama geral do nosso elenco?",
    "Quais jogadores tem o melhor SCN+ nas analises recentes?",
  ];

  if (rag.scoutingPipeline.includes("alvos")) {
    suggestions.push("Resuma nosso pipeline de scouting atual");
    suggestions.push("Qual alvo de scouting tem melhor custo-beneficio?");
  }

  if (rag.recentAnalyses.includes("CONTRATAR")) {
    suggestions.push("Quais jogadores foram recomendados para contratacao?");
  }

  if (rag.recentAnalyses.includes("MONITORAR")) {
    suggestions.push("Quais jogadores estao em fase de monitoramento?");
  }

  suggestions.push("Compare os jogadores analisados recentemente");
  suggestions.push("Quais posicoes precisam de reforco no elenco?");

  return suggestions.slice(0, 6);
}
