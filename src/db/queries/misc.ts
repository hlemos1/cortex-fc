import { db } from "@/db";
import {
  eq,
  desc,
  count,
  and,
  sql,
} from "drizzle-orm";
import {
  notifications,
  auditLogs,
  webhookEndpoints,
  transferScenarios,
  users,
} from "@/db/schema";

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
// TRANSFER SCENARIOS (Simulator)
// ============================================

export async function getScenarios(orgId: string, userId: string) {
  return db.query.transferScenarios.findMany({
    where: and(
      eq(transferScenarios.orgId, orgId),
      eq(transferScenarios.userId, userId)
    ),
    orderBy: [desc(transferScenarios.updatedAt)],
  });
}

export async function createScenario(data: {
  orgId: string;
  userId: string;
  name: string;
  data: unknown;
  shareToken?: string;
}) {
  const [inserted] = await db
    .insert(transferScenarios)
    .values({
      orgId: data.orgId,
      userId: data.userId,
      name: data.name,
      data: data.data,
      shareToken: data.shareToken ?? null,
    })
    .returning();
  return inserted;
}

export async function updateScenario(
  id: string,
  userId: string,
  data: { name?: string; data?: unknown }
) {
  const [updated] = await db
    .update(transferScenarios)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transferScenarios.id, id), eq(transferScenarios.userId, userId)))
    .returning();
  return updated;
}

export async function deleteScenario(id: string, userId: string) {
  await db
    .delete(transferScenarios)
    .where(and(eq(transferScenarios.id, id), eq(transferScenarios.userId, userId)));
}
