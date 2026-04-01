import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { scoutingTargets, players, clubs, neuralAnalyses } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-helpers";
import { isValidUUID } from "@/lib/validation";
import { hasPermission } from "@/lib/rbac";
import { inngest } from "@/lib/inngest-client";
import { invalidateOnMutation } from "@/lib/cache";
import { checkUsageLimit } from "@/lib/feature-gates";
import { analyzeInput } from "@/lib/request-sanitizer";
import { parseBody, scoutingCreateSchema } from "@/lib/api-schemas";

// GET — list scouting targets for the org
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const orgId = session!.orgId;

    const targets = await db
      .select({
        id: scoutingTargets.id,
        priority: scoutingTargets.priority,
        status: scoutingTargets.status,
        notes: scoutingTargets.notes,
        targetPrice: scoutingTargets.targetPrice,
        createdAt: scoutingTargets.createdAt,
        updatedAt: scoutingTargets.updatedAt,
        playerId: scoutingTargets.playerId,
        playerName: players.name,
        playerAge: players.age,
        playerNationality: players.nationality,
        playerPosition: players.positionDetail,
        playerCluster: players.positionCluster,
        playerMarketValue: players.marketValue,
        playerPhoto: players.photoUrl,
        clubName: clubs.name,
      })
      .from(scoutingTargets)
      .innerJoin(players, eq(scoutingTargets.playerId, players.id))
      .leftJoin(clubs, eq(players.currentClubId, clubs.id))
      .where(eq(scoutingTargets.orgId, orgId))
      .orderBy(desc(scoutingTargets.updatedAt));

    // Attach latest analysis for each target
    const playerIds = [...new Set(targets.map((t) => t.playerId))];
    const analysisMap = new Map<string, { vx: number; rx: number; scnPlus: number | null; decision: string; confidence: number }>();

    if (playerIds.length > 0) {
      for (const pid of playerIds) {
        const analysis = await db.query.neuralAnalyses.findFirst({
          where: eq(neuralAnalyses.playerId, pid),
          orderBy: [desc(neuralAnalyses.createdAt)],
          columns: {
            vx: true,
            rx: true,
            scnPlus: true,
            decision: true,
            confidence: true,
          },
        });
        if (analysis) {
          analysisMap.set(pid, analysis);
        }
      }
    }

    const data = targets.map((t) => {
      const analysis = analysisMap.get(t.playerId);
      return {
        ...t,
        analysis: analysis ?? null,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to fetch scouting targets:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST — add a new scouting target
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "create_analysis")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    // Scouting quota check
    const currentTargets = await db
      .select({ count: sql<number>`count(*)` })
      .from(scoutingTargets)
      .where(eq(scoutingTargets.orgId, session!.orgId));
    const currentCount = Number(currentTargets[0]?.count ?? 0);
    const scoutingQuota = checkUsageLimit(session!.tier, "scoutingTargets", currentCount);
    if (!scoutingQuota.allowed) {
      return NextResponse.json(
        { error: "Limite de alvos de scouting atingido. Faca upgrade para continuar.", usage: currentCount, limit: scoutingQuota.limit },
        { status: 429 }
      );
    }

    const { data: body, error: parseError } = await parseBody(request, scoutingCreateSchema);
    if (parseError) return parseError;
    const { playerId, priority, notes, targetPrice } = body;

    if (!playerId || !isValidUUID(playerId)) {
      return NextResponse.json({ error: "playerId invalido" }, { status: 400 });
    }

    // Check player exists
    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
      columns: { id: true, name: true },
    });
    if (!player) {
      return NextResponse.json({ error: "Jogador nao encontrado" }, { status: 404 });
    }

    // Sanitize notes if provided
    if (notes && typeof notes === "string") {
      const notesCheck = analyzeInput(notes);
      if (!notesCheck.clean) {
        return NextResponse.json({ error: "Entrada invalida detectada" }, { status: 400 });
      }
    }

    // Check if already tracked
    const existing = await db.query.scoutingTargets.findFirst({
      where: sql`${scoutingTargets.playerId} = ${playerId} AND ${scoutingTargets.orgId} = ${session!.orgId}`,
    });
    if (existing) {
      return NextResponse.json({ error: "Jogador ja esta no pipeline" }, { status: 409 });
    }

    const [inserted] = await db
      .insert(scoutingTargets)
      .values({
        playerId,
        orgId: session!.orgId,
        priority: priority ?? "medium",
        status: "watching",
        notes: notes ?? null,
        targetPrice: targetPrice ?? null,
        addedBy: session!.userId,
      })
      .returning();

    // Emit event for background processing (notifications, cache invalidation, webhooks)
    try {
      await inngest.send({
        name: "cortex/scouting.target.added",
        data: {
          targetId: inserted.id,
          orgId: session!.orgId,
          userId: session!.userId,
          playerName: player!.name,
        },
      });
    } catch (err) {
      console.error("Failed to send scouting.target.added event:", err);
    }

    // Invalidate related caches
    await invalidateOnMutation("scouting.created", session!.orgId);

    return NextResponse.json({ data: inserted }, { status: 201 });
  } catch (error) {
    console.error("Failed to create scouting target:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
