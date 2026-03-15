import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getAnalyses, getAnalysisById } from "@/db/queries";

/**
 * GET /api/v1/analyses
 *
 * Query params:
 *   ?id=uuid         - get specific analysis
 *   ?limit=50        - max results (1-100)
 *   ?offset=0        - pagination offset
 */
export async function GET(request: Request) {
  const { ctx, error } = await requireApiAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const analysis = await getAnalysisById(id);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    return NextResponse.json({ data: analysis });
  }

  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50"), 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0"), 0);

  const analyses = await getAnalyses(ctx!.orgId, { limit, offset });

  return NextResponse.json({
    data: analyses,
    meta: { limit, offset, count: analyses.length },
  });
}
