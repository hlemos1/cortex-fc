"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AgentCostChartProps {
  data: { week: string; totalTokens: number; runCount: number }[]
}

function CostTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
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
      <p className="text-zinc-400 mb-1.5 font-medium">Semana de {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              p.name === "totalTokens" ? "bg-amber-400" : "bg-violet-400"
            }`}
          />
          <span className="text-zinc-400">
            {p.name === "totalTokens" ? "Tokens:" : "Execucoes:"}
          </span>
          <span className="text-white font-mono font-semibold">
            {p.name === "totalTokens" ? p.value.toLocaleString("pt-BR") : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AgentCostChart({ data }: AgentCostChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
        Sem dados de custo de agentes
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
          allowDecimals={false}
        />
        <Tooltip content={<CostTooltip />} />
        <Bar
          dataKey="totalTokens"
          fill="#f59e0b"
          radius={[4, 4, 0, 0]}
          opacity={0.85}
          isAnimationActive={true}
          animationDuration={1200}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
