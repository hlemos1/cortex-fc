"use client"

import { WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[var(--z-toast)] bg-amber-600/95 backdrop-blur-sm text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff className="w-4 h-4" />
      <span>Sem conexao — dados em cache serao exibidos</span>
    </div>
  )
}
