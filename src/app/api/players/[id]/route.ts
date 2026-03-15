import { NextResponse } from "next/server";
import { getPlayerById } from "@/db/queries";
import { requireAuth } from "@/lib/auth-helpers";
import { isValidUUID } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid player ID format" },
        { status: 400 }
      );
    }

    const player = await getPlayerById(id);

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: player });
  } catch (error) {
    console.error("Failed to fetch player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 }
    );
  }
}
