"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Plus, MessageSquare, Menu } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

const navItemDefs = [
  { href: "/dashboard", key: "dashboard" as const, icon: LayoutDashboard },
  { href: "/players", key: "players" as const, icon: Users },
  { href: "/analysis/new", key: "newAnalysis" as const, icon: Plus, isCenter: true },
  { href: "/chat", key: "chat" as const, icon: MessageSquare },
]

interface BottomNavProps {
  onMorePress: () => void
}

export function BottomNav({ onMorePress }: BottomNavProps) {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const tc = useTranslations("common")

  const navItems = navItemDefs.map((item) => ({
    ...item,
    label: t(item.key),
  }))

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-zinc-800/60 bg-[#0c0c0f]/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href)
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-900/40 flex items-center justify-center ring-4 ring-[#0c0c0f] active:scale-95 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] text-emerald-400 mt-0.5">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 py-1 min-w-[56px]"
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-emerald-400" : "text-zinc-600"
              )} />
              <span className={cn(
                "text-[10px] transition-colors",
                isActive ? "text-emerald-400 font-medium" : "text-zinc-600"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </Link>
          )
        })}

        {/* More button */}
        <button
          onClick={onMorePress}
          aria-label={tc("moreOptions")}
          className="flex flex-col items-center justify-center gap-0.5 py-1 min-w-[56px]"
        >
          <Menu className="w-5 h-5 text-zinc-600" />
          <span className="text-[10px] text-zinc-600">{tc("more")}</span>
        </button>
      </div>
    </nav>
  )
}
