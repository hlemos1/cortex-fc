import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { hasPermission } from "@/lib/rbac"
import { inngest } from "@/lib/inngest-client"

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  if (!hasPermission(session!.role, "create_analysis")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { analysisIds, template } = body

  if (!analysisIds?.length || !template) {
    return NextResponse.json(
      { error: "analysisIds and template are required" },
      { status: 400 }
    )
  }

  if (analysisIds.length > 50) {
    return NextResponse.json(
      { error: "Maximum 50 analyses per batch" },
      { status: 400 }
    )
  }

  // Create a batch job ID
  const batchId = crypto.randomUUID()

  if (template === "player_report") {
    // Individual reports for each player
    const events = analysisIds.map((analysisId: string) => ({
      name: "report/generate.requested" as const,
      data: {
        reportType: "player_report",
        orgId: session!.orgId,
        userId: session!.userId,
        params: {
          analysisId,
          batchId,
          title: "Relatorio Individual",
        },
      },
    }))
    await inngest.send(events)
  } else {
    // Single report with all analyses
    await inngest.send({
      name: "report/generate.requested",
      data: {
        reportType: template,
        orgId: session!.orgId,
        userId: session!.userId,
        params: {
          analysisIds,
          batchId,
          title: `Relatorio em Lote — ${new Date().toLocaleDateString("pt-BR")}`,
        },
      },
    })
  }

  return NextResponse.json(
    {
      batchId,
      count: template === "player_report" ? analysisIds.length : 1,
      message: `Geracao de ${template === "player_report" ? analysisIds.length + " relatorios" : "1 relatorio"} iniciada`,
    },
    { status: 202 }
  )
}
