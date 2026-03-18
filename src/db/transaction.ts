import { db } from "./index"

/**
 * Execute multiple DB operations in a transaction.
 * If any operation fails, all changes are rolled back.
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     await tx.insert(analyses).values(...)
 *     await tx.insert(auditLogs).values(...)
 *     return analysisId
 *   })
 */
export async function withTransaction<T>(
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return db.transaction(fn)
}
