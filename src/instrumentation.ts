/**
 * Next.js instrumentation file.
 *
 * Initializes Sentry on app startup (server-side).
 * Requires NEXT_PUBLIC_SENTRY_DSN env var.
 */

export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
      debug: false,
      integrations: [
        Sentry.captureConsoleIntegration({ levels: ["error"] }),
      ],
    });
  }
}

export const onRequestError = async (
  error: Error,
  request: { method: string; url: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string }
) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      extra: {
        method: request.method,
        url: request.url,
        routePath: context.routePath,
        routeType: context.routeType,
      },
    });
  }
};
