import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { canUseFeature } from "@/lib/feature-gates";
import { getPlayers, getAnalyses, getAgentRuns } from "@/db/queries";
import { audit } from "@/lib/audit";

/**
 * GET /api/export?type=players|analyses|agent_runs&format=csv|json
 */
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_billing")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    if (!canUseFeature(session!.tier, "apiAccess")) {
      return NextResponse.json(
        { error: "Export requires club_professional tier or higher" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "players";
    const format = url.searchParams.get("format") || "csv";

    let data: Record<string, unknown>[];
    let filename: string;

    switch (type) {
      case "analyses": {
        const analyses = await getAnalyses(session!.orgId, { limit: 5000 });
        data = analyses.map((a) => ({
          id: a.id,
          player: a.player?.name ?? "",
          club: a.clubContext?.name ?? "",
          scnPlus: a.scnPlus,
          decision: a.decision,
          confidence: a.confidence,
          vx: a.vx,
          rx: a.rx,
          createdAt: a.createdAt,
        }));
        filename = "cortex-analyses";
        break;
      }
      case "agent_runs": {
        const runs = await getAgentRuns(session!.orgId, { limit: 5000 });
        data = runs.map((r) => ({
          id: r.id,
          agentType: r.agentType,
          modelUsed: r.modelUsed,
          tokensUsed: r.tokensUsed,
          durationMs: r.durationMs,
          success: r.success,
          error: r.error,
          createdAt: r.createdAt,
        }));
        filename = "cortex-agent-runs";
        break;
      }
      default: {
        const players = await getPlayers({ limit: 5000 });
        data = players.map((p) => ({
          id: p.id,
          name: p.name,
          nationality: p.nationality,
          position: p.positionCluster,
          club: p.currentClub?.name ?? "",
          marketValue: p.marketValue,
          age: p.age,
          contractUntil: p.contractUntil,
          latestSCN: p.latestAnalysis?.scnPlus ?? null,
          latestDecision: p.latestAnalysis?.decision ?? null,
        }));
        filename = "cortex-players";
        break;
      }
    }

    audit({
      orgId: session!.orgId,
      userId: session!.userId,
      action: "data.exported",
      entityType: type,
      metadata: { format, count: data.length },
      request,
    });

    if (format === "json") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    // CSV
    if (data.length === 0) {
      return new NextResponse("", {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ];

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Erro ao exportar dados" }, { status: 500 });
  }
}
