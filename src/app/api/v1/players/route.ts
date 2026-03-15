import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getPlayers, searchPlayers } from "@/db/queries";

/**
 * GET /api/v1/players
 *
 * Query params:
 *   ?search=name     - search by player name
 *   ?limit=50        - max results (1-200)
 *   ?offset=0        - pagination offset
 */
export async function GET(request: Request) {
  const { ctx, error } = await requireApiAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50"), 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0"), 0);

  const players = search
    ? await searchPlayers(search, { limit, offset })
    : await getPlayers({ limit, offset });

  return NextResponse.json({
    data: players,
    meta: { limit, offset, count: players.length },
  });
}
