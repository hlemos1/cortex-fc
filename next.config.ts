import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

// Bundle analyzer — only active when ANALYZE=true
// Install: pnpm add -D @next/bundle-analyzer
const withBundleAnalyzer = process.env.ANALYZE === "true"
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require("@next/bundle-analyzer")({ enabled: true })
  : (config: NextConfig) => config;

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const isProduction = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://media.api-sports.io https://*.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://*.upstash.io https://*.sentry.io wss://*.sentry.io",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
];

const contentSecurityPolicy = cspDirectives.join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel-storage.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "media-*.api-sports.io" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      ],
    },
    {
      source: "/api/football/:path*",
      headers: [
        { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
      ],
    },
    {
      source: "/api/players/search-external",
      headers: [
        { key: "Cache-Control", value: "public, s-maxage=120, stale-while-revalidate=300" },
      ],
    },
  ],
};

const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  hideSourceMaps: true,
};

const baseConfig = withBundleAnalyzer(withSerwist(withNextIntl(nextConfig)));

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(baseConfig, sentryConfig)
  : baseConfig;
