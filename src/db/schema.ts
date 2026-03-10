import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  pgEnum,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const decisionEnum = pgEnum("cortex_decision", [
  "CONTRATAR",
  "BLINDAR",
  "MONITORAR",
  "EMPRESTIMO",
  "RECUSAR",
  "ALERTA_CINZA",
]);

export const agentTypeEnum = pgEnum("agent_type", [
  "ORACLE",
  "ANALISTA",
  "SCOUT",
  "BOARD_ADVISOR",
  "CFO_MODELER",
  "COACHING_ASSIST",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "scout_individual",
  "club_professional",
  "holding_multiclub",
]);

export const positionClusterEnum = pgEnum("position_cluster", [
  "GK",
  "CB",
  "FB",
  "DM",
  "CM",
  "AM",
  "W",
  "ST",
]);

// ============================================
// AUTH & ORGANIZATIONS
// ============================================

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tier: subscriptionTierEnum("tier").default("free").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  orgId: uuid("org_id").references(() => organizations.id),
  role: text("role").default("analyst").notNull(), // admin, analyst, viewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// FOOTBALL ENTITIES
// ============================================

export const leagues = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  tier: integer("tier").default(1),
  externalId: text("external_id"), // API-Football ID
});

export const clubs = pgTable("clubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  country: text("country").notNull(),
  leagueId: uuid("league_id").references(() => leagues.id),
  logoUrl: text("logo_url"),
  stadiumName: text("stadium_name"),
  foundedYear: integer("founded_year"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g. "2024/25"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  leagueId: uuid("league_id").references(() => leagues.id),
});

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    fullName: text("full_name"),
    nationality: text("nationality").notNull(),
    secondNationality: text("second_nationality"),
    dateOfBirth: timestamp("date_of_birth"),
    age: integer("age"),
    height: integer("height"), // cm
    weight: integer("weight"), // kg
    preferredFoot: text("preferred_foot"), // left, right, both
    positionCluster: positionClusterEnum("position_cluster").notNull(),
    positionDetail: text("position_detail"), // e.g. "Left Centre Back"
    currentClubId: uuid("current_club_id").references(() => clubs.id),
    marketValue: real("market_value"), // millions EUR
    contractUntil: timestamp("contract_until"),
    salary: real("salary"), // annual, millions EUR
    photoUrl: text("photo_url"),
    externalId: text("external_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_players_club").on(table.currentClubId),
    index("idx_players_position").on(table.positionCluster),
    index("idx_players_nationality").on(table.nationality),
  ]
);

export const transfers = pgTable("transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .references(() => players.id)
    .notNull(),
  fromClubId: uuid("from_club_id").references(() => clubs.id),
  toClubId: uuid("to_club_id").references(() => clubs.id),
  fee: real("fee"), // millions EUR
  transferDate: timestamp("transfer_date").notNull(),
  transferType: text("transfer_type"), // permanent, loan, free, swap
  contractYears: integer("contract_years"),
});

// ============================================
// MATCH DATA
// ============================================

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  homeClubId: uuid("home_club_id")
    .references(() => clubs.id)
    .notNull(),
  awayClubId: uuid("away_club_id")
    .references(() => clubs.id)
    .notNull(),
  seasonId: uuid("season_id").references(() => seasons.id),
  matchDate: timestamp("match_date").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  competition: text("competition"),
  round: text("round"),
  externalId: text("external_id"),
  statsJson: jsonb("stats_json"), // raw stats from API
});

export const playerMatchStats = pgTable(
  "player_match_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .references(() => players.id)
      .notNull(),
    matchId: uuid("match_id")
      .references(() => matches.id)
      .notNull(),
    minutesPlayed: integer("minutes_played"),
    goals: integer("goals").default(0),
    assists: integer("assists").default(0),
    xg: real("xg"),
    xa: real("xa"),
    shots: integer("shots").default(0),
    shotsOnTarget: integer("shots_on_target").default(0),
    passes: integer("passes").default(0),
    passAccuracy: real("pass_accuracy"),
    tackles: integer("tackles").default(0),
    interceptions: integer("interceptions").default(0),
    duelsWon: integer("duels_won").default(0),
    duelsTotal: integer("duels_total").default(0),
    dribbles: integer("dribbles").default(0),
    fouls: integer("fouls").default(0),
    yellowCards: integer("yellow_cards").default(0),
    redCards: integer("red_cards").default(0),
    rating: real("rating"), // match rating 0-10
    position: text("position"),
    statsJson: jsonb("stats_json"), // full raw stats
  },
  (table) => [
    index("idx_pms_player").on(table.playerId),
    index("idx_pms_match").on(table.matchId),
  ]
);

// ============================================
// CORTEX NEURAL ANALYSIS (Core IP)
// ============================================

export const neuralAnalyses = pgTable(
  "neural_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .references(() => players.id)
      .notNull(),
    clubContextId: uuid("club_context_id")
      .references(() => clubs.id)
      .notNull(),
    seasonId: uuid("season_id").references(() => seasons.id),

    // Core VxRx scores
    vx: real("vx").notNull(),
    rx: real("rx").notNull(),
    vxComponents: jsonb("vx_components").notNull(), // VxComponents
    rxComponents: jsonb("rx_components").notNull(), // RxComponents

    // Neural layer scores (0-100)
    c1Technical: real("c1_technical").notNull(),
    c2Tactical: real("c2_tactical").notNull(),
    c3Physical: real("c3_physical").notNull(),
    c4Behavioral: real("c4_behavioral").notNull(),
    c5Narrative: real("c5_narrative").notNull(),
    c6Economic: real("c6_economic").notNull(),
    c7Ai: real("c7_ai").notNull(),

    // Algorithm scores (0-100)
    ast: real("ast"), // Análise de Sinergia Tática
    clf: real("clf"), // Compatibilidade Linguística e Filosófica
    gne: real("gne"), // Grau de Necessidade Estratégica
    wse: real("wse"), // Weight of Systemic Embedding
    rbl: real("rbl"), // Risk-Benefit Loop
    sace: real("sace"), // Score de Adaptação Cultural e Emocional
    scnPlus: real("scn_plus"), // Score Cortex Neural+ composite

    // Decision
    decision: decisionEnum("decision").notNull(),
    confidence: real("confidence").notNull(), // 0-100
    reasoning: text("reasoning").notNull(),
    recommendedActions: jsonb("recommended_actions"), // string[]
    risks: jsonb("risks"), // string[]
    comparables: jsonb("comparables"), // string[]

    // Meta
    analystId: uuid("analyst_id").references(() => users.id),
    isPublished: boolean("is_published").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_na_player").on(table.playerId),
    index("idx_na_club").on(table.clubContextId),
    index("idx_na_decision").on(table.decision),
  ]
);

// ============================================
// SCOUTING
// ============================================

export const scoutingTargets = pgTable("scouting_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .references(() => players.id)
    .notNull(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  priority: text("priority").default("medium"), // high, medium, low
  status: text("status").default("watching"), // watching, contacted, negotiating, closed, passed
  notes: text("notes"),
  targetPrice: real("target_price"),
  analysisId: uuid("analysis_id").references(() => neuralAnalyses.id),
  addedBy: uuid("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// REPORTS
// ============================================

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: text("type").notNull(), // weekly_newsletter, player_report, squad_analysis, scouting_report
  orgId: uuid("org_id").references(() => organizations.id),
  content: jsonb("content"), // structured report data
  htmlContent: text("html_content"),
  pdfUrl: text("pdf_url"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// AGENT RUNS (Audit log)
// ============================================

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentType: agentTypeEnum("agent_type").notNull(),
    inputContext: jsonb("input_context").notNull(),
    outputResult: jsonb("output_result"),
    modelUsed: text("model_used").notNull(),
    tokensUsed: integer("tokens_used"),
    durationMs: integer("duration_ms"),
    success: boolean("success").default(true),
    error: text("error"),
    userId: uuid("user_id").references(() => users.id),
    orgId: uuid("org_id").references(() => organizations.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ar_agent").on(table.agentType),
    index("idx_ar_created").on(table.createdAt),
  ]
);

// ============================================
// RELATIONS
// ============================================

export const playersRelations = relations(players, ({ one, many }) => ({
  currentClub: one(clubs, {
    fields: [players.currentClubId],
    references: [clubs.id],
  }),
  analyses: many(neuralAnalyses),
  matchStats: many(playerMatchStats),
  scoutingTargets: many(scoutingTargets),
}));

export const neuralAnalysesRelations = relations(
  neuralAnalyses,
  ({ one }) => ({
    player: one(players, {
      fields: [neuralAnalyses.playerId],
      references: [players.id],
    }),
    clubContext: one(clubs, {
      fields: [neuralAnalyses.clubContextId],
      references: [clubs.id],
    }),
    analyst: one(users, {
      fields: [neuralAnalyses.analystId],
      references: [users.id],
    }),
  })
);

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  league: one(leagues, {
    fields: [clubs.leagueId],
    references: [leagues.id],
  }),
  players: many(players),
}));
