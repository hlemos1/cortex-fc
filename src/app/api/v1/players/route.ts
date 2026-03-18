import { NextResponse } from "next/server";
import { requireApiAuth, requireScope } from "@/lib/api-auth";
import { getPlayers, searchPlayers, searchPlayersAdvanced } from "@/db/queries";

/**
 * GET /api/v1/players
 *
 * Query params:
 *   ?search=name         - search by player name/nationality/club (multi-term ILIKE)
 *   ?limit=50            - max results (1-200)
 *   ?offset=0            - pagination offset
 *   ?position=CB         - filter by position cluster
 *   ?nationality=Brazil  - filter by nationality
 *   ?club=Flamengo       - filter by club name
 *   ?minValue=5          - minimum market value (millions EUR)
 *   ?maxValue=100        - maximum market value (millions EUR)
 *   ?maxAge=25           - maximum age
 */
export async function GET(request: Request) {
  const { ctx, error } = await requireApiAuth(request);
  if (error) return error;

  if (!requireScope(ctx!, "read")) {
    return NextResponse.json({ error: "Insufficient scope. Required: read" }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50"), 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0"), 0);

  // Check if any advanced filters are present
  const position = url.searchParams.get("position") ?? undefined;
  const nationality = url.searchParams.get("nationality") ?? undefined;
  const club = url.searchParams.get("club") ?? undefined;
  const minValue = url.searchParams.get("minValue") ? parseFloat(url.searchParams.get("minValue")!) : undefined;
  const maxValue = url.searchParams.get("maxValue") ? parseFloat(url.searchParams.get("maxValue")!) : undefined;
  const maxAge = url.searchParams.get("maxAge") ? parseInt(url.searchParams.get("maxAge")!) : undefined;

  const hasFilters = position || nationality || club || minValue || maxValue || maxAge;

  // Advanced search mode (search term and/or filters)
  if (search || hasFilters) {
    const result = await searchPlayersAdvanced(search, limit, offset, {
      position,
      nationality,
      club,
      minMarketValue: minValue,
      maxMarketValue: maxValue,
      maxAge,
    });
    return NextResponse.json({
      data: result.players,
      meta: { limit, offset, total: result.total, count: result.players.length },
    });
  }

  // Default: list all players
  const players = await getPlayers({ limit, offset });
  return NextResponse.json({
    data: players,
    meta: { limit, offset, count: players.length },
  });
}
