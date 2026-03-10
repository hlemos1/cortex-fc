"use client"

import type { AlgorithmScores } from "@/types/cortex"
import { cn } from "@/lib/utils"

interface AlgorithmBarsProps {
  scores: AlgorithmScores
  className?: string
}

const algorithmLabels: Record<keyof AlgorithmScores, string> = {
  AST: "AST — Sinergia Tática",
  CLF: "CLF — Compat. Linguística",
  GNE: "GNE — Necessidade Estratégica",
  WSE: "WSE — Embedding Sistêmico",
  RBL: "RBL — Risk-Benefit Loop",
  SACE: "SACE — Adaptação Cultural",
  SCN_plus: "SCN+ — Score Neural",
}

function getBarColor(score: number): string {
  if (score < 40) return "bg-red-500"
  if (score < 70) return "bg-amber-500"
  return "bg-emerald-500"
}

function getTextColor(score: number): string {
  if (score < 40) return "text-red-400"
  if (score < 70) return "text-amber-400"
  return "text-emerald-400"
}

export function AlgorithmBars({ scores, className }: AlgorithmBarsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {(Object.entries(scores) as [keyof AlgorithmScores, number][]).map(([key, value]) => (
        <div key={key}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-400 font-medium">
              {algorithmLabels[key]}
            </span>
            <span className={cn("text-xs font-mono font-semibold", getTextColor(value))}>
              {value}
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getBarColor(value))}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
