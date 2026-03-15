import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db/index";
import { scoutingTargets, players, clubs, neuralAnalyses } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { createHmac } from "crypto";

const SHARE_SECRET = process.env.SHARE_SECRET;
if (!SHARE_SECRET) {
  console.error("[SECURITY] SHARE_SECRET env var is not set. Share links will fail.");
}

function getShareSecret(): string {
  if (!SHARE_SECRET) throw new Error("SHARE_SECRET is not configured");
  return SHARE_SECRET;
}

function generateShareToken(orgId: string, targetIds: string[]): string {
  const payload = `${orgId}:${targetIds.sort().join(",")}:${Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7))}`;
  const hmac = createHmac("sha256", getShareSecret()).update(payload).digest("hex");
  const data = Buffer.from(JSON.stringify({ o: orgId, t: targetIds })).toString("base64url");
  return `${data}.${hmac}`;
}

export function verifyShareToken(token: string): { orgId: string; targetIds: string[] } | null {
  try {
    const [dataStr, hmac] = token.split(".");
    if (!dataStr || !hmac) return null;

    const parsed = JSON.parse(Buffer.from(dataStr, "base64url").toString());
    const { o: orgId, t: targetIds } = parsed;

    // Check HMAC (valid for current week)
    const payload = `${orgId}:${targetIds.sort().join(",")}:${Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7))}`;
    const expected = createHmac("sha256", getShareSecret()).update(payload).digest("hex");

    if (hmac !== expected) {
      // Check previous week too
      const prevPayload = `${orgId}:${targetIds.sort().join(",")}:${Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) - 1}`;
      const prevExpected = createHmac("sha256", getShareSecret()).update(prevPayload).digest("hex");
      if (hmac !== prevExpected) return null;
    }

    return { orgId, targetIds };
  } catch {
    return null;
  }
}

// POST — generate a share link for selected targets
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { targetIds } = body;

    if (!Array.isArray(targetIds) || targetIds.length === 0 || targetIds.length > 20) {
      return NextResponse.json({ error: "Selecione 1-20 alvos" }, { status: 400 });
    }

    const token = generateShareToken(session!.orgId, targetIds);
    const url = `${process.env.NEXTAUTH_URL || ""}/scouting/share/${token}`;

    return NextResponse.json({ data: { token, url } });
  } catch (error) {
    console.error("Failed to generate share link:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
