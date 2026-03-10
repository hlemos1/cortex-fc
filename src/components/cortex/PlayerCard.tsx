"use client"

import { User } from "lucide-react"
import { Card } from "@/components/ui/card"
import { DecisionBadge } from "./DecisionBadge"
import type { CortexDecision } from "@/types/cortex"
import { cn } from "@/lib/utils"

interface PlayerCardProps {
  name: string
  position: string
  club: string
  age: number
  scnScore?: number
  decision?: CortexDecision
  className?: string
  onClick?: () => void
}

export function PlayerCard({
  name,
  position,
  club,
  age,
  scnScore,
  decision,
  className,
  onClick,
}: PlayerCardProps) {
  return (
    <Card
      className={cn(
        "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer p-4",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{name}</p>
          <p className="text-xs text-zinc-500">
            {position} &middot; {club} &middot; {age} anos
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {scnScore !== undefined && (
            <span className="text-xs font-mono text-emerald-400">SCN+ {scnScore}</span>
          )}
          {decision && <DecisionBadge decision={decision} size="sm" />}
        </div>
      </div>
    </Card>
  )
}
