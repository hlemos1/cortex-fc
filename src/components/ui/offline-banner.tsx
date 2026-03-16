"use client"

import { useState, useEffect, useRef } from "react"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const [visible, setVisible] = useState(false)
  const [restored, setRestored] = useState(false)
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      setRestored(false)
      setVisible(true)
    } else if (wasOffline.current) {
      wasOffline.current = false
      setRestored(true)
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setRestored(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (!visible) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex h-8 items-center justify-center gap-2 text-xs font-medium transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        restored
          ? "border-b border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-b border-amber-500/30 bg-amber-500/10 text-amber-400"
      }`}
    >
      {restored ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Conexao restaurada</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Voce esta offline. Algumas funcoes podem nao estar disponiveis.</span>
        </>
      )}
    </div>
  )
}
