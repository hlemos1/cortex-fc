"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Brain,
  LayoutDashboard,
  Users,
  Activity,
  Search,
  FileText,
  Settings,
  CreditCard,
  Monitor,
  Building2,
  Shield,
  MessageSquare,
  ArrowRightLeft,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OrgSwitcher } from "@/components/cortex/OrgSwitcher"
import { NotificationsDropdown } from "@/components/cortex/NotificationsDropdown"
import { BottomNav } from "@/components/layout/bottom-nav"
import { CommandPalette } from "@/components/ui/command-palette"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { KeyboardShortcutsOverlay } from "@/components/cortex/KeyboardShortcutsOverlay"
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItemDefs = [
  { href: "/dashboard", key: "dashboard" as const, icon: LayoutDashboard, prefetch: true },
  { href: "/players", key: "players" as const, icon: Users, prefetch: true },
  { href: "/analysis", key: "analysis" as const, icon: Activity, prefetch: true },
  { href: "/scouting", key: "scouting" as const, icon: Search, prefetch: true },
  { href: "/reports", key: "reports" as const, icon: FileText, prefetch: true },
  { href: "/chat", key: "chat" as const, icon: MessageSquare, prefetch: false },
  { href: "/simulator", key: "simulator" as const, icon: ArrowRightLeft, prefetch: false },
  { href: "/analytics", key: "analytics" as const, icon: BarChart3, prefetch: false },
  { href: "/notifications", key: "notifications" as const, icon: Bell, prefetch: false },
  { href: "/agent-console", key: "agentConsole" as const, icon: Monitor, prefetch: false },
  { href: "/holding", key: "holding" as const, icon: Building2, prefetch: false },
  { href: "/audit-log", key: "auditLog" as const, icon: Shield, prefetch: false },
  { href: "/billing", key: "billing" as const, icon: CreditCard, prefetch: false },
  { href: "/settings", key: "settings" as const, icon: Settings, prefetch: false },
]

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const t = useTranslations("nav")
  const tc = useTranslations("common")

  const toggleShortcuts = useCallback(() => setShortcutsOpen((prev) => !prev), [])
  useGlobalShortcuts(toggleShortcuts)

  const navItems = navItemDefs.map((item) => ({
    ...item,
    label: t(item.key),
  }))

  const sidebarContent = (
    <>
      {/* Subtle gradient overlay at top */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/[0.03] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className={cn(
        "relative flex items-center h-16 border-b border-zinc-800/60 px-4",
        collapsed && !mobileOpen ? "justify-center" : "gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 animate-pulse-glow">
          <Brain className="w-5 h-5 text-emerald-400" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div>
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight">CORTEX FC</h1>
            <p className="text-xs text-zinc-500 font-mono tracking-widest">NEURAL ANALYTICS</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Menu principal" data-tour="sidebar-nav" className="relative flex-1 py-4 px-2 space-y-1">
        {navItems.map((item, index) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          const Icon = item.icon

          // Add separator before Settings
          const showSeparator = item.href === "/billing"

          const linkContent = (
            <Link
              href={item.href}
              prefetch={item.prefetch}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                (collapsed && !mobileOpen) && "justify-center px-2"
              )}
            >
              {/* Active left border indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400" />
              )}
              <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-emerald-400")} />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </Link>
          )

          return (
            <div key={item.href}>
              {showSeparator && (
                <div className="mx-3 my-3 border-t border-zinc-800/60" />
              )}
              {collapsed && !mobileOpen ? (
                <Tooltip>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-zinc-700">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                linkContent
              )}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="relative hidden md:block border-t border-zinc-800/60 p-2"
        style={{ borderImage: "linear-gradient(90deg, transparent, rgba(16,185,129,0.15), transparent) 1" }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all duration-200"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform duration-300",
            collapsed && "rotate-180"
          )} />
          {!collapsed && <span className="ml-2 text-xs">{tc("collapse")}</span>}
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Skip navigation link — WCAG 2.1 AA */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Pular para conteudo principal
      </a>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "relative hidden md:flex flex-col border-r border-zinc-800/60 bg-[#0c0c0f] transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-zinc-800/60 bg-[#0c0c0f] transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar — glassmorphism */}
        <header className="relative h-16 border-b border-zinc-800/60 glass-strong flex items-center justify-between px-6">
          {/* Subtle bottom border gradient */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden text-zinc-500 hover:text-zinc-300"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="text-xs text-zinc-500 font-mono">v2.1.0</span>
            <span className="text-zinc-800">|</span>
            <OrgSwitcher
              currentOrgId={session?.user?.orgId ?? ""}
              currentOrgName={session?.user?.orgName ?? tc("loading")}
            />
            <button
              onClick={() => {
                const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true })
                document.dispatchEvent(ev)
              }}
              className="hidden md:flex items-center gap-2 h-7 px-3 rounded-md bg-zinc-800/50 border border-zinc-700/40 text-xs text-zinc-500 hover:text-zinc-400 hover:border-zinc-600 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>{tc("searchEllipsis")}</span>
              <kbd className="ml-1 px-1 py-0.5 rounded bg-zinc-700/50 text-xs font-mono text-zinc-500">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <NotificationsDropdown />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-zinc-300">{session?.user?.name || "..."}</p>
                <p className="text-xs text-zinc-500">{session?.user?.role || "..."}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-red-400"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content — with page transition */}
        <main id="main-content" role="main" className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Breadcrumb />
          <div key={pathname} className="page-transition">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation — Mobile only */}
      <BottomNav onMorePress={() => setMobileOpen(true)} />

      {/* Command Palette — Cmd+K */}
      <CommandPalette />

      {/* Keyboard Shortcuts Overlay — Cmd+/ */}
      <KeyboardShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Shortcut hint — desktop only */}
      <span className="hidden md:block fixed bottom-4 right-4 text-xs text-zinc-500">
        <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-xs font-mono text-zinc-500">⌘/</kbd>{" "}
        {tc("shortcutHint")}
      </span>
    </div>
  )
}
