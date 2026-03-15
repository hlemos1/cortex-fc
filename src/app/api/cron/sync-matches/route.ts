import { NextResponse } from "next/server";
import { syncMatches } from "@/services/sync-matches";

/**
 * Vercel Cron: sync yesterday's finished matches.
 * Runs daily at 06:00 UTC.
 *
 * Protected by CRON_SECRET header validation.
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncMatches();

    console.log(`[Cron] Matches synced: ${result.synced}, skipped: ${result.skipped}, errors: ${result.errors.length}`);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[Cron] Match sync failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
