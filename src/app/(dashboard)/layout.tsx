"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Brain,
  LayoutDashboard,
  Users,
  Activity,
  Search,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/players", label: "Jogadores", icon: Users },
  { href: "/analysis", label: "Análises", icon: Activity },
  { href: "/scouting", label: "Scouting", icon: Search },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/settings", label: "Configurações", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-zinc-800/60 bg-[#0c0c0f] transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 border-b border-zinc-800/60 px-4",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight">CORTEX FC</h1>
              <p className="text-[10px] text-zinc-600 font-mono tracking-widest">NEURAL ANALYTICS</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-emerald-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-zinc-700">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-zinc-800/60 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="ml-2 text-xs">Recolher</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 font-mono">v2.1.0</span>
            <span className="text-zinc-800">|</span>
            <span className="text-xs text-zinc-500">Nottingham Forest FC</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" className="text-zinc-500 hover:text-zinc-300">
              <Bell className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-zinc-300">Analista NFFC</p>
                <p className="text-[10px] text-zinc-600">club_professional</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
