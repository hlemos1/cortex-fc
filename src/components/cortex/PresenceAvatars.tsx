"use client"

import { memo } from "react"
import { usePresence } from "@/hooks/usePresence"
import { cn } from "@/lib/utils"

interface PresenceAvatarsProps {
  page: string
  className?: string
}

export const PresenceAvatars = memo(function PresenceAvatars({ page, className }: PresenceAvatarsProps) {
  const { viewers } = usePresence(page)

  if (viewers.length === 0) return null

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex -space-x-2">
        {viewers.slice(0, 3).map((v) => (
          <div
            key={v.userId}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 border-2 border-zinc-900 text-[10px] font-medium text-zinc-300"
            title={v.userId}
          >
            {v.userId.slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>
      {viewers.length > 3 && (
        <span className="text-xs text-zinc-500">+{viewers.length - 3}</span>
      )}
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
    </div>
  )
})
