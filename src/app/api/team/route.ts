import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { getOrgMembers } from "@/db/queries";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_team")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const members = await getOrgMembers(session!.orgId);
    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("Failed to get team:", error);
    return NextResponse.json({ error: "Erro ao buscar equipe" }, { status: 500 });
  }
}
