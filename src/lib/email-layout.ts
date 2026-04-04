/**
 * Email layout — HTML shared components.
 *
 * Refatorado de email.ts (623 linhas → 3 modulos).
 * Responsabilidade unica: estrutura visual dos emails.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app";

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

export function wrap(content: string): string {
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

export function ctaButton(label: string, href: string): string {
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

export function featureItem(emoji: string, title: string, description: string): string {
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

export { APP_URL };
