import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserOrgs } from "@/db/queries";

/**
 * Get all organizations the current user belongs to.
 */
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const orgs = await getUserOrgs(session!.userId);
    return NextResponse.json({ data: orgs });
  } catch (error) {
    console.error("Failed to get user orgs:", error);
    return NextResponse.json({ error: "Erro ao buscar organizacoes" }, { status: 500 });
  }
}
