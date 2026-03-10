import { db } from "./index";
import {
  organizations,
  users,
  leagues,
  clubs,
  seasons,
  players,
  neuralAnalyses,
} from "./schema";
import { mockPlayers, mockAnalyses } from "../lib/mock-data";

// ============================================
// Fixed UUIDs for deterministic seeding
// ============================================

const ORG_ID = "a0000000-0000-4000-8000-000000000001";
const USER_ID = "b0000000-0000-4000-8000-000000000001";
const LEAGUE_ID = "c0000000-0000-4000-8000-000000000001";
const SEASON_ID = "d0000000-0000-4000-8000-000000000001";

// Club UUIDs mapped by name
const CLUB_IDS: Record<string, string> = {
  "Nottingham Forest": "e0000000-0000-4000-8000-000000000001",
  "Arsenal": "e0000000-0000-4000-8000-000000000002",
  "Chelsea": "e0000000-0000-4000-8000-000000000003",
  "Manchester United": "e0000000-0000-4000-8000-000000000004",
  "Liverpool": "e0000000-0000-4000-8000-000000000005",
  "Manchester City": "e0000000-0000-4000-8000-000000000006",
};

// Player UUIDs mapped by mock ID
const PLAYER_IDS: Record<string, string> = {
  p1: "f0000000-0000-4000-8000-000000000001",
  p2: "f0000000-0000-4000-8000-000000000002",
  p3: "f0000000-0000-4000-8000-000000000003",
  p4: "f0000000-0000-4000-8000-000000000004",
  p5: "f0000000-0000-4000-8000-000000000005",
  p6: "f0000000-0000-4000-8000-000000000006",
  p7: "f0000000-0000-4000-8000-000000000007",
  p8: "f0000000-0000-4000-8000-000000000008",
  p9: "f0000000-0000-4000-8000-000000000009",
  p10: "f0000000-0000-4000-8000-000000000010",
  p11: "f0000000-0000-4000-8000-000000000011",
  p12: "f0000000-0000-4000-8000-000000000012",
  p13: "f0000000-0000-4000-8000-000000000013",
  p14: "f0000000-0000-4000-8000-000000000014",
  p15: "f0000000-0000-4000-8000-000000000015",
  p16: "f0000000-0000-4000-8000-000000000016",
};

// Analysis UUIDs mapped by mock ID
const ANALYSIS_IDS: Record<string, string> = {
  a1: "aa000000-0000-4000-8000-000000000001",
  a2: "aa000000-0000-4000-8000-000000000002",
  a3: "aa000000-0000-4000-8000-000000000003",
  a4: "aa000000-0000-4000-8000-000000000004",
  a5: "aa000000-0000-4000-8000-000000000005",
  a6: "aa000000-0000-4000-8000-000000000006",
  a7: "aa000000-0000-4000-8000-000000000007",
  a8: "aa000000-0000-4000-8000-000000000008",
  a9: "aa000000-0000-4000-8000-000000000009",
  a10: "aa000000-0000-4000-8000-000000000010",
  a11: "aa000000-0000-4000-8000-000000000011",
  a12: "aa000000-0000-4000-8000-000000000012",
  a13: "aa000000-0000-4000-8000-000000000013",
  a14: "aa000000-0000-4000-8000-000000000014",
  a15: "aa000000-0000-4000-8000-000000000015",
  a16: "aa000000-0000-4000-8000-000000000016",
};

// Map position cluster strings to the enum values
type PositionCluster = "GK" | "CB" | "FB" | "DM" | "CM" | "AM" | "W" | "ST";

async function seed() {
  console.log("🌱 Seeding Cortex FC database...\n");

  // 1. Organization
  console.log("  → Creating organization...");
  await db.insert(organizations).values({
    id: ORG_ID,
    name: "Nottingham Forest FC",
    slug: "nottingham-forest-fc",
    tier: "club_professional",
  });

  // 2. Default user
  console.log("  → Creating default user...");
  await db.insert(users).values({
    id: USER_ID,
    email: "analyst@cortexfc.com",
    name: "Cortex Analyst",
    passwordHash: "$2b$10$placeholder_hash_for_seed_data_only",
    orgId: ORG_ID,
    role: "admin",
  });

  // 3. League
  console.log("  → Creating league...");
  await db.insert(leagues).values({
    id: LEAGUE_ID,
    name: "Premier League",
    country: "England",
    tier: 1,
  });

  // 4. Clubs
  console.log("  → Creating 6 clubs...");
  const clubEntries = Object.entries(CLUB_IDS).map(([name, id]) => ({
    id,
    name,
    shortName: name === "Manchester United" ? "Man Utd" : name === "Manchester City" ? "Man City" : name === "Nottingham Forest" ? "NFFC" : name,
    country: "England",
    leagueId: LEAGUE_ID,
  }));
  await db.insert(clubs).values(clubEntries);

  // 5. Season
  console.log("  → Creating season 2025/26...");
  await db.insert(seasons).values({
    id: SEASON_ID,
    name: "2025/26",
    startDate: new Date("2025-08-09"),
    endDate: new Date("2026-05-24"),
    leagueId: LEAGUE_ID,
  });

  // 6. Players
  console.log("  → Creating 16 players...");
  const playerEntries = mockPlayers.map((p) => ({
    id: PLAYER_IDS[p.id],
    name: p.name,
    nationality: p.nationality,
    age: p.age,
    positionCluster: p.positionCluster as PositionCluster,
    positionDetail: p.position,
    currentClubId: CLUB_IDS[p.club],
    marketValue: p.marketValue,
    salary: p.salary,
    contractUntil: new Date(p.contractEnd),
  }));
  await db.insert(players).values(playerEntries);

  // 7. Neural Analyses
  console.log("  → Creating 16 neural analyses...");
  const analysisEntries = mockAnalyses.map((a) => ({
    id: ANALYSIS_IDS[a.id],
    playerId: PLAYER_IDS[a.player.id],
    clubContextId: CLUB_IDS["Nottingham Forest"], // All analyses from Forest's perspective
    seasonId: SEASON_ID,

    vx: a.vx,
    rx: a.rx,
    vxComponents: a.vxComponents,
    rxComponents: a.rxComponents,

    c1Technical: a.layers.C1_technical,
    c2Tactical: a.layers.C2_tactical,
    c3Physical: a.layers.C3_physical,
    c4Behavioral: a.layers.C4_behavioral,
    c5Narrative: a.layers.C5_narrative,
    c6Economic: a.layers.C6_economic,
    c7Ai: a.layers.C7_ai,

    ast: a.algorithms.AST,
    clf: a.algorithms.CLF,
    gne: a.algorithms.GNE,
    wse: a.algorithms.WSE,
    rbl: a.algorithms.RBL,
    sace: a.algorithms.SACE,
    scnPlus: a.algorithms.SCN_plus,

    decision: a.decision,
    confidence: a.confidence,
    reasoning: a.reasoning,
    recommendedActions: [] as string[],
    risks: [] as string[],
    comparables: [] as string[],

    analystId: USER_ID,
    isPublished: true,
    createdAt: new Date(a.date),
    updatedAt: new Date(a.date),
  }));
  await db.insert(neuralAnalyses).values(analysisEntries);

  console.log("\n✅ Seed complete!");
  console.log(`   • 1 organization (Nottingham Forest FC)`);
  console.log(`   • 1 user (analyst@cortexfc.com)`);
  console.log(`   • 1 league (Premier League)`);
  console.log(`   • 6 clubs`);
  console.log(`   • 1 season (2025/26)`);
  console.log(`   • 16 players`);
  console.log(`   • 16 neural analyses`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
