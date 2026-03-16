import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/components/ui/toast"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cortex-fc.vercel.app"

export const metadata: Metadata = {
  title: {
    default: "CORTEX FC — Neural Football Analytics",
    template: "%s | CORTEX FC",
  },
  description: "Plataforma de inteligencia neural para analise e decisao no futebol profissional. 7 algoritmos proprietarios, 6 agentes de IA, scouting inteligente.",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: baseUrl,
    siteName: "CORTEX FC",
    title: "CORTEX FC — Neural Football Analytics",
    description: "Inteligencia artificial aplicada ao futebol. Analises neurais, scouting, decisoes de transferencia com 7 algoritmos proprietarios.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CORTEX FC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CORTEX FC — Neural Football Analytics",
    description: "IA aplicada ao futebol profissional. Analises neurais, scouting e decisoes de transferencia.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "football analytics", "soccer analytics", "AI football", "scouting platform",
    "transfer decisions", "neural analytics", "player analysis", "football intelligence",
    "analise futebol", "inteligencia artificial futebol", "scouting futebol",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="dns-prefetch" href="https://media.api-sports.io" />
        <link rel="preconnect" href="https://media.api-sports.io" crossOrigin="anonymous" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased subpixel-antialiased`}>
        <SessionProvider>
          <TooltipProvider delayDuration={300}>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </SessionProvider>
              <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
