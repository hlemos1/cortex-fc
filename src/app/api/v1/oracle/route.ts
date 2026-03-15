import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { createAgentRun } from "@/db/queries";
import { isValidUUID } from "@/lib/validation";
import { canUseAgent } from "@/lib/feature-gates";

/**
 * POST /api/v1/oracle
 *
 * Body:
 *   playerId: string (UUID)
 *   clubContextId: string (UUID)
 *   playerName: string
 *   position: string
 *   age?: number
 *   nationality?: string
 *   currentClub?: string
 *   marketValue?: number
 */
export async function POST(request: Request) {
  const { ctx, error } = await requireApiAuth(request);
  if (error) return error;

  if (!canUseAgent(ctx!.tier, "ORACLE")) {
    return NextResponse.json(
      { error: "ORACLE agent not available for your tier" },
      { status: 403 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { playerId, clubContextId, playerName, position, age, nationality, currentClub, marketValue, buyingClubName, buyingClubLeague } = body;

  if (!playerId || !clubContextId || !playerName || !position) {
    return NextResponse.json(
      { error: "playerId, clubContextId, playerName, and position are required" },
      { status: 400 }
    );
  }

  if (!isValidUUID(playerId) || !isValidUUID(clubContextId)) {
    return NextResponse.json(
      { error: "playerId and clubContextId must be valid UUIDs" },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    const { runOracleWithPlayerData } = await import("@/lib/agents/oracle-agent");

    const result = await runOracleWithPlayerData({
      playerId,
      clubContextId,
      vxComponents: {},
      rxComponents: {},
      playerName,
      playerAge: age ?? 25,
      position,
      nationality: nationality ?? "",
      currentClub: currentClub ?? "",
      marketValue: marketValue ?? 0,
      buyingClubName: buyingClubName ?? "",
      buyingClubLeague: buyingClubLeague ?? "",
    });

    const durationMs = Date.now() - startTime;

    await createAgentRun({
      agentType: "ORACLE",
      inputContext: { playerId, playerName, position, source: "api_v1" },
      outputResult: result as unknown as Record<string, unknown>,
      modelUsed: "claude-sonnet-4-20250514",
      durationMs,
      success: true,
      orgId: ctx!.orgId,
    }).catch(() => {});

    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ORACLE execution failed";

    await createAgentRun({
      agentType: "ORACLE",
      inputContext: { playerId, playerName, source: "api_v1", error: "failed" },
      modelUsed: "claude-sonnet-4-20250514",
      success: false,
      error: message,
      orgId: ctx!.orgId,
    }).catch(() => {});

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
