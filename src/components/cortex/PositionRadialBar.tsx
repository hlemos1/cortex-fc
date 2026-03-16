"use client"

import { useMemo } from "react"
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface PositionRadialBarProps {
  data: { position: string; count: number }[]
}

const POSITION_COLORS: Record<string, string> = {
  GK: "#10b981",
  CB: "#3b82f6",
  FB: "#06b6d4",
  DM: "#8b5cf6",
  CM: "#f59e0b",
  AM: "#ef4444",
  W: "#ec4899",
  ST: "#f97316",
}

const POSITION_LABELS: Record<string, string> = {
  GK: "Goleiro",
  CB: "Zagueiro",
  FB: "Lateral",
  DM: "Volante",
  CM: "Meia",
  AM: "Meia-atacante",
  W: "Ponta",
  ST: "Atacante",
}

function GlassTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { position: string; count: number; fill: string } }>
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload

  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-2xl border"
      style={{
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        borderColor: "rgba(63, 63, 70, 0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: entry.fill }}
        />
        <span className="text-zinc-100 font-semibold">
          {entry.position} - {POSITION_LABELS[entry.position] ?? entry.position}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-zinc-400">Jogadores:</span>
        <span className="text-white font-mono font-semibold">{entry.count}</span>
      </div>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-zinc-400 font-medium">
            {entry.value} - {POSITION_LABELS[entry.value] ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PositionRadialBar({ data }: PositionRadialBarProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data])

  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data])

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        fill: POSITION_COLORS[d.position] ?? "#71717a",
        // Normalize to percentage of max for better visual distribution
        normalizedCount: (d.count / maxCount) * 100,
      })),
    [data, maxCount]
  )

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">
        Sem dados de posicao disponiveis
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Center total overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-2xl font-bold font-mono text-zinc-100">{total}</span>
        <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">
          JOGADORES
        </span>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <RadialBarChart
          cx="50%"
          cy="45%"
          innerRadius="20%"
          outerRadius="80%"
          data={chartData}
          startAngle={180}
          endAngle={-180}
          barSize={12}
        >
          <RadialBar
            dataKey="count"
            cornerRadius={6}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
            label={{
              position: "insideStart",
              fill: "#fafafa",
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "monospace",
            }}
          />
          <Tooltip content={<GlassTooltip />} />
          <Legend content={<CustomLegend />} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}
