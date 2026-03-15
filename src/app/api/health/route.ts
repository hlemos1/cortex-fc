import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface HealthCheck {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: { status: "healthy" | "unhealthy"; latency: number; error?: string };
    memory: { rss: number; heapUsed: number; heapTotal: number };
  };
}

export async function GET() {
  const memoryUsage = process.memoryUsage();

  let dbStatus: "healthy" | "unhealthy" = "healthy";
  let dbLatency = 0;
  let dbError: string | undefined;

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - start;
  } catch (error) {
    dbStatus = "unhealthy";
    dbError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  const overallStatus = dbStatus === "healthy" ? "healthy" : "unhealthy";

  const health: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    checks: {
      database: {
        status: dbStatus,
        latency: dbLatency,
        ...(dbError ? { error: dbError } : {}),
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    },
  };

  return NextResponse.json(health, {
    status: overallStatus === "healthy" ? 200 : 503,
  });
}
