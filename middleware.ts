import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { apiRateLimit, checkRateLimit } from "@/lib/rate-limit"
import { createRequestLogger } from "@/lib/logger"

const ALLOWED_ORIGINS = [
  "https://cortex-fc.vercel.app",
  "https://cortexfc.com",
  "http://localhost:3000",
]

// Paths that should not be logged
const SKIP_LOG_PATHS = ["/api/health", "/_next/", "/favicon.ico", "/sw.js"]

function shouldLogRequest(pathname: string): boolean {
  return !SKIP_LOG_PATHS.some((p) => pathname.startsWith(p))
}

function addRequestIdHeader(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("X-Request-Id", requestId)
  return response
}

export default auth(async (req) => {
  const start = Date.now()
  const requestId = crypto.randomUUID()
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isApiRoute = pathname.startsWith("/api/")
  const isAuthRoute = pathname.startsWith("/api/auth")
  const isRegisterRoute = pathname.startsWith("/api/register")
  const isPublicPage = pathname === "/" || pathname === "/pricing" || pathname.startsWith("/termos") || pathname.startsWith("/privacidade")

  const log = createRequestLogger(requestId, {
    path: pathname,
    method: req.method,
  })

  if (shouldLogRequest(pathname)) {
    log.info("Request started", {
      userAgent: req.headers.get("user-agent") ?? undefined,
    })
  }

  // CORS headers for API routes
  if (isApiRoute) {
    const origin = req.headers.get("origin") ?? ""
    const response = NextResponse.next()
    response.headers.set("X-Request-Id", requestId)

    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
      response.headers.set("Access-Control-Max-Age", "86400")
    }

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      })
    }
  }

  // Allow auth and register routes through
  if (isAuthRoute || isRegisterRoute) {
    const response = NextResponse.next()
    return addRequestIdHeader(response, requestId)
  }

  // Allow public pages
  if (isPublicPage) {
    const response = NextResponse.next()
    return addRequestIdHeader(response, requestId)
  }

  // Rate limit API routes
  if (isApiRoute) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
    const { success } = await checkRateLimit(apiRateLimit, ip)
    if (!success) {
      log.warn("Rate limited", { statusCode: 429, duration: Date.now() - start })
      const response = NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      )
      return addRequestIdHeader(response, requestId)
    }
  }

  // Require auth for protected routes
  if (!isLoggedIn) {
    if (isApiRoute) {
      log.warn("Unauthorized request", { statusCode: 401, duration: Date.now() - start })
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      return addRequestIdHeader(response, requestId)
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (shouldLogRequest(pathname)) {
    log.info("Request completed", {
      statusCode: 200,
      duration: Date.now() - start,
      userId: req.auth?.user?.id ?? undefined,
    })
  }

  const response = NextResponse.next()
  return addRequestIdHeader(response, requestId)
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/players/:path*",
    "/analysis/:path*",
    "/scouting/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/agent-console/:path*",
    "/api/players/:path*",
    "/api/analyses/:path*",
    "/api/oracle/:path*",
    "/api/scout/:path*",
    "/api/analista/:path*",
    "/api/cfo/:path*",
    "/api/board/:path*",
    "/api/stripe/:path*",
  ],
}
