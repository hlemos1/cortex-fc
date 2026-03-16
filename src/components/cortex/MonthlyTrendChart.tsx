"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface MonthlyTrendChartProps {
  data: { month: string; count: number }[]
}

function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null

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
      <p className="text-zinc-400 mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-zinc-400">Analises:</span>
        <span className="text-white font-mono font-semibold">{payload[0].value}</span>
      </div>
    </div>
  )
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
        Sem dados de tendencia mensal
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#27272a" }}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#27272a" }}
          allowDecimals={false}
        />
        <Tooltip content={<GlassTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#emeraldGradient)"
          dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#10b981", stroke: "#09090b", strokeWidth: 2 }}
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
