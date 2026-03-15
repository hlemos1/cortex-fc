/**
 * Email service using Resend.
 *
 * Requires RESEND_API_KEY env var.
 * In dev mode (no key), logs emails to console instead of sending.
 */

const FROM_EMAIL = process.env.EMAIL_FROM ?? "CORTEX FC <noreply@cortexfc.com>";

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
    });

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
// EMAIL TEMPLATES
// ============================================

const FOOTER = `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #27272a;color:#71717a;font-size:12px;">
    <p>CORTEX FC — Neural Football Analytics</p>
    <p>Este email foi enviado automaticamente. Nao responda.</p>
  </div>
`;

function wrap(content: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#09090b;color:#e4e4e7;border-radius:12px;">
      ${content}
      ${FOOTER}
    </div>
  `;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Bem-vindo ao CORTEX FC",
    html: wrap(`
      <h1 style="color:#10b981;font-size:24px;margin-bottom:8px;">Bem-vindo, ${name}!</h1>
      <p style="color:#a1a1aa;margin-bottom:24px;">Sua conta no CORTEX FC foi criada com sucesso.</p>
      <p>Voce agora tem acesso ao plano <strong style="color:#fff;">Free</strong> com:</p>
      <ul style="color:#a1a1aa;padding-left:20px;margin:16px 0;">
        <li>5 analises neurais por mes</li>
        <li>3 algoritmos (SCN+, AST, CLF)</li>
        <li>Agente ORACLE</li>
      </ul>
      <p style="margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app"}/dashboard"
           style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Acessar Dashboard
        </a>
      </p>
      <p style="color:#71717a;margin-top:24px;font-size:13px;">
        Quer desbloquear todos os 7 algoritmos e 6 agentes IA?
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app"}/pricing" style="color:#10b981;">Veja nossos planos</a>
      </p>
    `),
  });
}

export async function sendAnalysisCompleteEmail(
  to: string,
  playerName: string,
  decision: string,
  analysisId: string
): Promise<boolean> {
  const decisionColors: Record<string, string> = {
    CONTRATAR: "#10b981",
    BLINDAR: "#3b82f6",
    MONITORAR: "#eab308",
    EMPRESTIMO: "#8b5cf6",
    RECUSAR: "#ef4444",
    ALERTA_CINZA: "#6b7280",
  };

  const color = decisionColors[decision] ?? "#a1a1aa";

  return sendEmail({
    to,
    subject: `Analise Neural Concluida: ${playerName}`,
    html: wrap(`
      <h1 style="color:#fff;font-size:20px;margin-bottom:4px;">Analise Concluida</h1>
      <p style="color:#a1a1aa;margin-bottom:24px;">O agente ORACLE finalizou a analise neural.</p>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#a1a1aa;font-size:13px;margin:0 0 4px;">Jogador</p>
        <p style="color:#fff;font-size:18px;font-weight:600;margin:0 0 16px;">${playerName}</p>
        <p style="color:#a1a1aa;font-size:13px;margin:0 0 4px;">Decisao</p>
        <p style="color:${color};font-size:16px;font-weight:700;margin:0;">${decision}</p>
      </div>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app"}/analysis/${analysisId}"
           style="display:inline-block;padding:10px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;">
          Ver Analise Completa
        </a>
      </p>
    `),
  });
}

export async function sendWeeklyReportEmail(
  to: string,
  userName: string,
  orgName: string,
  _pdfBuffer: Buffer
): Promise<boolean> {
  // Note: Resend supports attachments but requires base64 encoding.
  // For now we send a link-based email. PDF attachment support can be added
  // when Resend SDK is installed.
  return sendEmail({
    to,
    subject: `Newsletter Semanal — ${orgName}`,
    html: wrap(`
      <h1 style="color:#fff;font-size:20px;margin-bottom:4px;">Newsletter Semanal</h1>
      <p style="color:#a1a1aa;margin-bottom:24px;">Ola ${userName}, aqui esta o resumo da semana para ${orgName}.</p>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#a1a1aa;font-size:13px;margin:0 0 8px;">Seu relatorio semanal com as analises mais recentes esta disponivel no dashboard.</p>
      </div>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app"}/reports"
           style="display:inline-block;padding:10px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;">
          Ver Relatorios
        </a>
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app"}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: "Redefinir Senha — CORTEX FC",
    html: wrap(`
      <h1 style="color:#fff;font-size:20px;margin-bottom:8px;">Redefinir Senha</h1>
      <p style="color:#a1a1aa;margin-bottom:24px;">
        Voce solicitou a redefinicao da sua senha. Clique no botao abaixo para criar uma nova senha.
        Este link expira em 1 hora.
      </p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Redefinir Senha
        </a>
      </p>
      <p style="color:#71717a;margin-top:24px;font-size:12px;">
        Se voce nao solicitou esta redefinicao, ignore este email.
      </p>
    `),
  });
}
