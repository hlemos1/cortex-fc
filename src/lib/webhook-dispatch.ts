/**
 * Webhook dispatcher.
 *
 * Sends signed payloads to registered webhook endpoints.
 * Uses HMAC-SHA256 for signature verification.
 */

import crypto from "crypto";
import { getActiveWebhooksForEvent } from "@/db/queries";

export async function dispatchWebhook(
  orgId: string,
  event: string,
  data: Record<string, unknown>
) {
  const hooks = await getActiveWebhooksForEvent(orgId, event);
  if (hooks.length === 0) return;

  const payload = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });

  await Promise.allSettled(
    hooks.map(async (hook) => {
      const signature = crypto
        .createHmac("sha256", hook.secret)
        .update(payload)
        .digest("hex");

      try {
        const res = await fetch(hook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Cortex-Signature": `sha256=${signature}`,
            "X-Cortex-Event": event,
          },
          body: payload,
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          console.error(
            `[Webhook] ${hook.url} responded ${res.status} for event ${event}`
          );
        }
      } catch (err) {
        console.error(`[Webhook] Failed to deliver to ${hook.url}:`, err);
      }
    })
  );
}
