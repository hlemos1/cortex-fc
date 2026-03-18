"use client"

import { memo, useMemo } from "react"

interface ScoutingFunnelProps {
  data: { stage: string; count: number }[]
}

const STAGE_COLORS = [
  { bg: "bg-zinc-600/20", border: "border-zinc-500/30", bar: "#71717a", text: "text-zinc-300" },
  { bg: "bg-amber-500/10", border: "border-amber-500/30", bar: "#f59e0b", text: "text-amber-300" },
  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "#10b981", text: "text-emerald-300" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/30", bar: "#06b6d4", text: "text-cyan-300" },
]

export const ScoutingFunnel = memo(function ScoutingFunnel({ data }: ScoutingFunnelProps) {
  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data])
  const total = useMemo(() => (data.length > 0 ? data[0].count : 0), [data])

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
        Sem dados de pipeline
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((stage, index) => {
        const colorSet = STAGE_COLORS[index % STAGE_COLORS.length]
        const widthPercent = (stage.count / maxCount) * 100
        const percentage = total > 0 ? ((stage.count / total) * 100).toFixed(1) : "0"
        const prevCount = index > 0 ? data[index - 1].count : null
        const conversionRate = prevCount && prevCount > 0
          ? ((stage.count / prevCount) * 100).toFixed(1)
          : null

        return (
          <div key={stage.stage}>
            {/* Conversion rate between stages */}
            {conversionRate && (
              <div className="flex items-center justify-center gap-2 py-1">
                <div className="h-px flex-1 max-w-[60px] bg-zinc-800" />
                <span className="text-xs font-mono text-zinc-500">
                  {conversionRate}% conversao
                </span>
                <div className="h-px flex-1 max-w-[60px] bg-zinc-800" />
              </div>
            )}

            {/* Funnel bar */}
            <div className="relative" style={{ paddingLeft: `${((100 - widthPercent) / 2) * 0.6}%`, paddingRight: `${((100 - widthPercent) / 2) * 0.6}%` }}>
              <div
                className={`relative rounded-lg border ${colorSet.bg} ${colorSet.border} px-4 py-3 transition-all hover:brightness-110`}
              >
                {/* Background bar */}
                <div
                  className="absolute inset-0 rounded-lg opacity-20"
                  style={{
                    background: `linear-gradient(90deg, ${colorSet.bar}40 0%, transparent 100%)`,
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <span className={`text-sm font-semibold ${colorSet.text}`}>
                    {stage.stage}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono font-bold text-zinc-100">
                      {stage.count}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})
