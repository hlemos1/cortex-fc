"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/toast"

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

const TOAST_TYPE_MAP: Record<string, "success" | "info" | "warning"> = {
  analysis_complete: "success",
  report_generated: "info",
  agent_complete: "success",
  scouting_update: "info",
  contract_alert: "warning",
  market_opportunity: "info",
}

const MAX_RETRY_DELAY = 30000

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const failCountRef = useRef(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)
  const connectRef = useRef<() => void>(() => {})

  // Fetch initial data
  const fetchNotifications = useCallback(async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/notifications?count=true"),
      ])
      if (!mountedRef.current) return
      const notifsJson = await notifsRes.json()
      const countJson = await countRes.json()
      setNotifications(notifsJson.data ?? [])
      setUnreadCount(countJson.data?.unread ?? 0)
    } catch {
      // Silently handle
    }
  }, [])

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  // Mark all as read
  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    )
    setUnreadCount(0)
  }, [])

  // Start fallback polling
  const startPolling = useCallback(() => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      if (!mountedRef.current) return
      try {
        const res = await fetch("/api/notifications?count=true")
        const json = await res.json()
        const newCount = json.data?.unread ?? 0
        setUnreadCount((prev) => {
          if (newCount > prev) {
            // Fetch full list to get new notifications
            fetch("/api/notifications")
              .then((r) => r.json())
              .then((j) => {
                if (mountedRef.current) setNotifications(j.data ?? [])
              })
              .catch(() => {})
          }
          return newCount
        })
      } catch {
        // Silently handle
      }
    }, 30000)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Connect to SSE
  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource("/api/notifications/stream")
    eventSourceRef.current = es

    es.onopen = () => {
      if (!mountedRef.current) return
      setIsConnected(true)
      retryCountRef.current = 0
      failCountRef.current = 0
      stopPolling()
    }

    es.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const newNotifs: Notification[] = JSON.parse(event.data)
        if (newNotifs.length === 0) return

        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id))
          const fresh = newNotifs.filter((n) => !existingIds.has(n.id))
          if (fresh.length === 0) return prev
          return [...fresh, ...prev].slice(0, 50)
        })

        setUnreadCount((prev) => {
          const unread = newNotifs.filter((n) => !n.readAt).length
          return prev + unread
        })

        // Show toast for each new notification
        for (const n of newNotifs) {
          const toastType = TOAST_TYPE_MAP[n.type] ?? "info"
          toast({
            type: toastType,
            title: n.title,
            description: n.body ?? undefined,
          })
        }
      } catch {
        // Silently handle parse errors
      }
    }

    es.onerror = () => {
      if (!mountedRef.current) return
      es.close()
      eventSourceRef.current = null
      setIsConnected(false)

      failCountRef.current += 1

      // After 3 consecutive failures, fall back to polling
      if (failCountRef.current >= 3) {
        startPolling()
        return
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, ... max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), MAX_RETRY_DELAY)
      retryCountRef.current += 1
      setTimeout(() => {
        if (mountedRef.current) connectRef.current()
      }, delay)
    }
  }, [toast, startPolling, stopPolling])

  // Keep ref in sync with latest connect
  useEffect(() => {
    connectRef.current = connect
  })

  useEffect(() => {
    mountedRef.current = true
    fetchNotifications()
    connect()

    return () => {
      mountedRef.current = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      stopPolling()
    }
  }, [fetchNotifications, connect, stopPolling])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    isConnected,
  }
}
