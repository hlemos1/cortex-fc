import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db/index";
import { reports } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";
import { isValidUUID } from "@/lib/validation";

const SHARE_SECRET = process.env.SHARE_SECRET;
if (!SHARE_SECRET) {
  console.error("[SECURITY] SHARE_SECRET env var is not set. Share links will fail.");
}

function getShareSecret(): string {
  if (!SHARE_SECRET) throw new Error("SHARE_SECRET is not configured");
  return SHARE_SECRET;
}

function generateReportToken(reportId: string, expiresInDays: number = 7): string {
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const payload = `${reportId}:${expiresAt}`;
  const hmac = createHmac("sha256", getShareSecret()).update(payload).digest("hex");
  const data = Buffer.from(JSON.stringify({ r: reportId, e: expiresAt })).toString("base64url");
  return `${data}.${hmac}`;
}

export function verifyReportToken(token: string): { reportId: string } | null {
  try {
    const [dataStr, hmac] = token.split(".");
    if (!dataStr || !hmac) return null;

    const parsed = JSON.parse(Buffer.from(dataStr, "base64url").toString());
    const { r: reportId, e: expiresAt } = parsed;

    // Check expiration
    if (Date.now() > expiresAt) return null;

    // Verify HMAC
    const payload = `${reportId}:${expiresAt}`;
    const expected = createHmac("sha256", getShareSecret()).update(payload).digest("hex");
    if (hmac !== expected) return null;

    return { reportId };
  } catch {
    return null;
  }
}

// POST — generate share link for a report
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { reportId, expiresInDays } = body;

    if (!reportId || !isValidUUID(reportId)) {
      return NextResponse.json({ error: "reportId invalido" }, { status: 400 });
    }

    // Verify report belongs to org
    const report = await db.query.reports.findFirst({
      where: and(
        eq(reports.id, reportId),
        eq(reports.orgId, session!.orgId)
      ),
      columns: { id: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Relatorio nao encontrado" }, { status: 404 });
    }

    // Mark as published
    await db
      .update(reports)
      .set({ isPublished: true, publishedAt: new Date() })
      .where(eq(reports.id, reportId));

    const token = generateReportToken(reportId, expiresInDays ?? 7);
    const url = `${process.env.NEXTAUTH_URL || ""}/reports/view/${token}`;

    return NextResponse.json({ data: { token, url } });
  } catch (error) {
    console.error("Failed to generate share link:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
