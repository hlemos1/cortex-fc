import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { getAnalysisById, getAnalyses } from "@/db/queries";
import { toAnalysisUI } from "@/lib/db-transforms";
import {
  generatePlayerReportPDF,
  generateSquadAnalysisPDF,
  generateScoutingReportPDF,
  generateWeeklyNewsletterPDF,
} from "@/lib/pdf-generator";
import { db } from "@/db/index";
import { reports } from "@/db/schema";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "create_analysis")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const body = await request.json();
    const { template, analysisId, analysisIds, title } = body;

    if (!template) {
      return NextResponse.json({ error: "template obrigatorio" }, { status: 400 });
    }

    // Get org name for branding
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, session!.orgId),
      columns: { name: true, logoUrl: true },
    });
    const orgName = org?.name ?? "CORTEX FC";

    let pdfBuffer: Buffer;
    let reportTitle: string;

    switch (template) {
      case "player_report": {
        if (!analysisId) {
          return NextResponse.json({ error: "analysisId obrigatorio para player_report" }, { status: 400 });
        }
        const dbAnalysis = await getAnalysisById(analysisId);
        if (!dbAnalysis) {
          return NextResponse.json({ error: "Analise nao encontrada" }, { status: 404 });
        }
        const analysis = toAnalysisUI(dbAnalysis);
        pdfBuffer = await generatePlayerReportPDF(analysis, orgName);
        reportTitle = `Parecer ORACLE — ${analysis.player?.name ?? "Jogador"}`;
        break;
      }

      case "squad_analysis": {
        const dbAnalyses = await getAnalyses(session!.orgId, { limit: 50 });
        const analyses = dbAnalyses.map(toAnalysisUI);
        pdfBuffer = await generateSquadAnalysisPDF(analyses, orgName, title);
        reportTitle = title ?? "Analise de Elenco";
        break;
      }

      case "scouting_report": {
        if (!analysisIds || !Array.isArray(analysisIds)) {
          return NextResponse.json({ error: "analysisIds obrigatorio para scouting_report" }, { status: 400 });
        }
        const scoutAnalyses = await Promise.all(
          analysisIds.slice(0, 20).map((id: string) => getAnalysisById(id))
        );
        const validAnalyses = scoutAnalyses.filter(Boolean).map(toAnalysisUI);
        pdfBuffer = await generateScoutingReportPDF(validAnalyses, orgName);
        reportTitle = title ?? "Relatorio de Scouting";
        break;
      }

      case "weekly_newsletter": {
        const recentAnalyses = await getAnalyses(session!.orgId, { limit: 10 });
        const analyses = recentAnalyses.map(toAnalysisUI);
        pdfBuffer = await generateWeeklyNewsletterPDF(analyses, orgName);
        reportTitle = `Newsletter Semanal — ${new Date().toLocaleDateString("pt-BR")}`;
        break;
      }

      default:
        return NextResponse.json({ error: "Template invalido" }, { status: 400 });
    }

    // Save report record
    const [report] = await db
      .insert(reports)
      .values({
        title: reportTitle,
        type: template,
        orgId: session!.orgId,
        content: { template, analysisId, analysisIds },
        isPublished: false,
        createdBy: session!.userId,
      })
      .returning();

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportTitle.replace(/[^a-zA-Z0-9-_ ]/g, "")}.pdf"`,
        "X-Report-Id": report.id,
      },
    });
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json({ error: "Erro ao gerar relatorio" }, { status: 500 });
  }
}
