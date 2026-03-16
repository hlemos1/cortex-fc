import { NextResponse } from "next/server";
import { getAnalyses, createAnalysis, playerExists, clubExists, getPlayerById } from "@/db/queries";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { isValidUUID, isNumberInRange, stripHtmlTags } from "@/lib/validation";
import { inngest } from "@/lib/inngest-client";

const VALID_DECISIONS = [
  "CONTRATAR",
  "BLINDAR",
  "MONITORAR",
  "EMPRESTIMO",
  "RECUSAR",
  "ALERTA_CINZA",
] as const;

export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    const analyses = await getAnalyses(session!.orgId, { limit, offset });
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
    const { session, error } = await requireAuth();
    if (error) return error;

    // RBAC check
    if (!hasPermission(session!.role, "create_analysis")) {
      return NextResponse.json(
        { error: "Sem permissao para criar analises" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "playerId", "clubContextId", "vx", "rx",
      "vxComponents", "rxComponents",
      "c1Technical", "c2Tactical", "c3Physical",
      "c4Behavioral", "c5Narrative", "c6Economic", "c7Ai",
      "decision", "confidence", "reasoning",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate UUIDs
    if (!isValidUUID(body.playerId)) {
      return NextResponse.json({ error: "playerId must be a valid UUID" }, { status: 400 });
    }
    if (!isValidUUID(body.clubContextId)) {
      return NextResponse.json({ error: "clubContextId must be a valid UUID" }, { status: 400 });
    }

    // Validate entities exist
    const [playerOk, clubOk] = await Promise.all([
      playerExists(body.playerId),
      clubExists(body.clubContextId),
    ]);
    if (!playerOk) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    if (!clubOk) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Validate numeric ranges
    if (!isNumberInRange(body.vx, 0, 3)) {
      return NextResponse.json({ error: "vx must be between 0 and 3" }, { status: 400 });
    }
    if (!isNumberInRange(body.rx, 0, 3)) {
      return NextResponse.json({ error: "rx must be between 0 and 3" }, { status: 400 });
    }

    const layerFields = [
      "c1Technical", "c2Tactical", "c3Physical",
      "c4Behavioral", "c5Narrative", "c6Economic", "c7Ai",
    ] as const;
    for (const field of layerFields) {
      if (!isNumberInRange(body[field], 0, 100)) {
        return NextResponse.json(
          { error: `${field} must be between 0 and 100` },
          { status: 400 }
        );
      }
    }

    if (!isNumberInRange(body.confidence, 0, 100)) {
      return NextResponse.json({ error: "confidence must be between 0 and 100" }, { status: 400 });
    }

    // Validate decision enum
    if (!VALID_DECISIONS.includes(body.decision)) {
      return NextResponse.json(
        { error: `decision must be one of: ${VALID_DECISIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Sanitize reasoning
    if (typeof body.reasoning !== "string") {
      return NextResponse.json({ error: "reasoning must be a string" }, { status: 400 });
    }
    const sanitizedReasoning = stripHtmlTags(body.reasoning);
    if (sanitizedReasoning.length === 0 || sanitizedReasoning.length > 5000) {
      return NextResponse.json(
        { error: "reasoning must be 1-5000 characters" },
        { status: 400 }
      );
    }

    const sanitizedBody = {
      playerId: body.playerId,
      clubContextId: body.clubContextId,
      vx: body.vx,
      rx: body.rx,
      vxComponents: body.vxComponents,
      rxComponents: body.rxComponents,
      c1Technical: body.c1Technical,
      c2Tactical: body.c2Tactical,
      c3Physical: body.c3Physical,
      c4Behavioral: body.c4Behavioral,
      c5Narrative: body.c5Narrative,
      c6Economic: body.c6Economic,
      c7Ai: body.c7Ai,
      decision: body.decision,
      confidence: body.confidence,
      reasoning: sanitizedReasoning,
      analystId: session!.userId,
      // Optional algorithm scores
      ...(isNumberInRange(body.ast, 0, 100) ? { ast: body.ast } : {}),
      ...(isNumberInRange(body.clf, 0, 100) ? { clf: body.clf } : {}),
      ...(isNumberInRange(body.gne, 0, 100) ? { gne: body.gne } : {}),
      ...(isNumberInRange(body.wse, 0, 100) ? { wse: body.wse } : {}),
      ...(isNumberInRange(body.rbl, 0, 100) ? { rbl: body.rbl } : {}),
      ...(isNumberInRange(body.sace, 0, 100) ? { sace: body.sace } : {}),
      ...(isNumberInRange(body.scnPlus, 0, 100) ? { scnPlus: body.scnPlus } : {}),
      ...(Array.isArray(body.recommendedActions) ? { recommendedActions: body.recommendedActions } : {}),
      ...(Array.isArray(body.risks) ? { risks: body.risks } : {}),
      ...(Array.isArray(body.comparables) ? { comparables: body.comparables } : {}),
    };

    const analysis = await createAnalysis(sanitizedBody);

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      const player = await getPlayerById(body.playerId);
      await inngest.send({
        name: "cortex/analysis.created",
        data: {
          analysisId: analysis.id,
          playerId: body.playerId,
          orgId: session!.orgId,
          userId: session!.userId,
          playerName: player?.name ?? "Jogador",
        },
      });
    } catch (err) {
      console.error("Failed to send analysis.created event:", err);
    }

    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch (error) {
    console.error("Failed to create analysis:", error);
    return NextResponse.json(
      { error: "Failed to create analysis" },
      { status: 500 }
    );
  }
}
