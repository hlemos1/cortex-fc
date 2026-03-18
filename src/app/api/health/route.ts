import { NextResponse } from "next/server"
import { db } from "@/db/index"
import { sql } from "drizzle-orm"
import { logger } from "@/lib/logger"

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  checks: {
    database: { status: string; latencyMs: number; error?: string }
    redis: { status: string; latencyMs: number }
    stripe: { status: string }
    ai: { status: string }
    memory: { rss: number; heapUsed: number; heapTotal: number }
  }
  uptime: number
}

const startTime = Date.now()

export async function GET() {
  const memoryUsage = process.memoryUsage()

  const checks: HealthStatus["checks"] = {
    database: { status: "unknown", latencyMs: 0 },
    redis: { status: "unknown", latencyMs: 0 },
    stripe: { status: "unknown" },
    ai: { status: "unknown" },
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
  }

  // Database check
  try {
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1`)
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido"
    checks.database = { status: "error", latencyMs: 0, error: errorMsg }
    logger.error("Health check: database failed", {}, err instanceof Error ? err : undefined)
  }

  // Redis check (Upstash REST)
  try {
    const redisStart = Date.now()
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      })
      checks.redis = { status: res.ok ? "ok" : "error", latencyMs: Date.now() - redisStart }
    } else {
      checks.redis = { status: "not_configured", latencyMs: 0 }
    }
  } catch {
    checks.redis = { status: "error", latencyMs: 0 }
  }

  // Stripe check (config only, no API call)
  checks.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured",
  }

  // AI check (config only)
  checks.ai = {
    status: process.env.ANTHROPIC_API_KEY ? "configured" : "not_configured",
  }

  const allOk = checks.database.status === "ok"
  const status: HealthStatus = {
    status: allOk ? "healthy" : checks.database.status === "error" ? "unhealthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    checks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  }

  return NextResponse.json(status, {
    status: allOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  })
}
