import { NextResponse } from "next/server";
import { getAnalyses, createAnalysis } from "@/db/queries";

export async function GET() {
  try {
    const analyses = await getAnalyses();
    return NextResponse.json({ data: analyses });
  } catch (error) {
    console.error("Failed to fetch analyses:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "playerId",
      "clubContextId",
      "vx",
      "rx",
      "vxComponents",
      "rxComponents",
      "c1Technical",
      "c2Tactical",
      "c3Physical",
      "c4Behavioral",
      "c5Narrative",
      "c6Economic",
      "c7Ai",
      "decision",
      "confidence",
      "reasoning",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const analysis = await createAnalysis(body);
    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch (error) {
    console.error("Failed to create analysis:", error);
    return NextResponse.json(
      { error: "Failed to create analysis" },
      { status: 500 }
    );
  }
}
