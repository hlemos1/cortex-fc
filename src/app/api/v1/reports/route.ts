import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { db } from "@/db/index";
import { reports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/v1/reports
 *
 * Query params:
 *   ?id=uuid         - get specific report
 *   ?limit=20        - max results (1-50)
 *   ?offset=0        - pagination offset
 */
export async function GET(request: Request) {
  const { ctx, error } = await requireApiAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, id),
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ data: report });
  }

  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20"), 1), 50);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0"), 0);

  const orgReports = await db.query.reports.findMany({
    where: eq(reports.orgId, ctx!.orgId),
    orderBy: [desc(reports.createdAt)],
    limit,
    offset,
  });

  return NextResponse.json({
    data: orgReports,
    meta: { limit, offset, count: orgReports.length },
  });
}
