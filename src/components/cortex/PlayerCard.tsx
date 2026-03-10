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
        "group relative bg-zinc-900/80 border-zinc-800 transition-all duration-300 cursor-pointer p-4 overflow-hidden",
        "hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30",
        "border-l-2 border-l-emerald-500/40",
        className
      )}
      onClick={onClick}
    >
      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)",
        }}
      />

      <div className="flex items-center gap-3 relative">
        {/* Avatar with gradient border */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 p-[2px] bg-gradient-to-br from-emerald-500/50 to-cyan-500/50">
          <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
            {name}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {position} &middot; {club} &middot; {age} anos
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {scnScore !== undefined && (
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              SCN+ {scnScore}
            </span>
          )}
          {decision && <DecisionBadge decision={decision} size="sm" />}
        </div>
      </div>
    </Card>
  )
}
