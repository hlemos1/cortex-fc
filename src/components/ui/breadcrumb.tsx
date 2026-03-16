"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  players: "Jogadores",
  analysis: "Analises",
  scouting: "Scouting",
  reports: "Relatorios",
  chat: "Chat IA",
  simulator: "Simulador",
  "agent-console": "Console IA",
  holding: "Holding",
  "audit-log": "Audit Log",
  billing: "Assinatura",
  settings: "Configuracoes",
  new: "Nova",
  compare: "Comparar",
  team: "Equipe",
  enterprise: "Enterprise",
  explore: "Explorar",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Don't show breadcrumb on root dashboard
  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const isLast = i === segments.length - 1
    // Check if segment is a UUID (dynamic route)
    const isUuid = /^[0-9a-f-]{20,}$/.test(segment)
    const label = isUuid ? "Detalhe" : (ROUTE_LABELS[segment] ?? segment)

    return { href, label, isLast }
  })

  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-600 mb-4 animate-fade-in">
      <Link
        href="/dashboard"
        className="hover:text-zinc-400 transition-colors flex items-center gap-1"
      >
        <Home className="w-3 h-3" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-zinc-700" />
          {crumb.isLast ? (
            <span className="text-zinc-400 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-zinc-400 transition-colors hover:underline underline-offset-2"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
