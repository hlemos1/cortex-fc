import { db } from "@/db";
import {
  eq,
  desc,
  and,
  isNull,
  lte,
} from "drizzle-orm";
import { reports, reportSchedules } from "@/db/schema";

// ============================================
// REPORTS
// ============================================

/**
 * Soft delete a report
 */
export async function softDeleteReport(id: string, orgId: string) {
  await db.update(reports)
    .set({ deletedAt: new Date() })
    .where(and(eq(reports.id, id), eq(reports.orgId, orgId)));
}

/**
 * Restore a soft-deleted report
 */
export async function restoreReport(id: string, orgId: string) {
  await db.update(reports)
    .set({ deletedAt: null })
    .where(and(eq(reports.id, id), eq(reports.orgId, orgId)));
}

/**
 * Get reports for an org (excluding soft-deleted)
 */
export async function getReports(orgId: string, options?: {
  limit?: number;
  offset?: number;
  type?: string;
}) {
  const { limit = 50, offset = 0, type } = options ?? {};

  const conditions = [eq(reports.orgId, orgId), isNull(reports.deletedAt)];
  if (type) conditions.push(eq(reports.type, type));

  return db
    .select()
    .from(reports)
    .where(and(...conditions))
    .orderBy(desc(reports.createdAt))
    .limit(limit)
    .offset(offset);
}

// ============================================
// SCHEDULED REPORTS (Sprint 8.2)
// ============================================

export async function getReportSchedules(orgId: string) {
  return db
    .select()
    .from(reportSchedules)
    .where(eq(reportSchedules.orgId, orgId))
    .orderBy(desc(reportSchedules.createdAt));
}

export async function createReportSchedule(data: {
  orgId: string;
  createdBy: string;
  template: string;
  title?: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  timezone?: string;
  recipientEmails?: string[];
}) {
  const nextRunAt = calculateNextRun(data.frequency, data.dayOfWeek, data.dayOfMonth, data.hour ?? 9);
  const [schedule] = await db
    .insert(reportSchedules)
    .values({ ...data, nextRunAt })
    .returning();
  return schedule;
}

export async function updateReportSchedule(
  id: string,
  orgId: string,
  data: Partial<{
    title: string;
    frequency: string;
    dayOfWeek: number;
    dayOfMonth: number;
    hour: number;
    isActive: boolean;
    recipientEmails: string[];
    lastRunAt: Date;
    nextRunAt: Date;
  }>
) {
  const nextRunAt = data.nextRunAt
    ? data.nextRunAt
    : data.frequency
      ? calculateNextRun(data.frequency, data.dayOfWeek, data.dayOfMonth, data.hour ?? 9)
      : undefined;
  const [updated] = await db
    .update(reportSchedules)
    .set({ ...data, ...(nextRunAt ? { nextRunAt } : {}), updatedAt: new Date() })
    .where(and(eq(reportSchedules.id, id), eq(reportSchedules.orgId, orgId)))
    .returning();
  return updated;
}

export async function deleteReportSchedule(id: string, orgId: string) {
  await db
    .delete(reportSchedules)
    .where(and(eq(reportSchedules.id, id), eq(reportSchedules.orgId, orgId)));
}

export async function getDueSchedules() {
  return db
    .select()
    .from(reportSchedules)
    .where(
      and(
        eq(reportSchedules.isActive, true),
        lte(reportSchedules.nextRunAt, new Date())
      )
    );
}

export function calculateNextRun(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  hour: number = 9
): Date {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(hour);

  switch (frequency) {
    case "daily":
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case "weekly": {
      const targetDay = dayOfWeek ?? 1; // Monday default
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0 || (daysUntil === 0 && next <= now)) daysUntil += 7;
      next.setDate(next.getDate() + daysUntil);
      break;
    }
    case "monthly": {
      const targetDate = dayOfMonth ?? 1;
      next.setDate(targetDate);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      break;
    }
  }
  return next;
}
