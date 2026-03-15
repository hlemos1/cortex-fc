import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getAlertsForOrg } from "@/services/alerts";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const alerts = await getAlertsForOrg(session!.orgId);
    return NextResponse.json({ data: alerts });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
