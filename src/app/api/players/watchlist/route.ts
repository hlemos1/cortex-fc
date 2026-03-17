import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { isValidUUID } from "@/lib/validation";
import { getWatchlist, toggleWatchlist } from "@/db/queries";

// GET — list watchlist for current user
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const list = await getWatchlist(session!.userId);
    return NextResponse.json({ data: list });
  } catch (err) {
    console.error("Failed to fetch watchlist:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST — toggle a player on/off watchlist
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { playerId } = body;

    if (!playerId || !isValidUUID(playerId)) {
      return NextResponse.json({ error: "playerId invalido" }, { status: 400 });
    }

    const result = await toggleWatchlist(playerId, session!.userId, session!.orgId);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Failed to toggle watchlist:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
