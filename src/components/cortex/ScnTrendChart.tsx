"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ScnTrendChartProps {
  data: { week: string; avgScnPlus: number; avgVx: number; avgRx: number; count: number }[]
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const nameMap: Record<string, string> = {
    avgScnPlus: "SCN+",
    avgVx: "Vx medio",
    avgRx: "Rx medio",
  }

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
      <p className="text-zinc-400 mb-1.5 font-medium">Semana de {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-zinc-400">{nameMap[p.name] ?? p.name}:</span>
          <span className="text-white font-mono font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ScnTrendChart({ data }: ScnTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
        Sem dados de tendencia SCN+
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#27272a" }}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#27272a" }}
        />
        <Tooltip content={<TrendTooltip />} />
        <Line
          type="monotone"
          dataKey="avgScnPlus"
          stroke="#a78bfa"
          strokeWidth={2}
          dot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#a78bfa", stroke: "#09090b", strokeWidth: 2 }}
          isAnimationActive={true}
          animationDuration={1500}
        />
        <Line
          type="monotone"
          dataKey="avgVx"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={true}
          animationDuration={1500}
        />
        <Line
          type="monotone"
          dataKey="avgRx"
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={true}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
