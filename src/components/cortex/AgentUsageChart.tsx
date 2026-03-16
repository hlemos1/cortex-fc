"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AgentUsageChartProps {
  data: {
    date: string
    ORACLE: number
    ANALISTA: number
    SCOUT: number
    BOARD_ADVISOR: number
    CFO_MODELER: number
    COACHING_ASSIST: number
  }[]
}

const CHART_COLORS: Record<string, string> = {
  ORACLE: "#34d399",
  ANALISTA: "#22d3ee",
  SCOUT: "#fbbf24",
  BOARD_ADVISOR: "#a78bfa",
  CFO_MODELER: "#60a5fa",
  COACHING_ASSIST: "#8b5cf6",
}

const AGENT_LABELS: Record<string, string> = {
  ORACLE: "Oracle",
  ANALISTA: "Analista",
  SCOUT: "Scout",
  BOARD_ADVISOR: "Board Advisor",
  CFO_MODELER: "CFO Modeler",
  COACHING_ASSIST: "Coaching Assist",
}

function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/90 backdrop-blur-md p-3 shadow-xl">
      <p className="text-xs font-semibold text-zinc-300 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-400">{AGENT_LABELS[entry.name] ?? entry.name}</span>
          </span>
          <span className="font-mono text-zinc-200">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function AgentUsageChart({ data }: AgentUsageChartProps) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-400">Uso de Agentes ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<GlassTooltip />} />
            <Legend
              verticalAlign="bottom"
              formatter={(value: string) => (
                <span className="text-xs text-zinc-400">{AGENT_LABELS[value] ?? value}</span>
              )}
            />
            {Object.entries(CHART_COLORS).map(([key, color]) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="agents"
                fill={color}
                fillOpacity={0.85}
                radius={key === "COACHING_ASSIST" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
