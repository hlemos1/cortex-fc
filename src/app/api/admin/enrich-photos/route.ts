import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db/index";
import { players } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { searchPlayersByName } from "@/services/api-football";

const PREMIER_LEAGUE_ID = 39;
const SEASON = 2024;

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (session!.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    if (!process.env.API_FOOTBALL_KEY) {
      return NextResponse.json(
        { error: "API_FOOTBALL_KEY not configured" },
        { status: 503 }
      );
    }

    // Get all players without photos
    const playersWithoutPhotos = await db.query.players.findMany({
      where: isNull(players.photoUrl),
    });

    if (playersWithoutPhotos.length === 0) {
      return NextResponse.json({ message: "All players already have photos", updated: 0 });
    }

    let updated = 0;
    const errors: string[] = [];

    for (const player of playersWithoutPhotos) {
      try {
        // Search by last name for better accuracy
        const lastName = player.name.split(" ").pop() ?? player.name;
        const result = await searchPlayersByName({
          search: lastName,
          league: PREMIER_LEAGUE_ID,
          season: SEASON,
        });

        // Find best match
        const match = result.players.find(
          (p) =>
            p.player.name.toLowerCase() === player.name.toLowerCase() ||
            p.player.name.toLowerCase().includes(lastName.toLowerCase())
        );

        if (match?.player.photo) {
          await db
            .update(players)
            .set({
              photoUrl: match.player.photo,
              externalId: String(match.player.id),
            })
            .where(eq(players.id, player.id));
          updated++;
        } else {
          errors.push(`No match: ${player.name}`);
        }

        // Rate limit: API-Football has limits
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        errors.push(`Error: ${player.name} — ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return NextResponse.json({
      message: `Enriched ${updated}/${playersWithoutPhotos.length} players`,
      updated,
      total: playersWithoutPhotos.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Enrich photos error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
