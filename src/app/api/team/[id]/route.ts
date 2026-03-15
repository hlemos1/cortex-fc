import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { updateOrgMemberRole, removeOrgMember } from "@/db/queries";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_team")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    if (!role || !["admin", "analyst", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Role invalido" }, { status: 400 });
    }

    const updated = await updateOrgMemberRole(id, role, session!.orgId);
    if (!updated) {
      return NextResponse.json({ error: "Membro nao encontrado" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update member:", error);
    return NextResponse.json({ error: "Erro ao atualizar membro" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_team")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const { id } = await params;
    await removeOrgMember(id, session!.orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove member:", error);
    return NextResponse.json({ error: "Erro ao remover membro" }, { status: 500 });
  }
}
