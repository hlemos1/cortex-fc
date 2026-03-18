import { db } from "@/db";
import {
  eq,
  desc,
  count,
  avg,
  and,
  sum,
} from "drizzle-orm";
import {
  neuralAnalyses,
  agentRuns,
  orgMembers,
  orgInvites,
  organizations,
  users,
  apiKeys,
  userPreferences,
} from "@/db/schema";

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
// USER PREFERENCES
// ============================================

export async function getUserPreferences(userId: string, orgId: string) {
  return db.query.userPreferences.findFirst({
    where: and(
      eq(userPreferences.userId, userId),
      eq(userPreferences.orgId, orgId)
    ),
  });
}

export async function upsertUserPreferences(
  userId: string,
  orgId: string,
  data: Partial<Omit<typeof userPreferences.$inferInsert, "id" | "userId" | "orgId">>
) {
  const existing = await getUserPreferences(userId, orgId);

  if (existing) {
    const [updated] = await db
      .update(userPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.orgId, orgId)
        )
      )
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(userPreferences)
    .values({
      userId,
      orgId,
      ...data,
    })
    .returning();
  return inserted;
}
