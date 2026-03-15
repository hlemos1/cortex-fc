/**
 * Audit log helper.
 *
 * Wraps createAuditLog for convenient use in API routes.
 * Fire-and-forget — never blocks the response.
 */

import { createAuditLog } from "@/db/queries";

export function audit(data: {
  orgId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}) {
  const ipAddress =
    data.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    data.request?.headers.get("x-real-ip") ??
    undefined;
  const userAgent = data.request?.headers.get("user-agent") ?? undefined;

  // Fire and forget
  createAuditLog({
    orgId: data.orgId,
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    metadata: data.metadata,
    ipAddress,
    userAgent,
  }).catch((err) => {
    console.error("[Audit] Failed to log:", err);
  });
}
