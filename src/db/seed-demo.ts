import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  organizations,
  users,
  leagues,
  clubs,
  seasons,
  players,
  neuralAnalyses,
  scoutingTargets,
} from "./schema";

// ============================================
// Deterministic UUID generator (same pattern as seed.ts)
// ============================================

function makeUuid(name: string): string {
  const hash = crypto.createHash("md5").update(name).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ============================================
// Fixed IDs
// ============================================

const ORG_ID = makeUuid("demo:org:fc-cortex");
const USER_ID = makeUuid("demo:user:demo");
const LEAGUE_ID = makeUuid("demo:league:demo-league");
const SEASON_ID = makeUuid("demo:season:2024-25");

const CLUB_IDS = {
  "FC Cortex": makeUuid("demo:club:fc-cortex"),
  "Neural United": makeUuid("demo:club:neural-united"),
  "Synapse City": makeUuid("demo:club:synapse-city"),
  "Axon Athletic": makeUuid("demo:club:axon-athletic"),
  "Dendrite FC": makeUuid("demo:club:dendrite-fc"),
} as const;

type PositionCluster = "GK" | "CB" | "FB" | "DM" | "CM" | "AM" | "W" | "ST";
type Decision =
  | "CONTRATAR"
  | "BLINDAR"
  | "MONITORAR"
  | "EMPRESTIMO"
  | "RECUSAR"
  | "ALERTA_CINZA";

// ============================================
// Demo players — fictional, realistic
// ============================================

const DEMO_PLAYERS: {
  key: string;
  name: string;
  fullName: string;
  nationality: string;
  position: PositionCluster;
  positionDetail: string;
  age: number;
  height: number;
  weight: number;
  foot: string;
  clubKey: keyof typeof CLUB_IDS;
  marketValue: number;
  salary: number;
}[] = [
  { key: "lucas-ferreira", name: "L. Ferreira", fullName: "Lucas Henrique Ferreira", nationality: "Brazil", position: "ST", positionDetail: "Centre Forward", age: 24, height: 183, weight: 78, foot: "right", clubKey: "Neural United", marketValue: 18, salary: 2.5 },
  { key: "mateo-silva", name: "M. Silva", fullName: "Mateo Augusto Silva", nationality: "Argentina", position: "AM", positionDetail: "Attacking Midfielder", age: 22, height: 175, weight: 70, foot: "left", clubKey: "Synapse City", marketValue: 12, salary: 1.8 },
  { key: "kenji-tanaka", name: "K. Tanaka", fullName: "Kenji Tanaka", nationality: "Japan", position: "CM", positionDetail: "Central Midfielder", age: 26, height: 172, weight: 68, foot: "right", clubKey: "FC Cortex", marketValue: 8, salary: 1.2 },
  { key: "omar-diallo", name: "O. Diallo", fullName: "Omar Ibrahima Diallo", nationality: "Senegal", position: "CB", positionDetail: "Centre Back", age: 23, height: 191, weight: 86, foot: "right", clubKey: "Axon Athletic", marketValue: 15, salary: 2.0 },
  { key: "erik-lindqvist", name: "E. Lindqvist", fullName: "Erik Axel Lindqvist", nationality: "Sweden", position: "GK", positionDetail: "Goalkeeper", age: 28, height: 194, weight: 88, foot: "right", clubKey: "FC Cortex", marketValue: 5, salary: 1.0 },
  { key: "rafael-mendez", name: "R. Mendez", fullName: "Rafael Antonio Mendez", nationality: "Colombia", position: "W", positionDetail: "Left Winger", age: 21, height: 176, weight: 72, foot: "right", clubKey: "Dendrite FC", marketValue: 10, salary: 1.5 },
  { key: "james-okafor", name: "J. Okafor", fullName: "James Chukwuemeka Okafor", nationality: "Nigeria", position: "DM", positionDetail: "Defensive Midfielder", age: 25, height: 185, weight: 80, foot: "right", clubKey: "Neural United", marketValue: 14, salary: 2.2 },
  { key: "thomas-weber", name: "T. Weber", fullName: "Thomas Lukas Weber", nationality: "Germany", position: "FB", positionDetail: "Right Back", age: 27, height: 180, weight: 75, foot: "right", clubKey: "Synapse City", marketValue: 9, salary: 1.6 },
  { key: "diego-rojas", name: "D. Rojas", fullName: "Diego Alejandro Rojas", nationality: "Chile", position: "ST", positionDetail: "Second Striker", age: 29, height: 179, weight: 76, foot: "left", clubKey: "Axon Athletic", marketValue: 7, salary: 1.8 },
  { key: "yusuf-kaya", name: "Y. Kaya", fullName: "Yusuf Emre Kaya", nationality: "Turkey", position: "CM", positionDetail: "Box-to-Box Midfielder", age: 23, height: 181, weight: 77, foot: "both", clubKey: "Dendrite FC", marketValue: 11, salary: 1.4 },
];

// ============================================
// Analysis decisions — show variety
// ============================================

const ANALYSIS_CONFIGS: {
  playerIdx: number;
  decision: Decision;
  confidence: number;
  vx: number;
  rx: number;
  reasoning: string;
}[] = [
  { playerIdx: 0, decision: "CONTRATAR", confidence: 92, vx: 88, rx: 15, reasoning: "Atacante completo com alta eficiencia em finalizacao. Perfil raro no mercado atual. Custo-beneficio excelente para a janela." },
  { playerIdx: 1, decision: "MONITORAR", confidence: 75, vx: 72, rx: 35, reasoning: "Talento evidente mas inconsistente em jogos decisivos. Manter sob observacao por mais 6 meses antes de investir." },
  { playerIdx: 2, decision: "BLINDAR", confidence: 88, vx: 80, rx: 12, reasoning: "Peca fundamental do meio-campo. Proponha renovacao imediata com clausula de rescisao competitiva." },
  { playerIdx: 3, decision: "CONTRATAR", confidence: 85, vx: 82, rx: 22, reasoning: "Zagueiro moderno com saida de bola excepcional. Resolve carencia critica da defesa. Janela ideal de aquisicao." },
  { playerIdx: 4, decision: "BLINDAR", confidence: 90, vx: 78, rx: 10, reasoning: "Goleiro titular com desempenho acima da media. Risco de perda para liga mais competitiva. Blindar contrato." },
  { playerIdx: 5, decision: "EMPRESTIMO", confidence: 70, vx: 65, rx: 28, reasoning: "Potencial alto mas precisa de minutos regulares. Emprestimo de 12 meses com opcao de compra seria ideal." },
  { playerIdx: 6, decision: "RECUSAR", confidence: 82, vx: 55, rx: 60, reasoning: "Apesar do nome forte, historico recente de lesoes e queda de rendimento. Risco financeiro desproporcional ao retorno." },
  { playerIdx: 7, decision: "MONITORAR", confidence: 68, vx: 70, rx: 30, reasoning: "Lateral consistente mas sem diferencial. Monitorar caso preco caia na proxima janela." },
  { playerIdx: 8, decision: "ALERTA_CINZA", confidence: 60, vx: 62, rx: 45, reasoning: "Idade avancada para o investimento pedido. Possivel declinio iminente. Dados insuficientes para decisao segura." },
  { playerIdx: 9, decision: "CONTRATAR", confidence: 87, vx: 84, rx: 18, reasoning: "Meio-campista versatil com numeros ascendentes. Clausula acessivel e perfil complementar ao elenco atual." },
];

// ============================================
// Main seed
// ============================================

async function seedDemo() {
  console.log("Inserindo dados de demonstracao (FC Cortex)...\n");

  // 1. Organization
  await db.insert(organizations).values({
    id: ORG_ID,
    name: "FC Cortex Demo",
    slug: "fc-cortex-demo",
    tier: "club_professional",
  });
  console.log("  Org: FC Cortex Demo");

  // 2. User
  const passwordHash = await bcrypt.hash("demo2025", 10);
  await db.insert(users).values({
    id: USER_ID,
    email: "demo@cortexfc.com",
    name: "Demo Analyst",
    passwordHash,
    orgId: ORG_ID,
    role: "admin",
  });
  console.log("  User: demo@cortexfc.com / demo2025");

  // 3. League
  await db.insert(leagues).values({
    id: LEAGUE_ID,
    name: "Demo League",
    country: "International",
    tier: 1,
  });
  console.log("  League: Demo League");

  // 4. Clubs
  const clubRows = Object.entries(CLUB_IDS).map(([name, id]) => ({
    id,
    name,
    shortName: name.split(" ")[0],
    country: "International",
    leagueId: LEAGUE_ID,
  }));
  await db.insert(clubs).values(clubRows);
  console.log(`  Clubs: ${clubRows.length}`);

  // 5. Season
  await db.insert(seasons).values({
    id: SEASON_ID,
    name: "2024/25",
    startDate: new Date("2024-08-01"),
    endDate: new Date("2025-05-31"),
    leagueId: LEAGUE_ID,
  });
  console.log("  Season: 2024/25");

  // 6. Players
  const playerRows = DEMO_PLAYERS.map((p) => ({
    id: makeUuid(`demo:player:${p.key}`),
    name: p.name,
    fullName: p.fullName,
    nationality: p.nationality,
    positionCluster: p.position,
    positionDetail: p.positionDetail,
    age: p.age,
    height: p.height,
    weight: p.weight,
    preferredFoot: p.foot,
    currentClubId: CLUB_IDS[p.clubKey],
    marketValue: p.marketValue,
    salary: p.salary,
    dateOfBirth: new Date(2025 - p.age, 5, 15),
    contractUntil: new Date(2027, 5, 30),
  }));
  await db.insert(players).values(playerRows);
  console.log(`  Players: ${playerRows.length}`);

  // 7. Neural Analyses
  const analysisRows = ANALYSIS_CONFIGS.map((a, i) => {
    const player = DEMO_PLAYERS[a.playerIdx];
    return {
      id: makeUuid(`demo:analysis:${i}`),
      playerId: makeUuid(`demo:player:${player.key}`),
      clubContextId: CLUB_IDS["FC Cortex"],
      seasonId: SEASON_ID,
      vx: a.vx,
      rx: a.rx,
      vxComponents: { technical: a.vx * 0.3, tactical: a.vx * 0.25, physical: a.vx * 0.2, narrative: a.vx * 0.15, economic: a.vx * 0.1 },
      rxComponents: { injury: a.rx * 0.3, behavioral: a.rx * 0.2, financial: a.rx * 0.25, adaptation: a.rx * 0.15, legal: a.rx * 0.1 },
      c1Technical: 60 + Math.round(a.vx * 0.35),
      c2Tactical: 55 + Math.round(a.vx * 0.3),
      c3Physical: 58 + Math.round(a.vx * 0.25),
      c4Behavioral: 70 + Math.round((100 - a.rx) * 0.2),
      c5Narrative: 50 + Math.round(a.confidence * 0.3),
      c6Economic: 60 + Math.round((100 - a.rx) * 0.25),
      c7Ai: a.confidence * 0.9,
      decision: a.decision,
      confidence: a.confidence,
      reasoning: a.reasoning,
      recommendedActions: ["Revisar contrato atual", "Agendar avaliacao medica"],
      risks: ["Adaptacao cultural", "Pressao midiática"],
      comparables: ["Jogador similar A", "Jogador similar B"],
      analystId: USER_ID,
      isPublished: true,
    };
  });
  await db.insert(neuralAnalyses).values(analysisRows);
  console.log(`  Analyses: ${analysisRows.length}`);

  // 8. Scouting Targets (5 players)
  const scoutingRows = DEMO_PLAYERS.slice(0, 5).map((p, i) => ({
    id: makeUuid(`demo:scouting:${i}`),
    playerId: makeUuid(`demo:player:${p.key}`),
    orgId: ORG_ID,
    priority: (["high", "high", "medium", "medium", "low"] as const)[i],
    status: (["watching", "contacted", "negotiating", "watching", "watching"] as const)[i],
    notes: `Alvo de scouting para a janela 2025. Perfil ${p.positionDetail}.`,
    targetPrice: p.marketValue * 0.9,
    analysisId: makeUuid(`demo:analysis:${i}`),
    addedBy: USER_ID,
  }));
  await db.insert(scoutingTargets).values(scoutingRows);
  console.log(`  Scouting targets: ${scoutingRows.length}`);

  console.log("\nSeed de demonstracao completo.");
  console.log("Login: demo@cortexfc.com / demo2025");
}

seedDemo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed demo falhou:", err);
    process.exit(1);
  });
