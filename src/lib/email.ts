/**
 * Email service using Resend.
 *
 * Requires RESEND_API_KEY env var.
 * In dev mode (no key), logs emails to console instead of sending.
 */

const FROM_EMAIL = process.env.EMAIL_FROM ?? "CORTEX FC <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email DEV] To: ${to} | Subject: ${subject}`);
    console.log(`[Email DEV] Body preview: ${html.slice(0, 200)}...`);
    return true;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const error = await res.text();
      console.error("[Email] Failed to send:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Error:", err);
    return false;
  }
}

// ============================================
// SHARED LAYOUT
// ============================================

const FOOTER = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;border-top:1px solid #27272a;">
    <tr>
      <td style="padding-top:24px;text-align:center;">
        <p style="margin:0 0 4px;color:#52525b;font-size:12px;font-weight:600;letter-spacing:0.5px;">CORTEX FC</p>
        <p style="margin:0 0 16px;color:#3f3f46;font-size:11px;">Neural Football Analytics</p>
        <p style="margin:0;color:#3f3f46;font-size:11px;">
          <a href="${APP_URL}/settings" style="color:#3f3f46;text-decoration:underline;">Gerenciar notificacoes</a>
          &nbsp;&middot;&nbsp;
          <a href="${APP_URL}/unsubscribe" style="color:#3f3f46;text-decoration:underline;">Cancelar inscricao</a>
        </p>
      </td>
    </tr>
  </table>
`;

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CORTEX FC</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#18181b;border-radius:16px;overflow:hidden;">
          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#10b981 0%,#059669 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:10px;height:10px;background:#10b981;border-radius:50%;"></td>
                  <td style="padding-left:8px;font-size:14px;font-weight:700;color:#e4e4e7;letter-spacing:1px;">CORTEX FC</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:24px 40px 40px 40px;color:#a1a1aa;font-size:14px;line-height:1.6;">
              ${content}
              ${FOOTER}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function ctaButton(label: string, href: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td style="background-color:#10b981;border-radius:8px;">
          <a href="${href}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function featureItem(emoji: string, title: string, description: string): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #27272a;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="width:40px;vertical-align:top;font-size:20px;">${emoji}</td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 2px;color:#e4e4e7;font-size:14px;font-weight:600;">${title}</p>
              <p style="margin:0;color:#71717a;font-size:13px;">${description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Bem-vindo ao CORTEX FC",
    html: wrap(`
      <h1 style="margin:0 0 8px;color:#e4e4e7;font-size:24px;font-weight:700;">
        Bem-vindo, ${name}!
      </h1>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:15px;">
        O CORTEX FC e a plataforma de analytics neural para decisoes de futebol com inteligencia artificial.
      </p>

      <!-- Features -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;background:#09090b;border-radius:12px;padding:4px 16px;">
        ${featureItem(
          "&#x1F9E0;",
          "Analise Neural ORACLE",
          "Motor de IA com 7 algoritmos para avaliar jogadores com precisao."
        )}
        ${featureItem(
          "&#x1F4CA;",
          "Metricas VxRx",
          "Mapeamento de valor (Vx) e risco (Rx) no espaco decisorio."
        )}
        ${featureItem(
          "&#x1F50D;",
          "Scouting Inteligente",
          "Pipeline de alvos com alertas automaticos e comparacoes."
        )}
      </table>

      ${ctaButton("Acessar Plataforma", `${APP_URL}/dashboard`)}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border-radius:8px;padding:16px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0 0 4px;color:#71717a;font-size:12px;">Seu plano atual</p>
            <p style="margin:0;color:#e4e4e7;font-size:14px;font-weight:600;">
              Free — 5 analises/mes, 3 algoritmos, Agente ORACLE
            </p>
            <p style="margin:8px 0 0;font-size:13px;">
              <a href="${APP_URL}/pricing" style="color:#10b981;text-decoration:none;font-weight:500;">
                Desbloquear todos os 7 algoritmos e 6 agentes IA &rarr;
              </a>
            </p>
          </td>
        </tr>
      </table>
    `),
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
  const verifyUrl = `${APP_URL}/api/verify-email?token=${token}`;

  return sendEmail({
    to,
    subject: "Confirme seu email — CORTEX FC",
    html: wrap(`
      <h1 style="margin:0 0 8px;color:#e4e4e7;font-size:22px;font-weight:700;">
        Confirme seu email, ${name}
      </h1>
      <p style="margin:0 0 8px;color:#a1a1aa;font-size:14px;">
        Clique no botao abaixo para ativar sua conta no CORTEX FC.
      </p>
      <p style="margin:0 0 24px;color:#fbbf24;font-size:13px;font-weight:500;">
        &#x26A0;&#xFE0F; Este link expira em 24 horas.
      </p>

      ${ctaButton("Confirmar Email", verifyUrl)}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border-radius:8px;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0;color:#52525b;font-size:12px;">
              Se voce nao criou esta conta, ignore este email.
            </p>
          </td>
        </tr>
      </table>
    `),
  });
}

export async function sendAnalysisCompleteEmail(
  to: string,
  playerName: string,
  decision: string,
  analysisId: string,
  vx?: number,
  rx?: number
): Promise<boolean> {
  const decisionColors: Record<string, string> = {
    CONTRATAR: "#10b981",
    BLINDAR: "#3b82f6",
    MONITORAR: "#eab308",
    EMPRESTIMO: "#8b5cf6",
    RECUSAR: "#ef4444",
    ALERTA_CINZA: "#6b7280",
  };

  const decisionLabels: Record<string, string> = {
    CONTRATAR: "CONTRATAR",
    BLINDAR: "BLINDAR",
    MONITORAR: "MONITORAR",
    EMPRESTIMO: "EMPRESTIMO",
    RECUSAR: "RECUSAR",
    ALERTA_CINZA: "ALERTA CINZA",
  };

  const color = decisionColors[decision] ?? "#a1a1aa";
  const label = decisionLabels[decision] ?? decision;

  const vxRxSection = vx !== undefined && rx !== undefined
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td width="50%" style="padding-right:8px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border-radius:8px;">
              <tr>
                <td style="padding:12px 16px;">
                  <p style="margin:0 0 2px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Valor (Vx)</p>
                  <p style="margin:0;color:#10b981;font-size:20px;font-weight:700;font-family:monospace;">${vx.toFixed(2)}</p>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" style="padding-left:8px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border-radius:8px;">
              <tr>
                <td style="padding:12px 16px;">
                  <p style="margin:0 0 2px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Risco (Rx)</p>
                  <p style="margin:0;color:#ef4444;font-size:20px;font-weight:700;font-family:monospace;">${rx.toFixed(2)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    : "";

  return sendEmail({
    to,
    subject: `Analise Neural Concluida: ${playerName}`,
    html: wrap(`
      <h1 style="margin:0 0 4px;color:#e4e4e7;font-size:22px;font-weight:700;">
        Analise Concluida
      </h1>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;">
        O agente ORACLE finalizou a analise neural do jogador.
      </p>

      <!-- Player Card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border:1px solid #27272a;border-radius:12px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 4px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Jogador</p>
            <p style="margin:0 0 16px;color:#e4e4e7;font-size:18px;font-weight:600;">${playerName}</p>
            <p style="margin:0 0 8px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Decisao</p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:${color};border-radius:6px;padding:6px 16px;">
                  <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">${label}</span>
                </td>
              </tr>
            </table>
            ${vxRxSection}
          </td>
        </tr>
      </table>

      ${ctaButton("Ver Analise Completa", `${APP_URL}/analysis/${analysisId}`)}
    `),
  });
}

export async function sendWeeklyReportEmail(
  to: string,
  userName: string,
  orgName: string,
  _pdfBuffer: Buffer,
  analysesCount?: number,
  topPlayerName?: string
): Promise<boolean> {
  const summaryRows = [];
  if (analysesCount !== undefined) {
    summaryRows.push(`
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #27272a;">
          <p style="margin:0 0 2px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Analises Realizadas</p>
          <p style="margin:0;color:#e4e4e7;font-size:18px;font-weight:700;font-family:monospace;">${analysesCount}</p>
        </td>
      </tr>
    `);
  }
  if (topPlayerName) {
    summaryRows.push(`
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #27272a;">
          <p style="margin:0 0 2px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Destaque da Semana</p>
          <p style="margin:0;color:#10b981;font-size:16px;font-weight:600;">${topPlayerName}</p>
        </td>
      </tr>
    `);
  }

  const summarySection = summaryRows.length > 0
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border:1px solid #27272a;border-radius:12px;margin-bottom:8px;">
        ${summaryRows.join("")}
      </table>
    `
    : "";

  return sendEmail({
    to,
    subject: `Newsletter Semanal — ${orgName}`,
    html: wrap(`
      <h1 style="margin:0 0 4px;color:#e4e4e7;font-size:22px;font-weight:700;">
        Newsletter Semanal
      </h1>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;">
        Ola ${userName}, aqui esta o resumo da semana para <strong style="color:#e4e4e7;">${orgName}</strong>.
      </p>

      ${summarySection}

      <p style="margin:16px 0 0;color:#71717a;font-size:13px;">
        O relatorio completo com todas as analises e metricas esta disponivel no dashboard.
      </p>

      ${ctaButton("Ver Relatorio", `${APP_URL}/reports`)}
    `),
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: "Redefinir Senha — CORTEX FC",
    html: wrap(`
      <h1 style="margin:0 0 8px;color:#e4e4e7;font-size:22px;font-weight:700;">
        Redefinir Senha
      </h1>
      <p style="margin:0 0 8px;color:#a1a1aa;font-size:14px;">
        Voce solicitou a redefinicao da sua senha no CORTEX FC.
        Clique no botao abaixo para criar uma nova senha.
      </p>
      <p style="margin:0 0 8px;color:#fbbf24;font-size:13px;font-weight:500;">
        &#x26A0;&#xFE0F; Este link expira em 1 hora.
      </p>

      ${ctaButton("Redefinir Senha", resetUrl)}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border-radius:8px;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0;color:#52525b;font-size:12px;">
              Se voce nao solicitou esta redefinicao, ignore este email.
              Sua senha permanecera inalterada.
            </p>
          </td>
        </tr>
      </table>
    `),
  });
}

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  orgName: string,
  role: string,
  token: string
): Promise<boolean> {
  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    analyst: "Analista",
    scout: "Scout",
    viewer: "Visualizador",
  };

  const roleLabel = roleLabels[role] ?? role;

  return sendEmail({
    to,
    subject: `Convite para ${orgName} — CORTEX FC`,
    html: wrap(`
      <h1 style="margin:0 0 8px;color:#e4e4e7;font-size:22px;font-weight:700;">
        Voce foi convidado!
      </h1>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;">
        <strong style="color:#e4e4e7;">${inviterName}</strong> convidou voce para participar da organizacao
        <strong style="color:#e4e4e7;">${orgName}</strong> no CORTEX FC.
      </p>

      <!-- Invite details -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border:1px solid #27272a;border-radius:12px;margin-bottom:8px;">
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
            <p style="margin:0 0 2px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Organizacao</p>
            <p style="margin:0;color:#e4e4e7;font-size:15px;font-weight:600;">${orgName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;border-bottom:1px solid #27272a;">
            <p style="margin:0 0 2px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Convidado por</p>
            <p style="margin:0;color:#e4e4e7;font-size:15px;">${inviterName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 2px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Funcao</p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:4px;padding:3px 10px;">
                  <span style="color:#ffffff;font-size:12px;font-weight:600;">${roleLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${ctaButton("Aceitar Convite", `${APP_URL}/invite/${token}`)}

      <p style="margin:0;color:#52525b;font-size:12px;">
        Este convite expira em 7 dias. Se voce nao esperava este email, pode ignora-lo.
      </p>
    `),
  });
}

export async function sendScheduledReportEmail(
  to: string,
  reportTitle: string,
  reportType: string,
  viewUrl: string,
  orgName: string,
): Promise<boolean> {
  const typeLabels: Record<string, { label: string; color: string }> = {
    player_report: { label: "Parecer de Jogador", color: "#10b981" },
    squad_analysis: { label: "Analise de Elenco", color: "#3b82f6" },
    scouting_report: { label: "Relatorio de Scouting", color: "#8b5cf6" },
    weekly_newsletter: { label: "Newsletter Semanal", color: "#eab308" },
  };

  const badge = typeLabels[reportType] ?? { label: reportType, color: "#a1a1aa" };

  return sendEmail({
    to,
    subject: `Relatorio Agendado: ${reportTitle} — ${orgName}`,
    html: wrap(`
      <h1 style="margin:0 0 4px;color:#e4e4e7;font-size:22px;font-weight:700;">
        Relatorio Agendado Disponivel
      </h1>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;">
        Um relatorio agendado de <strong style="color:#e4e4e7;">${orgName}</strong> foi gerado automaticamente.
      </p>

      <!-- Report Card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border:1px solid #27272a;border-radius:12px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 4px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Titulo</p>
            <p style="margin:0 0 16px;color:#e4e4e7;font-size:18px;font-weight:600;">${reportTitle}</p>
            <p style="margin:0 0 8px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Tipo</p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:${badge.color};border-radius:6px;padding:6px 16px;">
                  <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">${badge.label}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${ctaButton("Ver Relatorio", viewUrl)}

      <p style="margin:0;color:#52525b;font-size:12px;">
        Este relatorio foi gerado automaticamente com base nos seus agendamentos.
        Gerencie seus agendamentos nas configuracoes de relatorios.
      </p>
    `),
  });
}

export async function sendTrialReminderEmail(
  to: string,
  name: string,
  daysLeft: number
): Promise<boolean> {
  const urgency = daysLeft <= 1 ? "#ef4444" : daysLeft <= 3 ? "#fbbf24" : "#a1a1aa";
  const daysText = daysLeft === 1 ? "1 dia" : `${daysLeft} dias`;

  return sendEmail({
    to,
    subject: `Seu trial expira em ${daysText} — CORTEX FC`,
    html: wrap(`
      <h1 style="margin:0 0 8px;color:#e4e4e7;font-size:22px;font-weight:700;">
        ${name}, seu trial esta acabando
      </h1>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;">
        Faltam <strong style="color:${urgency};font-size:16px;">${daysText}</strong> para o fim do seu periodo de testes.
      </p>

      <!-- What you'll lose -->
      <p style="margin:0 0 12px;color:#e4e4e7;font-size:14px;font-weight:600;">
        Funcionalidades que serao desativadas:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;border:1px solid #27272a;border-radius:12px;margin-bottom:8px;">
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #27272a;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color:#ef4444;font-size:14px;padding-right:10px;">&#x2716;</td>
                <td style="color:#a1a1aa;font-size:13px;">Analises neurais ilimitadas (volta para 5/mes)</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #27272a;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color:#ef4444;font-size:14px;padding-right:10px;">&#x2716;</td>
                <td style="color:#a1a1aa;font-size:13px;">Algoritmos avancados (AST+, CLF Pro, RSI, DTR)</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #27272a;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color:#ef4444;font-size:14px;padding-right:10px;">&#x2716;</td>
                <td style="color:#a1a1aa;font-size:13px;">Agentes IA especializados (SCOUT, ANALYST, COACH)</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color:#ef4444;font-size:14px;padding-right:10px;">&#x2716;</td>
                <td style="color:#a1a1aa;font-size:13px;">Exportacao de relatorios em PDF</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${ctaButton("Fazer Upgrade", `${APP_URL}/pricing`)}

      <p style="margin:0;color:#52525b;font-size:12px;">
        Duvidas? Responda este email ou acesse nosso suporte.
      </p>
    `),
  });
}
