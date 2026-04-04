/**
 * Email sender — infraestrutura de envio via Resend.
 *
 * Refatorado de email.ts (623 linhas → 3 modulos).
 * Responsabilidade unica: enviar email via API.
 */

const FROM_EMAIL = process.env.EMAIL_FROM ?? "CORTEX FC <noreply@cortex-fc.com>";

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
