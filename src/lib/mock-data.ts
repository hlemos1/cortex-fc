import type {
  CortexDecision,
  NeuralAnalysis,
  VxComponents,
  RxComponents,
  NeuralLayers,
  AlgorithmScores,
} from "@/types/cortex"

// ============================================
// MOCK PLAYERS
// ============================================
export interface MockPlayer {
  id: string
  name: string
  age: number
  nationality: string
  position: string
  positionCluster: string
  club: string
  marketValue: number // millions EUR
  salary: number // millions EUR/year
  contractEnd: string
  photoUrl?: string
}

export const mockPlayers: MockPlayer[] = [
  { id: "p1", name: "Morgan Gibbs-White", age: 25, nationality: "Inglaterra", position: "Meia Ofensivo", positionCluster: "AM", club: "Nottingham Forest", marketValue: 45, salary: 4.8, contractEnd: "2028-06-30" },
  { id: "p2", name: "Chris Wood", age: 34, nationality: "Nova Zelândia", position: "Centroavante", positionCluster: "ST", club: "Nottingham Forest", marketValue: 12, salary: 3.2, contractEnd: "2026-06-30" },
  { id: "p3", name: "Callum Hudson-Odoi", age: 25, nationality: "Inglaterra", position: "Ponta Direita", positionCluster: "W", club: "Nottingham Forest", marketValue: 30, salary: 4.0, contractEnd: "2027-06-30" },
  { id: "p4", name: "Anthony Elanga", age: 23, nationality: "Suécia", position: "Ponta Esquerda", positionCluster: "W", club: "Nottingham Forest", marketValue: 25, salary: 3.5, contractEnd: "2028-06-30" },
  { id: "p5", name: "Murillo", age: 23, nationality: "Brasil", position: "Zagueiro", positionCluster: "CB", club: "Nottingham Forest", marketValue: 40, salary: 3.8, contractEnd: "2029-06-30" },
  { id: "p6", name: "Nikola Milenković", age: 27, nationality: "Sérvia", position: "Zagueiro", positionCluster: "CB", club: "Nottingham Forest", marketValue: 18, salary: 3.0, contractEnd: "2027-06-30" },
  { id: "p7", name: "Neco Williams", age: 24, nationality: "País de Gales", position: "Lateral Direito", positionCluster: "FB", club: "Nottingham Forest", marketValue: 22, salary: 3.2, contractEnd: "2027-06-30" },
  { id: "p8", name: "Ryan Yates", age: 27, nationality: "Inglaterra", position: "Volante", positionCluster: "DM", club: "Nottingham Forest", marketValue: 15, salary: 2.8, contractEnd: "2028-06-30" },
  { id: "p9", name: "Matz Sels", age: 28, nationality: "Bélgica", position: "Goleiro", positionCluster: "GK", club: "Nottingham Forest", marketValue: 20, salary: 3.0, contractEnd: "2029-06-30" },
  { id: "p10", name: "Bukayo Saka", age: 24, nationality: "Inglaterra", position: "Ponta Direita", positionCluster: "W", club: "Arsenal", marketValue: 140, salary: 12.0, contractEnd: "2029-06-30" },
  { id: "p11", name: "Cole Palmer", age: 23, nationality: "Inglaterra", position: "Meia Ofensivo", positionCluster: "AM", club: "Chelsea", marketValue: 130, salary: 10.0, contractEnd: "2033-06-30" },
  { id: "p12", name: "Bruno Fernandes", age: 31, nationality: "Portugal", position: "Meia Central", positionCluster: "CM", club: "Manchester United", marketValue: 55, salary: 14.0, contractEnd: "2027-06-30" },
  { id: "p13", name: "Mohamed Salah", age: 33, nationality: "Egito", position: "Ponta Direita", positionCluster: "W", club: "Liverpool", marketValue: 50, salary: 18.0, contractEnd: "2026-06-30" },
  { id: "p14", name: "Erling Haaland", age: 25, nationality: "Noruega", position: "Centroavante", positionCluster: "ST", club: "Manchester City", marketValue: 180, salary: 20.0, contractEnd: "2034-06-30" },
  { id: "p15", name: "Ola Aina", age: 28, nationality: "Nigéria", position: "Lateral Esquerdo", positionCluster: "FB", club: "Nottingham Forest", marketValue: 12, salary: 2.5, contractEnd: "2027-06-30" },
  { id: "p16", name: "Ibrahim Sangaré", age: 27, nationality: "Costa do Marfim", position: "Volante", positionCluster: "DM", club: "Nottingham Forest", marketValue: 20, salary: 3.5, contractEnd: "2028-06-30" },
]

// ============================================
// MOCK ANALYSES
// ============================================
export interface MockAnalysis {
  id: string
  player: MockPlayer
  date: string
  vx: number
  rx: number
  vxComponents: VxComponents
  rxComponents: RxComponents
  layers: NeuralLayers
  algorithms: AlgorithmScores
  decision: CortexDecision
  confidence: number
  reasoning: string
}

function makeAnalysis(
  id: string,
  player: MockPlayer,
  date: string,
  vx: number,
  rx: number,
  decision: CortexDecision,
  confidence: number,
  reasoning: string,
  layerOverrides?: Partial<NeuralLayers>
): MockAnalysis {
  const layers: NeuralLayers = {
    C1_technical: layerOverrides?.C1_technical ?? Math.round(50 + vx * 20 + Math.random() * 15),
    C2_tactical: layerOverrides?.C2_tactical ?? Math.round(45 + vx * 18 + Math.random() * 15),
    C3_physical: layerOverrides?.C3_physical ?? Math.round(55 + Math.random() * 30),
    C4_behavioral: layerOverrides?.C4_behavioral ?? Math.round(50 + Math.random() * 35),
    C5_narrative: layerOverrides?.C5_narrative ?? Math.round(40 + Math.random() * 40),
    C6_economic: layerOverrides?.C6_economic ?? Math.round(45 + (2 - rx) * 15 + Math.random() * 15),
    C7_ai: layerOverrides?.C7_ai ?? Math.round(50 + vx * 15 - rx * 10 + Math.random() * 10),
  }

  // Clamp all layers to 0-100
  for (const key of Object.keys(layers) as (keyof NeuralLayers)[]) {
    layers[key] = Math.min(100, Math.max(0, layers[key]))
  }

  const avgLayer = Object.values(layers).reduce((a, b) => a + b, 0) / 7
  const algorithms: AlgorithmScores = {
    AST: Math.min(100, Math.round(avgLayer * 0.9 + Math.random() * 15)),
    CLF: Math.min(100, Math.round(avgLayer * 0.85 + Math.random() * 18)),
    GNE: Math.min(100, Math.round(avgLayer * 0.95 + Math.random() * 10)),
    WSE: Math.min(100, Math.round(avgLayer * 0.88 + Math.random() * 14)),
    RBL: Math.min(100, Math.round(avgLayer * 0.92 + Math.random() * 12)),
    SACE: Math.min(100, Math.round(avgLayer * 0.87 + Math.random() * 16)),
    SCN_plus: Math.min(100, Math.round(avgLayer * 0.93 + Math.random() * 8)),
  }

  return {
    id,
    player,
    date,
    vx,
    rx,
    vxComponents: {
      technical: Math.round(vx * 4 + Math.random() * 2),
      marketImpact: Math.round(vx * 3 + Math.random() * 3),
      culturalAdaptation: Math.round(5 + Math.random() * 4),
      networkingBenefit: Math.round(4 + Math.random() * 4),
      ageDepreciation: Math.round(10 - player.age / 4),
      liabilities: Math.round(rx * 3 + Math.random() * 2),
      regulatoryRisk: Math.round(rx * 2 + Math.random() * 2),
      totalCost: player.marketValue,
    },
    rxComponents: {
      tacticalGap: Math.round(3 + Math.random() * 5),
      contextualFit: Math.round(4 + Math.random() * 5),
      experienceProfile: Math.round(3 + Math.random() * 6),
      narrativeIndex: Math.round(3 + Math.random() * 5),
      mentalFortitude: Math.round(4 + Math.random() * 5),
      injuryMicroRisk: Math.round(rx * 2.5 + Math.random() * 2),
      suspensionRisk: Math.round(1 + Math.random() * 3),
      valueAtRisk: Math.round(player.marketValue * rx * 0.3),
      marketJitter: Math.round(2 + Math.random() * 4),
    },
    layers,
    algorithms,
    decision,
    confidence,
    reasoning,
  }
}

const p = (id: string) => mockPlayers.find((p) => p.id === id)!

export const mockAnalyses: MockAnalysis[] = [
  makeAnalysis("a1", p("p1"), "2026-03-08", 1.72, 0.65, "BLINDAR", 92, "Morgan Gibbs-White é peça central no sistema do Forest. Excelente visão de jogo, capacidade de finalização e liderança tática. O custo de substituição supera amplamente o investimento na blindagem contratual. Recomenda-se extensão imediata com cláusula de rescisão competitiva.", { C1_technical: 88, C2_tactical: 85, C7_ai: 90 }),
  makeAnalysis("a2", p("p2"), "2026-03-07", 1.45, 0.92, "MONITORAR", 78, "Chris Wood apresenta excelente eficiência de finalização, mas o fator idade-depreciação é preocupante para investimento de longo prazo. Performance atual justifica a permanência, porém deve-se monitorar curva de declínio e iniciar planejamento de sucessão.", { C1_technical: 72, C3_physical: 62, C6_economic: 70 }),
  makeAnalysis("a3", p("p5"), "2026-03-06", 1.85, 0.48, "BLINDAR", 96, "Murillo é o ativo mais valioso do elenco atual. Jovem, com potencial de valorização exponencial e adaptação cultural perfeita. Risco de perda para clube de elite é ALTO. Prioridade máxima para blindagem contratual.", { C1_technical: 82, C2_tactical: 78, C4_behavioral: 88, C7_ai: 92 }),
  makeAnalysis("a4", p("p10"), "2026-03-05", 1.95, 1.35, "MONITORAR", 65, "Bukayo Saka é um dos melhores jogadores da Premier League. O valor técnico é inquestionável, mas o custo de aquisição torna a operação inviável no momento. Monitorar situação contratual para janela futura.", { C1_technical: 95, C2_tactical: 90, C6_economic: 42 }),
  makeAnalysis("a5", p("p11"), "2026-03-04", 2.10, 1.48, "MONITORAR", 60, "Cole Palmer tem potencial geracional, mas contrato longo com o Chelsea elimina viabilidade de aquisição. Score técnico excepcional, risco financeiro proibitivo.", { C1_technical: 96, C2_tactical: 88, C6_economic: 35, C7_ai: 78 }),
  makeAnalysis("a6", p("p13"), "2026-03-03", 1.60, 1.25, "RECUSAR", 84, "Mohamed Salah, apesar da qualidade técnica inquestionável, apresenta perfil de risco elevado: idade avançada, salário incompatível com a estrutura do clube e curva de depreciação acentuada. A relação custo-benefício não justifica a operação.", { C1_technical: 90, C3_physical: 55, C6_economic: 30 }),
  makeAnalysis("a7", p("p14"), "2026-03-02", 2.30, 1.80, "RECUSAR", 88, "Erling Haaland é o melhor centroavante do mundo, mas a operação é financeiramente impossível para o Forest. Custo total projetado excede 400M EUR. Classificação RECUSAR refere-se exclusivamente à viabilidade financeira.", { C1_technical: 98, C6_economic: 15, C7_ai: 65 }),
  makeAnalysis("a8", p("p3"), "2026-03-01", 1.55, 0.58, "BLINDAR", 89, "Callum Hudson-Odoi mostrou evolução consistente desde a chegada ao Forest. Perfil técnico ideal para o sistema Nuno. Risco de assédio de clubes da Big Six é real. Recomenda-se blindagem preventiva.", { C1_technical: 80, C2_tactical: 82, C4_behavioral: 85 }),
  makeAnalysis("a9", p("p4"), "2026-02-28", 1.48, 0.62, "BLINDAR", 85, "Anthony Elanga apresenta excelente relação custo-benefício e margem de valorização significativa. Jovem, rápido e adaptado ao sistema. Contrato atual é favorável ao clube."),
  makeAnalysis("a10", p("p12"), "2026-02-25", 1.40, 1.10, "ALERTA_CINZA", 55, "Bruno Fernandes apresenta sinais mistos. Qualidade técnica ainda de elite, mas queda de performance recente e situação contratual instável no United. Pode ser oportunidade ou armadilha. Necessita investigação aprofundada.", { C1_technical: 85, C4_behavioral: 60, C5_narrative: 52 }),
  makeAnalysis("a11", p("p8"), "2026-02-20", 1.15, 0.72, "MONITORAR", 70, "Ryan Yates é jogador funcional e importante para o equilíbrio do elenco. Não é titular indiscutível, mas seu comprometimento e conhecimento do clube têm valor intangível. Manter e avaliar evolução."),
  makeAnalysis("a12", p("p16"), "2026-02-18", 1.30, 0.55, "BLINDAR", 80, "Ibrahim Sangaré recuperou forma física e demonstra qualidade de passe e interceptação acima da média. Presença importante no meio-campo. Recomendar extensão contratual."),
  makeAnalysis("a13", p("p15"), "2026-02-15", 1.20, 0.68, "MONITORAR", 72, "Ola Aina é lateral versátil com boa consistência. Performance estável, sem grandes picos ou vales. Adequado para o elenco atual, sem necessidade de ação imediata."),
  makeAnalysis("a14", p("p6"), "2026-02-10", 1.10, 0.80, "MONITORAR", 68, "Nikola Milenković é zagueiro experiente e confiável. Complementa bem Murillo. Sem urgência de ação, mas monitorar mercado para eventual upgrade."),
  makeAnalysis("a15", p("p7"), "2026-02-08", 1.35, 0.60, "BLINDAR", 82, "Neco Williams tem potencial de crescimento e é peça tática importante na construção ofensiva. Lateral moderno com boa capacidade de cruzamento. Proteger ativo."),
  makeAnalysis("a16", p("p9"), "2026-02-05", 1.50, 0.45, "BLINDAR", 90, "Matz Sels teve temporada excepcional. É um dos goleiros mais consistentes da Premier League. Ativo de alto valor com contrato longo — situação ideal. Manter blindagem."),
]

// ============================================
// MOCK ALERTS
// ============================================
export interface MockAlert {
  id: string
  type: "contract" | "scouting" | "performance" | "transfer"
  severity: "high" | "medium" | "low"
  title: string
  description: string
  date: string
  playerName?: string
}

export const mockAlerts: MockAlert[] = [
  { id: "al1", type: "contract", severity: "high", title: "Contrato Expirando — Chris Wood", description: "Contrato encerra em Jun/2026. Decisão necessária: renovar ou vender na janela atual.", date: "2026-03-10", playerName: "Chris Wood" },
  { id: "al2", type: "contract", severity: "high", title: "Contrato Expirando — Mohamed Salah", description: "Salah pode ficar livre. Monitorar possível oportunidade a custo zero.", date: "2026-03-10", playerName: "Mohamed Salah" },
  { id: "al3", type: "scouting", severity: "medium", title: "Alvo Identificado — Meio-campista", description: "3 alvos de scouting na posição de meio-campista criativo identificados na Bundesliga.", date: "2026-03-09" },
  { id: "al4", type: "performance", severity: "medium", title: "Queda de Performance — Bruno Fernandes", description: "ALERTA_CINZA emitido. Score SCN+ caiu 12 pontos nos últimos 3 meses.", date: "2026-03-08", playerName: "Bruno Fernandes" },
  { id: "al5", type: "transfer", severity: "high", title: "Risco de Perda — Murillo", description: "Interesse reportado de Real Madrid e Manchester City. Blindagem contratual URGENTE.", date: "2026-03-07", playerName: "Murillo" },
  { id: "al6", type: "scouting", severity: "low", title: "Relatório Scouting Concluído", description: "Relatório de scouting para laterais da Ligue 1 finalizado. 5 candidatos avaliados.", date: "2026-03-06" },
]

// ============================================
// DASHBOARD STATS
// ============================================
export const dashboardStats = {
  totalPlayers: mockPlayers.length,
  totalAnalyses: mockAnalyses.length,
  scoutingTargets: 8,
  averageSCN: Math.round(
    mockAnalyses.reduce((sum, a) => sum + a.algorithms.SCN_plus, 0) / mockAnalyses.length
  ),
}

// ============================================
// Helper: get player's latest analysis
// ============================================
export function getLatestAnalysis(playerId: string): MockAnalysis | undefined {
  return mockAnalyses
    .filter((a) => a.player.id === playerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}

// ============================================
// Helper: decision color mapping
// ============================================
export function getDecisionColor(decision: CortexDecision) {
  switch (decision) {
    case "CONTRATAR": return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", fill: "#10b981" }
    case "BLINDAR": return { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", fill: "#3b82f6" }
    case "MONITORAR": return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", fill: "#f59e0b" }
    case "EMPRESTIMO": return { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", fill: "#a855f7" }
    case "RECUSAR": return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", fill: "#ef4444" }
    case "ALERTA_CINZA": return { bg: "bg-zinc-500/20", text: "text-zinc-400", border: "border-zinc-500/30", fill: "#71717a" }
  }
}
