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
  uniqueIndex,
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
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  trialEndsAt: timestamp("trial_ends_at"),
  logoUrl: text("logo_url"),
  // White-label / branding
  brandPrimaryColor: text("brand_primary_color"), // hex e.g. "#10b981"
  brandAccentColor: text("brand_accent_color"),
  brandDarkBg: text("brand_dark_bg"), // hex for main bg
  customDomain: text("custom_domain"), // e.g. "analytics.myclubfc.com"
  faviconUrl: text("favicon_url"),
  // SSO
  ssoProvider: text("sso_provider"), // "saml" | "oidc" | null
  ssoEntityId: text("sso_entity_id"),
  ssoLoginUrl: text("sso_login_url"),
  ssoCertificate: text("sso_certificate"),
  ssoEnabled: boolean("sso_enabled").default(false),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
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
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    keyHash: text("key_hash").notNull().unique(), // SHA-256 of the raw key
    keyPrefix: text("key_prefix").notNull(), // first 8 chars for display (e.g. "ctx_abc1...")
    name: text("name").default("Default").notNull(),
    rateLimitPerMin: integer("rate_limit_per_min").default(60),
    scopes: jsonb("scopes").$type<string[]>().default(["read"]),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ak_hash").on(table.keyHash),
    index("idx_ak_org").on(table.orgId),
    index("idx_apikeys_active_expires").on(table.isActive, table.expiresAt),
  ]
);

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(), // HMAC signing secret
    events: jsonb("events").notNull(), // ["analysis_complete", "report_generated"]
    isActive: boolean("is_active").default(true).notNull(),
    lastTriggeredAt: timestamp("last_triggered_at"),
    failCount: integer("fail_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_wh_org").on(table.orgId)]
);

export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    role: text("role").default("analyst").notNull(), // admin, analyst, viewer
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_om_user").on(table.userId),
    index("idx_om_org").on(table.orgId),
  ]
);

export const orgInvites = pgTable(
  "org_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    role: text("role").default("analyst").notNull(),
    token: text("token").notNull().unique(),
    invitedBy: uuid("invited_by").references(() => users.id),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_oi_token").on(table.token),
    index("idx_oi_email").on(table.email),
  ]
);

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

export const transfers = pgTable(
  "transfers",
  {
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
  },
  (table) => [
    index("idx_transfers_date").on(table.transferDate),
  ]
);

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
    deletedAt: timestamp("deleted_at"),
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
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// SCOUTING COMMENTS
// ============================================

export const scoutingComments = pgTable(
  "scouting_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetId: uuid("target_id")
      .references(() => scoutingTargets.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_sc_target").on(table.targetId),
    index("idx_sc_org").on(table.orgId),
  ]
);

// ============================================
// PLAYER WATCHLIST
// ============================================

export const playerWatchlist = pgTable(
  "player_watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .references(() => players.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_watchlist_player_user").on(table.playerId, table.userId),
    index("idx_watchlist_user").on(table.userId),
  ]
);

// ============================================
// REPORTS
// ============================================

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    type: text("type").notNull(), // weekly_newsletter, player_report, squad_analysis, scouting_report
    orgId: uuid("org_id").references(() => organizations.id).notNull(),
    content: jsonb("content"), // structured report data
    htmlContent: text("html_content"),
    pdfUrl: text("pdf_url"),
    isPublished: boolean("is_published").default(false),
    publishedAt: timestamp("published_at"),
    createdBy: uuid("created_by").references(() => users.id),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_reports_published").on(table.publishedAt),
    index("idx_reports_type").on(table.type),
  ]
);

// ============================================
// REPORT SCHEDULES (Sprint 8.2)
// ============================================

export const reportSchedules = pgTable(
  "report_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    template: text("template").notNull(), // "weekly_newsletter" | "squad_analysis" etc
    title: text("title"),
    frequency: text("frequency").notNull(), // "daily" | "weekly" | "monthly"
    dayOfWeek: integer("day_of_week"), // 0-6, for weekly
    dayOfMonth: integer("day_of_month"), // 1-28, for monthly
    hour: integer("hour").notNull().default(9), // 0-23 UTC
    timezone: text("timezone").default("America/Sao_Paulo"),
    recipientEmails: jsonb("recipient_emails").$type<string[]>().default([]),
    isActive: boolean("is_active").default(true),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_report_schedules_org").on(table.orgId),
    index("idx_report_schedules_next_run").on(table.nextRunAt),
  ]
);

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
    index("idx_agentruns_org_created").on(table.orgId, table.createdAt),
  ]
);

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    type: text("type").notNull(), // "contract_alert" | "analysis_complete" | "agent_complete" | "scouting_update" | "market_opportunity"
    title: text("title").notNull(),
    body: text("body"),
    entityType: text("entity_type"), // "player" | "analysis" | "report"
    entityId: text("entity_id"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_notif_user").on(table.userId),
    index("idx_notif_org").on(table.orgId),
    index("idx_notif_read").on(table.readAt),
  ]
);

// ============================================
// CHAT IA
// ============================================

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    title: text("title").default("Nova conversa").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_cc_org").on(table.orgId),
    index("idx_cc_user").on(table.userId),
  ]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .references(() => chatConversations.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(), // "user" | "assistant"
    content: text("content").notNull(),
    tokensUsed: integer("tokens_used"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_cm_conv").on(table.conversationId),
  ]
);

// ============================================
// AUDIT LOG
// ============================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(), // e.g. "analysis.created", "member.invited", "settings.updated"
    entityType: text("entity_type"), // e.g. "analysis", "player", "api_key", "webhook"
    entityId: text("entity_id"),
    metadata: jsonb("metadata"), // extra context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_al_org").on(table.orgId),
    index("idx_al_user").on(table.userId),
    index("idx_al_action").on(table.action),
    index("idx_al_created").on(table.createdAt),
  ]
);

// ============================================
// USER PREFERENCES
// ============================================

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  aiModel: text("ai_model").default("claude-sonnet-4-20250514"),
  maxTokens: integer("max_tokens").default(4096),
  temperature: real("temperature").default(0.7),
  notifyContracts: boolean("notify_contracts").default(true),
  notifyReports: boolean("notify_reports").default(true),
  notifyScouting: boolean("notify_scouting").default(true),
  notifyRisk: boolean("notify_risk").default(true),
  density: text("density").default("normal"),
  language: text("language").default("pt-BR"),
  soundEnabled: boolean("sound_enabled").default(false),
  hapticEnabled: boolean("haptic_enabled").default(true),
  soundVolume: real("sound_volume").default(0.3),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_prefs_user_org").on(table.userId, table.orgId),
]);

// ============================================
// TRANSFER SCENARIOS (Simulator)
// ============================================

export const transferScenarios = pgTable("transfer_scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  data: jsonb("data").notNull(),
  shareToken: text("share_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_scenarios_org").on(table.orgId),
  index("idx_scenarios_user").on(table.userId),
]);

// ============================================
// SHARED VIEWS
// ============================================

export const sharedViews = pgTable(
  "shared_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    token: text("token").notNull().unique(),
    viewType: text("view_type").notNull(), // "dashboard", "player", "analysis", "scouting"
    viewConfig: jsonb("view_config").notNull(), // filters, sort, etc
    title: text("title"),
    expiresAt: timestamp("expires_at"),
    viewCount: integer("view_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_sv_token").on(table.token),
    index("idx_sv_org").on(table.orgId),
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

export const transfersRelations = relations(transfers, ({ one }) => ({
  player: one(players, {
    fields: [transfers.playerId],
    references: [players.id],
  }),
  fromClub: one(clubs, {
    fields: [transfers.fromClubId],
    references: [clubs.id],
    relationName: "fromClub",
  }),
  toClub: one(clubs, {
    fields: [transfers.toClubId],
    references: [clubs.id],
    relationName: "toClub",
  }),
}));

export const playerMatchStatsRelations = relations(playerMatchStats, ({ one }) => ({
  player: one(players, {
    fields: [playerMatchStats.playerId],
    references: [players.id],
  }),
  match: one(matches, {
    fields: [playerMatchStats.matchId],
    references: [matches.id],
  }),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  user: one(users, {
    fields: [orgMembers.userId],
    references: [users.id],
  }),
  org: one(organizations, {
    fields: [orgMembers.orgId],
    references: [organizations.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

export const scoutingCommentsRelations = relations(scoutingComments, ({ one }) => ({
  target: one(scoutingTargets, {
    fields: [scoutingComments.targetId],
    references: [scoutingTargets.id],
  }),
  user: one(users, {
    fields: [scoutingComments.userId],
    references: [users.id],
  }),
}));

export const playerWatchlistRelations = relations(playerWatchlist, ({ one }) => ({
  player: one(players, {
    fields: [playerWatchlist.playerId],
    references: [players.id],
  }),
  user: one(users, {
    fields: [playerWatchlist.userId],
    references: [users.id],
  }),
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  league: one(leagues, {
    fields: [clubs.leagueId],
    references: [leagues.id],
  }),
  players: many(players),
}));
