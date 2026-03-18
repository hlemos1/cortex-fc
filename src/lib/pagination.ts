export interface CursorPaginationParams {
  cursor?: string // base64 encoded cursor
  limit?: number
  direction?: "forward" | "backward"
}

export interface CursorPaginationResult<T> {
  items: T[]
  nextCursor: string | null
  prevCursor: string | null
  hasMore: boolean
}

// Encode cursor from id + sortValue
export function encodeCursor(id: string, sortValue: string | number | Date): string {
  const value = sortValue instanceof Date ? sortValue.toISOString() : String(sortValue)
  return Buffer.from(JSON.stringify({ id, v: value })).toString("base64url")
}

// Decode cursor
export function decodeCursor(cursor: string): { id: string; v: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString())
  } catch {
    return null
  }
}

// Build pagination result
export function buildCursorResult<T extends { id: string }>(
  items: T[],
  limit: number,
  getCursorValue: (item: T) => string | number | Date,
): CursorPaginationResult<T> {
  const hasMore = items.length > limit
  const trimmed = hasMore ? items.slice(0, limit) : items

  return {
    items: trimmed,
    nextCursor: hasMore && trimmed.length > 0
      ? encodeCursor(trimmed[trimmed.length - 1].id, getCursorValue(trimmed[trimmed.length - 1]))
      : null,
    prevCursor: trimmed.length > 0
      ? encodeCursor(trimmed[0].id, getCursorValue(trimmed[0]))
      : null,
    hasMore,
  }
}
