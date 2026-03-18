/**
 * Report Templates Registry (Sprint 8.1)
 *
 * Defines the available report template types,
 * their sections, and configuration.
 */

export interface ReportSection {
  id: string
  label: string
  description?: string
  required?: boolean
}

export interface ReportTemplateConfig {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
  sections: ReportSection[]
  defaultTitle: string
  supportsBatch: boolean
  maxAnalyses: number
}

export const REPORT_TEMPLATES: Record<string, ReportTemplateConfig> = {
  player_report: {
    id: "player_report",
    name: "Relatorio Individual",
    description: "Analise detalhada de um jogador com VxRx, radar neural e parecer",
    icon: "User",
    sections: [
      { id: "header", label: "Cabecalho", description: "Info basica do jogador", required: true },
      { id: "vxrx", label: "Scores VxRx", description: "Componentes de valor e risco", required: true },
      { id: "radar", label: "Radar Neural", description: "Visualizacao 7 camadas" },
      { id: "algorithms", label: "Algoritmos", description: "AST, CLF, GNE, WSE, RBL, SACE, SCN+" },
      { id: "risks", label: "Riscos", description: "Riscos identificados" },
      { id: "actions", label: "Acoes Recomendadas", description: "Proximos passos" },
      { id: "parecer", label: "Parecer Completo", description: "Texto de analise" },
    ],
    defaultTitle: "Relatorio — {playerName}",
    supportsBatch: false,
    maxAnalyses: 1,
  },
  squad_analysis: {
    id: "squad_analysis",
    name: "Analise de Elenco",
    description: "Visao consolidada de multiplos jogadores com ranking",
    icon: "Users",
    sections: [
      { id: "header", label: "Cabecalho", description: "Titulo e organizacao", required: true },
      { id: "summary_table", label: "Tabela Resumo", description: "Ranking por SCN+", required: true },
      { id: "decision_breakdown", label: "Distribuicao de Decisoes", description: "Contagem por tipo" },
      { id: "top_prospects", label: "Destaques", description: "Top 5 jogadores" },
    ],
    defaultTitle: "Analise de Elenco — {date}",
    supportsBatch: true,
    maxAnalyses: 100,
  },
  scouting_report: {
    id: "scouting_report",
    name: "Relatorio de Scouting",
    description: "Pipeline de scouting com status e recomendacoes",
    icon: "Search",
    sections: [
      { id: "header", label: "Cabecalho", required: true },
      { id: "summary_table", label: "Tabela de Alvos", required: true },
      { id: "priority_ranking", label: "Ranking de Prioridade" },
    ],
    defaultTitle: "Scouting Report — {date}",
    supportsBatch: true,
    maxAnalyses: 50,
  },
  weekly_newsletter: {
    id: "weekly_newsletter",
    name: "Newsletter Semanal",
    description: "Resumo semanal com novas analises e destaques",
    icon: "Newspaper",
    sections: [
      { id: "header", label: "Cabecalho", required: true },
      { id: "highlights", label: "Destaques da Semana", required: true },
      { id: "new_analyses", label: "Novas Analises" },
      { id: "upcoming", label: "Proximos Passos" },
    ],
    defaultTitle: "Newsletter — Semana {weekNumber}",
    supportsBatch: true,
    maxAnalyses: 20,
  },
  comparison_report: {
    id: "comparison_report",
    name: "Comparativo",
    description: "Comparacao lado a lado de 2-5 jogadores",
    icon: "GitCompare",
    sections: [
      { id: "header", label: "Cabecalho", required: true },
      { id: "comparison_table", label: "Tabela Comparativa", required: true },
      { id: "radar_overlay", label: "Radar Sobreposto" },
      { id: "recommendation", label: "Recomendacao Final" },
    ],
    defaultTitle: "Comparativo — {playerNames}",
    supportsBatch: false,
    maxAnalyses: 5,
  },
}

export function getTemplate(id: string): ReportTemplateConfig | undefined {
  return REPORT_TEMPLATES[id]
}

export function getTemplateList(): ReportTemplateConfig[] {
  return Object.values(REPORT_TEMPLATES)
}
