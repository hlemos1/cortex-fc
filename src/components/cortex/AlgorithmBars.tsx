"use client"

import { useState } from "react"
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

const premiumPalette: Record<keyof AlgorithmScores, { from: string; to: string; text: string; glow: string }> = {
  AST: { from: "#10b981", to: "#34d399", text: "text-emerald-400", glow: "rgba(16,185,129,0.3)" },
  CLF: { from: "#06b6d4", to: "#22d3ee", text: "text-cyan-400", glow: "rgba(6,182,212,0.3)" },
  GNE: { from: "#8b5cf6", to: "#a78bfa", text: "text-violet-400", glow: "rgba(139,92,246,0.3)" },
  WSE: { from: "#3b82f6", to: "#60a5fa", text: "text-blue-400", glow: "rgba(59,130,246,0.3)" },
  RBL: { from: "#f59e0b", to: "#fbbf24", text: "text-amber-400", glow: "rgba(245,158,11,0.3)" },
  SACE: { from: "#ec4899", to: "#f472b6", text: "text-pink-400", glow: "rgba(236,72,153,0.3)" },
  SCN_plus: { from: "#10b981", to: "#06b6d4", text: "text-emerald-400", glow: "rgba(16,185,129,0.4)" },
}

function getTextColor(score: number): string {
  if (score < 40) return "text-red-400"
  if (score < 70) return "text-amber-400"
  return "text-emerald-400"
}

export function AlgorithmBars({ scores, className }: AlgorithmBarsProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const entries = Object.entries(scores) as [keyof AlgorithmScores, number][]

  return (
    <div className={cn("space-y-3", className)}>
      {entries.map(([key, value], index) => {
        const palette = premiumPalette[key]
        const isHovered = hoveredKey === key

        return (
          <div
            key={key}
            className="group relative"
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              animationDelay: `${index * 80}ms`,
              animation: "fadeSlideIn 0.5s ease-out both",
            }}
          >
            {/* Tooltip on hover */}
            {isHovered && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 bg-zinc-800/95 border border-zinc-700/80 rounded-md text-[10px] text-zinc-300 whitespace-nowrap backdrop-blur-sm shadow-lg">
                {algorithmLabels[key]}
              </div>
            )}

            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-zinc-400 font-medium truncate pr-2">
                {algorithmLabels[key]}
              </span>
              <span className={cn("text-xs font-mono font-semibold tabular-nums", getTextColor(value))}>
                {value}
              </span>
            </div>

            {/* Bar track */}
            <div className="h-2.5 bg-zinc-800/60 rounded-full overflow-hidden relative">
              {/* Background track */}
              <div className="absolute inset-0 bg-zinc-800/40 rounded-full" />

              {/* Filled bar with gradient */}
              <div
                className="h-full rounded-full relative transition-all duration-300"
                style={{
                  width: `${value}%`,
                  background: `linear-gradient(90deg, ${palette.from}, ${palette.to})`,
                  boxShadow: isHovered ? `0 0 12px ${palette.glow}` : "none",
                  filter: isHovered ? "brightness(1.15)" : "brightness(1)",
                  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, filter 0.2s ease",
                  animationDelay: `${index * 80 + 200}ms`,
                }}
              >
                {/* Score label at end of bar */}
                {value > 15 && (
                  <span
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-white/80"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    {value}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
