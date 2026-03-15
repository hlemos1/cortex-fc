"use client"

import { useState, useEffect, useRef } from "react"
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Brain,
  FileText,
  Search,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  contract_alert: { icon: AlertTriangle, color: "text-amber-400" },
  analysis_complete: { icon: Brain, color: "text-emerald-400" },
  agent_complete: { icon: Brain, color: "text-cyan-400" },
  report_generated: { icon: FileText, color: "text-blue-400" },
  scouting_update: { icon: Search, color: "text-violet-400" },
  market_opportunity: { icon: TrendingUp, color: "text-pink-400" },
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch unread count
  useEffect(() => {
    fetch("/api/notifications?count=true")
      .then((r) => r.json())
      .then((json) => setUnreadCount(json.data?.unread ?? 0))
      .catch(() => {})

    const interval = setInterval(() => {
      fetch("/api/notifications?count=true")
        .then((r) => r.json())
        .then((json) => setUnreadCount(json.data?.unread ?? 0))
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Fetch notifications when opened
  useEffect(() => {
    if (!open) return
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((json) => setNotifications(json.data ?? []))
      .catch(() => {})
  }, [open])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
    setUnreadCount(0)
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "agora"
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-zinc-500 hover:text-zinc-300 relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-medium text-zinc-300">Notificacoes</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-600">
                Nenhuma notificacao
              </div>
            ) : (
              notifications.map((n) => {
                const config = TYPE_CONFIG[n.type] ?? { icon: Bell, color: "text-zinc-400" }
                const Icon = config.icon
                const isUnread = !n.readAt

                return (
                  <button
                    key={n.id}
                    onClick={() => isUnread && markRead(n.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30",
                      isUnread && "bg-emerald-500/[0.03]"
                    )}
                  >
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.color + "/10")}>
                      <Icon className={cn("w-3.5 h-3.5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-xs truncate", isUnread ? "text-zinc-200 font-medium" : "text-zinc-400")}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-[11px] text-zinc-600 truncate mt-0.5">{n.body}</p>
                      )}
                      <p className="text-[10px] text-zinc-700 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
