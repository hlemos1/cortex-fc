import { NextResponse } from "next/server";
import { syncPlayerStats } from "@/services/sync-player-stats";

/**
 * Vercel Cron: sync player stats for recent matches.
 * Runs daily at 07:00 UTC (1h after match sync).
 *
 * Protected by CRON_SECRET header validation.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncPlayerStats(20);

    console.log(`[Cron] Stats synced: ${result.matchesProcessed} matches, ${result.statsInserted} player stats, ${result.errors.length} errors`);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[Cron] Stats sync failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
