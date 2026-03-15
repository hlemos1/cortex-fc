import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { apiRateLimit, checkRateLimit } from "@/lib/rate-limit"

const ALLOWED_ORIGINS = [
  "https://cortex-fc.vercel.app",
  "https://cortexfc.com",
  "http://localhost:3000",
]

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isApiRoute = pathname.startsWith("/api/")
  const isAuthRoute = pathname.startsWith("/api/auth")
  const isRegisterRoute = pathname.startsWith("/api/register")
  const isPublicPage = pathname === "/" || pathname === "/pricing" || pathname.startsWith("/termos") || pathname.startsWith("/privacidade")

  // CORS headers for API routes
  if (isApiRoute) {
    const origin = req.headers.get("origin") ?? ""
    const response = NextResponse.next()

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
  if (isAuthRoute || isRegisterRoute) return NextResponse.next()

  // Allow public pages
  if (isPublicPage) return NextResponse.next()

  // Rate limit API routes
  if (isApiRoute) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
    const { success } = await checkRateLimit(apiRateLimit, ip)
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      )
    }
  }

  // Require auth for protected routes
  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
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
