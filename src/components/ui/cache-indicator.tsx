"use client"

import { CloudOff } from "lucide-react"

interface CacheIndicatorProps {
  isFromCache: boolean
  className?: string
}

export function CacheIndicator({ isFromCache, className = "" }: CacheIndicatorProps) {
  if (!isFromCache) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium ${className}`}
    >
      <CloudOff className="w-3 h-3" />
      Dados em cache
    </span>
  )
}
