import { db } from "@/db";
import {
  eq,
  desc,
  and,
  isNull,
} from "drizzle-orm";
import { reports } from "@/db/schema";

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
