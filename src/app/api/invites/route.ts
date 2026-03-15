import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { createOrgInvite, getOrgInvites } from "@/db/queries";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_team")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const invites = await getOrgInvites(session!.orgId);
    return NextResponse.json({ data: invites });
  } catch (error) {
    console.error("Failed to get invites:", error);
    return NextResponse.json({ error: "Erro ao buscar convites" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "manage_team")) {
      return NextResponse.json({ error: "Sem permissao para gerenciar equipe" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "email e role sao obrigatorios" }, { status: 400 });
    }

    if (!["admin", "analyst", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Role invalido" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await createOrgInvite({
      email: email.toLowerCase().trim(),
      orgId: session!.orgId,
      role,
      token,
      invitedBy: session!.userId,
      expiresAt,
    });

    // Send invite email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app";
    const inviteUrl = `${appUrl}/invite/${token}`;

    await sendEmail({
      to: email,
      subject: "Convite para CORTEX FC",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#09090b;color:#e4e4e7;border-radius:12px;">
          <h1 style="color:#10b981;font-size:24px;margin-bottom:8px;">Convite CORTEX FC</h1>
          <p style="color:#a1a1aa;margin-bottom:24px;">Voce foi convidado para fazer parte de uma equipe no CORTEX FC.</p>
          <p style="color:#a1a1aa;">Cargo: <strong style="color:#fff;">${role}</strong></p>
          <p style="margin-top:24px;">
            <a href="${inviteUrl}"
               style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
              Aceitar Convite
            </a>
          </p>
          <p style="color:#71717a;margin-top:24px;font-size:12px;">
            Este convite expira em 7 dias.
          </p>
          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #27272a;color:#71717a;font-size:12px;">
            <p>CORTEX FC — Neural Football Analytics</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ data: invite });
  } catch (error) {
    console.error("Failed to create invite:", error);
    return NextResponse.json({ error: "Erro ao criar convite" }, { status: 500 });
  }
}
