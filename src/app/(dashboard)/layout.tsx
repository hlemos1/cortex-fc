"use client"

import { useState } from "react"
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
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OrgSwitcher } from "@/components/cortex/OrgSwitcher"
import { NotificationsDropdown } from "@/components/cortex/NotificationsDropdown"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/players", label: "Jogadores", icon: Users },
  { href: "/analysis", label: "Análises", icon: Activity },
  { href: "/scouting", label: "Scouting", icon: Search },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/chat", label: "Chat IA", icon: MessageSquare },
  { href: "/simulator", label: "Simulador", icon: ArrowRightLeft },
  { href: "/agent-console", label: "Console IA", icon: Monitor },
  { href: "/holding", label: "Holding", icon: Building2 },
  { href: "/audit-log", label: "Audit Log", icon: Shield },
  { href: "/billing", label: "Assinatura", icon: CreditCard },
  { href: "/settings", label: "Configurações", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

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
            <p className="text-[10px] text-zinc-600 font-mono tracking-widest">NEURAL ANALYTICS</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 py-4 px-2 space-y-1">
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
          {!collapsed && <span className="ml-2 text-xs">Recolher</span>}
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
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
            <span className="text-xs text-zinc-600 font-mono">v2.1.0</span>
            <span className="text-zinc-800">|</span>
            <OrgSwitcher
              currentOrgId={session?.user?.orgId ?? ""}
              currentOrgName={session?.user?.orgName ?? "Carregando..."}
            />
          </div>

          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-zinc-300">{session?.user?.name || "..."}</p>
                <p className="text-[10px] text-zinc-600">{session?.user?.role || "..."}</p>
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

        {/* Page Content — with fade-in animation */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
