import { NextResponse } from "next/server";
import { getPlayers, searchPlayers } from "@/db/queries";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100"), 200);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const search = url.searchParams.get("search");

    const players = search
      ? await searchPlayers(search, { limit, offset })
      : await getPlayers({ limit, offset });
    return NextResponse.json({ data: players });
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
