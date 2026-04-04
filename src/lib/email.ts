/**
 * Email module — barrel re-export.
 *
 * Refatorado de 623 linhas monoliticas para 3 modulos:
 * - email-sender.ts (infraestrutura de envio)
 * - email-layout.ts (HTML shared components)
 * - email-templates.ts (templates de cada tipo de email)
 *
 * Este arquivo mantem compatibilidade: qualquer import de "@/lib/email"
 * continua funcionando sem mudanca nos chamadores.
 *
 * Refatoracao Fowler: Extract Module (sem mudanca de comportamento).
 */

export { sendEmail } from "./email-sender";
export { wrap, ctaButton, featureItem } from "./email-layout";
export {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendAnalysisCompleteEmail,
  sendWeeklyReportEmail,
  sendPasswordResetEmail,
  sendInviteEmail,
  sendScheduledReportEmail,
  sendTrialReminderEmail,
} from "./email-templates";
