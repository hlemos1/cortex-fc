import { NextResponse } from "next/server"

export function withCacheHeaders(
  response: NextResponse,
  options: {
    maxAge?: number
    staleWhileRevalidate?: number
    isPrivate?: boolean
  },
): NextResponse {
  const { maxAge = 0, staleWhileRevalidate = 0, isPrivate = true } = options

  const directives = [
    isPrivate ? "private" : "public",
    `max-age=${maxAge}`,
  ]

  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  }

  response.headers.set("Cache-Control", directives.join(", "))
  return response
}

// Presets
export const CACHE_NONE = { maxAge: 0 }
export const CACHE_SHORT = { maxAge: 60, staleWhileRevalidate: 120 }
export const CACHE_MEDIUM = { maxAge: 300, staleWhileRevalidate: 600 }
export const CACHE_LONG = { maxAge: 3600, staleWhileRevalidate: 7200 }
