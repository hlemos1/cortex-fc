import { db } from "./index";
import { eq, desc, count, avg, sql, and, inArray, sum } from "drizzle-orm";
import {
  players,
  clubs,
  neuralAnalyses,
  scoutingTargets,
  agentRuns,
  playerMatchStats,
  transfers,
  matches,
  orgMembers,
  orgInvites,
  organizations,
  users,
  apiKeys,
  webhookEndpoints,
  auditLogs,
  chatConversations,
  chatMessages,
  notifications,
} from "./schema";

// ============================================
// HELPERS
// ============================================

function sanitizeAnalyst(
  analyst: { id: string; name: string; [key: string]: unknown } | null | undefined
) {
  if (!analyst) return null;
  return { id: analyst.id, name: analyst.name };
}

// ============================================
// PLAYERS (filtered by org via club ownership)
// ============================================

/**
 * Get all players visible to an org.
 * For now, all players are shared (public DB).
 * When clubs become org-specific, add orgId filter.
 */
export async function getPlayers(options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 100, offset = 0 } = options ?? {};

  const allPlayers = await db.query.players.findMany({
    with: {
      currentClub: true,
      analyses: {
        orderBy: [desc(neuralAnalyses.createdAt)],
        limit: 1,
        with: {
          clubContext: true,
        },
      },
    },
    orderBy: [desc(players.marketValue)],
    limit,
    offset,
  });

  return allPlayers.map((player) => ({
    ...player,
    latestAnalysis: player.analyses[0] ?? null,
    analyses: undefined,
  }));
}

/**
 * Get a single player by ID
 */
export async function getPlayerById(id: string) {
  const player = await db.query.players.findFirst({
    where: eq(players.id, id),
    with: {
      currentClub: true,
      analyses: {
        orderBy: [desc(neuralAnalyses.createdAt)],
        with: {
          clubContext: true,
          analyst: true,
        },
      },
    },
  });

  if (!player) return null;

  return {
    ...player,
    analyses: player.analyses.map((a) => ({
      ...a,
      analyst: sanitizeAnalyst(a.analyst),
    })),
  };
}

/**
 * Get multiple players by their IDs
 */
export async function getPlayersByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const results = await db.query.players.findMany({
    where: inArray(players.id, ids),
    with: {
      currentClub: true,
      analyses: {
        orderBy: [desc(neuralAnalyses.createdAt)],
        limit: 1,
        with: {
          clubContext: true,
        },
      },
    },
  });

  return results;
}

/**
 * Search players by name (case-insensitive)
 */
export async function searchPlayers(query: string, options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 20, offset = 0 } = options ?? {};

  const allPlayers = await db.query.players.findMany({
    where: sql`lower(${players.name}) LIKE lower(${`%${query.replace(/[%_\\]/g, '\\$&')}%`})`,
    with: {
      currentClub: true,
    },
    orderBy: [desc(players.marketValue)],
    limit,
    offset,
  });

  return allPlayers;
}

/**
 * Check if a player exists
 */
export async function playerExists(id: string): Promise<boolean> {
  const p = await db.query.players.findFirst({
    where: eq(players.id, id),
    columns: { id: true },
  });
  return !!p;
}

/**
 * Check if a club exists
 */
export async function clubExists(id: string): Promise<boolean> {
  const c = await db.query.clubs.findFirst({
    where: eq(clubs.id, id),
    columns: { id: true },
  });
  return !!c;
}

// ============================================
// ANALYSES (filtered by orgId)
// ============================================

/**
 * Get analyses filtered by orgId (via analyst's org)
 */
export async function getAnalyses(orgId?: string, options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 50, offset = 0 } = options ?? {};

  const results = await db.query.neuralAnalyses.findMany({
    with: {
      player: {
        with: {
          currentClub: true,
        },
      },
      clubContext: true,
      analyst: true,
    },
    orderBy: [desc(neuralAnalyses.createdAt)],
    limit,
    offset,
    ...(orgId
      ? {
          where: sql`${neuralAnalyses.analystId} IN (
            SELECT id FROM users WHERE org_id = ${orgId}
          )`,
        }
      : {}),
  });

  return results.map((r) => ({ ...r, analyst: sanitizeAnalyst(r.analyst) }));
}

/**
 * Get a single analysis by ID, with org ownership check via analyst.
 */
export async function getAnalysisById(id: string, orgId?: string) {
  const analysis = await db.query.neuralAnalyses.findFirst({
    where: eq(neuralAnalyses.id, id),
    with: {
      player: {
        with: {
          currentClub: true,
        },
      },
      clubContext: true,
      analyst: true,
    },
  });

  if (!analysis) return null;

  // Enforce org isolation: check analyst belongs to requesting org
  if (orgId && analysis.analyst) {
    const analystUser = await db.query.users.findFirst({
      where: eq(users.id, analysis.analyst.id),
      columns: { orgId: true },
    });
    if (analystUser?.orgId !== orgId) return null;
  }

  return { ...analysis, analyst: sanitizeAnalyst(analysis.analyst) };
}

/**
 * Insert a new neural analysis
 */
export async function createAnalysis(data: typeof neuralAnalyses.$inferInsert) {
  const [inserted] = await db.insert(neuralAnalyses).values(data).returning();
  return inserted;
}

/**
 * Get data needed to generate alerts
 */
export async function getAlertData() {
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const expiringContracts = await db.query.players.findMany({
    where: sql`${players.contractUntil} IS NOT NULL AND ${players.contractUntil} < ${sixMonthsFromNow}`,
    with: {
      currentClub: true,
    },
    orderBy: [players.contractUntil],
    limit: 5,
  });

  const recentDecisions = await db.query.neuralAnalyses.findMany({
    with: {
      player: true,
    },
    orderBy: [desc(neuralAnalyses.createdAt)],
    limit: 5,
  });

  return { expiringContracts, recentDecisions };
}

// ============================================
// DASHBOARD (filtered by orgId where applicable)
// ============================================

/**
 * Get aggregate stats for the dashboard
 */
export async function getDashboardStats(orgId?: string) {
  const [playerCount] = await db
    .select({ value: count() })
    .from(players);

  const [analysisCount] = await db
    .select({ value: count() })
    .from(neuralAnalyses);

  const [targetCount] = await db
    .select({ value: count() })
    .from(scoutingTargets)
    .where(orgId ? eq(scoutingTargets.orgId, orgId) : undefined);

  const [avgScn] = await db
    .select({ value: avg(neuralAnalyses.scnPlus) })
    .from(neuralAnalyses);

  const decisionDistribution = await db
    .select({
      decision: neuralAnalyses.decision,
      count: count(),
    })
    .from(neuralAnalyses)
    .groupBy(neuralAnalyses.decision);

  const recentAnalyses = await db.query.neuralAnalyses.findMany({
    with: {
      player: true,
      clubContext: true,
    },
    orderBy: [desc(neuralAnalyses.createdAt)],
    limit: 5,
  });

  return {
    totalPlayers: playerCount.value,
    totalAnalyses: analysisCount.value,
    scoutingTargets: targetCount.value,
    averageSCN: avgScn.value ? Math.round(Number(avgScn.value)) : 0,
    decisionDistribution,
    recentAnalyses,
  };
}

// ============================================
// PLAYER SEASON STATS (Aggregated from match stats)
// ============================================

/**
 * Get aggregated season stats for a player
 */
export async function getPlayerSeasonStats(playerId: string) {
  const rows = await db
    .select({
      appearances: count(),
      minutesPlayed: sum(playerMatchStats.minutesPlayed),
      goals: sum(playerMatchStats.goals),
      assists: sum(playerMatchStats.assists),
      xg: sum(playerMatchStats.xg),
      xa: sum(playerMatchStats.xa),
      tackles: sum(playerMatchStats.tackles),
      interceptions: sum(playerMatchStats.interceptions),
      yellowCards: sum(playerMatchStats.yellowCards),
      redCards: sum(playerMatchStats.redCards),
      duelsWon: sum(playerMatchStats.duelsWon),
      duelsTotal: sum(playerMatchStats.duelsTotal),
      avgRating: avg(playerMatchStats.rating),
      avgPassAccuracy: avg(playerMatchStats.passAccuracy),
    })
    .from(playerMatchStats)
    .where(eq(playerMatchStats.playerId, playerId));

  const row = rows[0];
  if (!row || row.appearances === 0) return null;

  const duelsWon = Number(row.duelsWon) || 0;
  const duelsTotal = Number(row.duelsTotal) || 0;

  return {
    appearances: row.appearances,
    minutesPlayed: Number(row.minutesPlayed) || 0,
    goals: Number(row.goals) || 0,
    assists: Number(row.assists) || 0,
    avgRating: row.avgRating ? parseFloat(Number(row.avgRating).toFixed(2)) : null,
    xg: row.xg ? parseFloat(Number(row.xg).toFixed(2)) : null,
    xa: row.xa ? parseFloat(Number(row.xa).toFixed(2)) : null,
    passAccuracy: row.avgPassAccuracy ? parseFloat(Number(row.avgPassAccuracy).toFixed(1)) : null,
    tackles: Number(row.tackles) || 0,
    interceptions: Number(row.interceptions) || 0,
    yellowCards: Number(row.yellowCards) || 0,
    redCards: Number(row.redCards) || 0,
    duelsWonPct: duelsTotal > 0 ? parseFloat(((duelsWon / duelsTotal) * 100).toFixed(1)) : null,
  };
}

/**
 * Get recent match-by-match performance data for charts
 */
export async function getPlayerMatchPerformance(playerId: string, limit = 20) {
  const stats = await db
    .select({
      date: matches.matchDate,
      rating: playerMatchStats.rating,
      xg: playerMatchStats.xg,
      goals: playerMatchStats.goals,
    })
    .from(playerMatchStats)
    .innerJoin(matches, eq(playerMatchStats.matchId, matches.id))
    .where(eq(playerMatchStats.playerId, playerId))
    .orderBy(desc(matches.matchDate))
    .limit(limit);

  return stats.reverse().map((s) => ({
    date: s.date.toLocaleDateString("pt-BR", { month: "2-digit", day: "2-digit" }),
    rating: s.rating,
    xg: s.xg,
    goals: s.goals ?? 0,
  }));
}

/**
 * Get transfer history for a player
 */
export async function getPlayerTransfers(playerId: string) {
  const rows = await db
    .select({
      id: transfers.id,
      date: transfers.transferDate,
      fee: transfers.fee,
      type: transfers.transferType,
      fromClub: sql<string | null>`fc.name`,
      toClub: sql<string | null>`tc.name`,
    })
    .from(transfers)
    .leftJoin(sql`clubs fc`, sql`fc.id = ${transfers.fromClubId}`)
    .leftJoin(sql`clubs tc`, sql`tc.id = ${transfers.toClubId}`)
    .where(eq(transfers.playerId, playerId))
    .orderBy(desc(transfers.transferDate));

  return rows.map((r) => ({
    id: r.id,
    date: r.date.toLocaleDateString("pt-BR", { year: "numeric", month: "2-digit", day: "2-digit" }),
    fromClub: r.fromClub,
    toClub: r.toClub,
    fee: r.fee,
    type: r.type,
  }));
}

// ============================================
// AGENT RUNS (Audit Log)
// ============================================

/**
 * Log an agent run for audit purposes
 */
export async function createAgentRun(data: {
  agentType: "ORACLE" | "ANALISTA" | "SCOUT" | "BOARD_ADVISOR" | "CFO_MODELER" | "COACHING_ASSIST";
  inputContext: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  modelUsed: string;
  tokensUsed?: number;
  durationMs?: number;
  success?: boolean;
  error?: string;
  userId?: string;
  orgId?: string;
}) {
  const [inserted] = await db
    .insert(agentRuns)
    .values({
      agentType: data.agentType,
      inputContext: data.inputContext,
      outputResult: data.outputResult ?? null,
      modelUsed: data.modelUsed,
      tokensUsed: data.tokensUsed ?? null,
      durationMs: data.durationMs ?? null,
      success: data.success ?? true,
      error: data.error ?? null,
      userId: data.userId ?? null,
      orgId: data.orgId ?? null,
    })
    .returning();
  return inserted;
}

/**
 * Get agent runs for audit console
 */
export async function getAgentRuns(orgId?: string, options?: {
  limit?: number;
  offset?: number;
  agentType?: string;
  success?: boolean;
}) {
  const { limit = 50, offset = 0, agentType, success: successFilter } = options ?? {};

  const conditions = [];
  if (orgId) conditions.push(eq(agentRuns.orgId, orgId));
  if (agentType) conditions.push(eq(agentRuns.agentType, agentType as typeof agentRuns.agentType.enumValues[number]));
  if (successFilter !== undefined) conditions.push(eq(agentRuns.success, successFilter));

  return db.query.agentRuns.findMany({
    orderBy: [desc(agentRuns.createdAt)],
    limit,
    offset,
    ...(conditions.length > 0 ? { where: and(...conditions) } : {}),
  });
}

/**
 * Get agent run metrics for audit dashboard
 */
export async function getAgentRunMetrics(orgId?: string) {
  const baseWhere = orgId ? eq(agentRuns.orgId, orgId) : undefined;

  const [totals] = await db
    .select({
      totalRuns: count(),
      totalTokens: sum(agentRuns.tokensUsed),
      avgDuration: avg(agentRuns.durationMs),
      successCount: count(sql`CASE WHEN ${agentRuns.success} = true THEN 1 END`),
      errorCount: count(sql`CASE WHEN ${agentRuns.success} = false THEN 1 END`),
    })
    .from(agentRuns)
    .where(baseWhere);

  const byAgent = await db
    .select({
      agentType: agentRuns.agentType,
      count: count(),
      totalTokens: sum(agentRuns.tokensUsed),
      avgDuration: avg(agentRuns.durationMs),
    })
    .from(agentRuns)
    .where(baseWhere)
    .groupBy(agentRuns.agentType)
    .orderBy(desc(count()));

  return {
    totalRuns: totals?.totalRuns ?? 0,
    totalTokens: Number(totals?.totalTokens ?? 0),
    avgDuration: Math.round(Number(totals?.avgDuration ?? 0)),
    successCount: totals?.successCount ?? 0,
    errorCount: totals?.errorCount ?? 0,
    byAgent,
  };
}

// ============================================
// TEAM MANAGEMENT
// ============================================

/**
 * Get all members of an organization
 */
export async function getOrgMembers(orgId: string) {
  return db
    .select({
      id: orgMembers.id,
      userId: orgMembers.userId,
      role: orgMembers.role,
      joinedAt: orgMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.avatarUrl,
    })
    .from(orgMembers)
    .innerJoin(users, eq(orgMembers.userId, users.id))
    .where(eq(orgMembers.orgId, orgId))
    .orderBy(orgMembers.joinedAt);
}

/**
 * Get all orgs a user belongs to
 */
export async function getUserOrgs(userId: string) {
  return db
    .select({
      membershipId: orgMembers.id,
      role: orgMembers.role,
      orgId: organizations.id,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      orgTier: organizations.tier,
      orgLogo: organizations.logoUrl,
    })
    .from(orgMembers)
    .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
    .where(eq(orgMembers.userId, userId))
    .orderBy(organizations.name);
}

/**
 * Add a member to an organization
 */
export async function addOrgMember(data: {
  userId: string;
  orgId: string;
  role: string;
}) {
  const [inserted] = await db
    .insert(orgMembers)
    .values({
      userId: data.userId,
      orgId: data.orgId,
      role: data.role,
    })
    .returning();
  return inserted;
}

/**
 * Update member role
 */
export async function updateOrgMemberRole(memberId: string, role: string, orgId: string) {
  const [updated] = await db
    .update(orgMembers)
    .set({ role })
    .where(and(eq(orgMembers.id, memberId), eq(orgMembers.orgId, orgId)))
    .returning();
  return updated;
}

/**
 * Remove member from org
 */
export async function removeOrgMember(memberId: string, orgId: string) {
  await db.delete(orgMembers).where(
    and(eq(orgMembers.id, memberId), eq(orgMembers.orgId, orgId))
  );
}

/**
 * Create an invite
 */
export async function createOrgInvite(data: {
  email: string;
  orgId: string;
  role: string;
  token: string;
  invitedBy: string;
  expiresAt: Date;
}) {
  const [inserted] = await db
    .insert(orgInvites)
    .values({
      email: data.email,
      orgId: data.orgId,
      role: data.role,
      token: data.token,
      invitedBy: data.invitedBy,
      expiresAt: data.expiresAt,
    })
    .returning();
  return inserted;
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string) {
  return db.query.orgInvites.findFirst({
    where: eq(orgInvites.token, token),
  });
}

/**
 * Get pending invites for an org
 */
export async function getOrgInvites(orgId: string) {
  return db
    .select({
      id: orgInvites.id,
      email: orgInvites.email,
      role: orgInvites.role,
      expiresAt: orgInvites.expiresAt,
      acceptedAt: orgInvites.acceptedAt,
      createdAt: orgInvites.createdAt,
    })
    .from(orgInvites)
    .where(eq(orgInvites.orgId, orgId))
    .orderBy(desc(orgInvites.createdAt));
}

/**
 * Accept an invite
 */
export async function acceptInvite(inviteId: string) {
  const [updated] = await db
    .update(orgInvites)
    .set({ acceptedAt: new Date() })
    .where(eq(orgInvites.id, inviteId))
    .returning();
  return updated;
}

/**
 * Delete an invite
 */
export async function deleteInvite(inviteId: string, orgId: string) {
  await db.delete(orgInvites).where(
    and(eq(orgInvites.id, inviteId), eq(orgInvites.orgId, orgId))
  );
}

/**
 * Get org stats for holding dashboard (multi-club)
 */
export async function getHoldingDashboardStats(orgIds: string[]) {
  if (orgIds.length === 0) return [];

  const results = await Promise.all(
    orgIds.map(async (orgId) => {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { id: true, name: true, tier: true, logoUrl: true },
      });

      const [analysisStats] = await db
        .select({
          totalAnalyses: count(),
          avgScn: avg(neuralAnalyses.scnPlus),
        })
        .from(neuralAnalyses)
        .where(eq(neuralAnalyses.clubContextId, orgId));

      const [agentStats] = await db
        .select({
          totalRuns: count(),
          totalTokens: sum(agentRuns.tokensUsed),
        })
        .from(agentRuns)
        .where(eq(agentRuns.orgId, orgId));

      const memberCount = await db
        .select({ count: count() })
        .from(orgMembers)
        .where(eq(orgMembers.orgId, orgId));

      return {
        org,
        totalAnalyses: analysisStats?.totalAnalyses ?? 0,
        avgScn: Number(analysisStats?.avgScn ?? 0),
        totalAgentRuns: agentStats?.totalRuns ?? 0,
        totalTokens: Number(agentStats?.totalTokens ?? 0),
        memberCount: memberCount[0]?.count ?? 0,
      };
    })
  );

  return results;
}

// ============================================
// API KEYS
// ============================================

export async function createApiKey(data: {
  orgId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  createdBy: string;
  rateLimitPerMin?: number;
  expiresAt?: Date;
}) {
  const [inserted] = await db
    .insert(apiKeys)
    .values({
      orgId: data.orgId,
      keyHash: data.keyHash,
      keyPrefix: data.keyPrefix,
      name: data.name,
      createdBy: data.createdBy,
      rateLimitPerMin: data.rateLimitPerMin ?? 60,
      expiresAt: data.expiresAt ?? null,
    })
    .returning();
  return inserted;
}

export async function getApiKeyByHash(keyHash: string) {
  return db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  });
}

export async function getOrgApiKeys(orgId: string) {
  return db.query.apiKeys.findMany({
    where: eq(apiKeys.orgId, orgId),
    orderBy: [desc(apiKeys.createdAt)],
  });
}

export async function revokeApiKey(keyId: string, orgId: string) {
  const [updated] = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.orgId, orgId)))
    .returning();
  return updated;
}

export async function touchApiKey(keyId: string) {
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

// ============================================
// WEBHOOKS
// ============================================

export async function createWebhook(data: {
  orgId: string;
  url: string;
  secret: string;
  events: string[];
}) {
  const [inserted] = await db
    .insert(webhookEndpoints)
    .values({
      orgId: data.orgId,
      url: data.url,
      secret: data.secret,
      events: data.events,
    })
    .returning();
  return inserted;
}

export async function getOrgWebhooks(orgId: string) {
  return db.query.webhookEndpoints.findMany({
    where: eq(webhookEndpoints.orgId, orgId),
    orderBy: [desc(webhookEndpoints.createdAt)],
  });
}

export async function deleteWebhook(webhookId: string, orgId: string) {
  await db.delete(webhookEndpoints).where(
    and(eq(webhookEndpoints.id, webhookId), eq(webhookEndpoints.orgId, orgId))
  );
}

export async function getActiveWebhooksForEvent(orgId: string, event: string) {
  const hooks = await db.query.webhookEndpoints.findMany({
    where: and(
      eq(webhookEndpoints.orgId, orgId),
      eq(webhookEndpoints.isActive, true)
    ),
  });
  return hooks.filter((h) => {
    const events = h.events as string[];
    return events.includes(event);
  });
}

// ============================================
// AUDIT LOG
// ============================================

export async function createAuditLog(data: {
  orgId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const [inserted] = await db
    .insert(auditLogs)
    .values({
      orgId: data.orgId ?? null,
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      metadata: data.metadata ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    })
    .returning();
  return inserted;
}

export async function getAuditLogs(orgId: string, options?: {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: string;
  entityType?: string;
}) {
  const { limit = 50, offset = 0, action, userId, entityType } = options ?? {};

  const conditions = [eq(auditLogs.orgId, orgId)];
  if (action) conditions.push(eq(auditLogs.action, action));
  if (userId) conditions.push(eq(auditLogs.userId, userId));
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));

  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

// ============================================
// WHITE-LABEL / BRANDING
// ============================================

export async function updateOrgBranding(orgId: string, data: {
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  brandDarkBg?: string;
  customDomain?: string;
  faviconUrl?: string;
  logoUrl?: string;
}) {
  const [updated] = await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, orgId))
    .returning();
  return updated;
}

export async function updateOrgSso(orgId: string, data: {
  ssoProvider?: string;
  ssoEntityId?: string;
  ssoLoginUrl?: string;
  ssoCertificate?: string;
  ssoEnabled?: boolean;
}) {
  const [updated] = await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, orgId))
    .returning();
  return updated;
}

export async function getOrgById(orgId: string) {
  return db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });
}

// ============================================
// CHAT IA
// ============================================

export async function createConversation(data: {
  orgId: string;
  userId: string;
  title?: string;
}) {
  const [inserted] = await db
    .insert(chatConversations)
    .values({
      orgId: data.orgId,
      userId: data.userId,
      title: data.title ?? "Nova conversa",
    })
    .returning();
  return inserted;
}

export async function getConversations(orgId: string, userId: string) {
  return db.query.chatConversations.findMany({
    where: and(
      eq(chatConversations.orgId, orgId),
      eq(chatConversations.userId, userId)
    ),
    orderBy: [desc(chatConversations.updatedAt)],
    limit: 50,
  });
}

export async function getConversationMessages(conversationId: string, userId?: string) {
  // Verify ownership if userId provided
  if (userId) {
    const conv = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, conversationId),
      columns: { userId: true },
    });
    if (!conv || conv.userId !== userId) return [];
  }

  return db.query.chatMessages.findMany({
    where: eq(chatMessages.conversationId, conversationId),
    orderBy: [chatMessages.createdAt],
  });
}

export async function addChatMessage(data: {
  conversationId: string;
  role: string;
  content: string;
  tokensUsed?: number;
}) {
  const [inserted] = await db
    .insert(chatMessages)
    .values({
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      tokensUsed: data.tokensUsed ?? null,
    })
    .returning();

  // Update conversation timestamp
  await db
    .update(chatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(chatConversations.id, data.conversationId));

  return inserted;
}

export async function updateConversationTitle(id: string, title: string) {
  await db
    .update(chatConversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatConversations.id, id));
}

export async function deleteConversation(id: string, userId: string) {
  await db.delete(chatConversations).where(
    and(eq(chatConversations.id, id), eq(chatConversations.userId, userId))
  );
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function createNotification(data: {
  orgId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}) {
  const [inserted] = await db
    .insert(notifications)
    .values({
      orgId: data.orgId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    })
    .returning();
  return inserted;
}

export async function getUserNotifications(userId: string, options?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { limit = 30, unreadOnly = false } = options ?? {};

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(sql`${notifications.readAt} IS NULL`);
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(id: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(notifications.userId, userId),
      sql`${notifications.readAt} IS NULL`
    ));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      sql`${notifications.readAt} IS NULL`
    ));
  return result.count;
}
