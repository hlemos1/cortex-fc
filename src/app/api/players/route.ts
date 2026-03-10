import { NextResponse } from "next/server";
import { getPlayers } from "@/db/queries";

export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json({ data: players });
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
