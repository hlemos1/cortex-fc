"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface DecisionDonutProps {
  data: { decision: string; count: number }[]
}

const DECISION_COLORS: Record<string, string> = {
  CONTRATAR: "#10b981",
  BLINDAR: "#06b6d4",
  MONITORAR: "#f59e0b",
  EMPRESTIMO: "#8b5cf6",
  RECUSAR: "#ef4444",
  ALERTA_CINZA: "#71717a",
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { decision: string; count: number; percent: number } }>
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const color = DECISION_COLORS[entry.payload.decision] ?? "#71717a"

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
          style={{ backgroundColor: color }}
        />
        <span className="text-zinc-100 font-semibold">
          {entry.payload.decision.replace("_", " ")}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-zinc-400">Quantidade:</span>
        <span className="text-white font-mono font-semibold">{entry.value}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-zinc-400">Percentual:</span>
        <span className="text-white font-mono font-semibold">
          {entry.payload.percent.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

function CenterLabel({ viewBox, total }: { viewBox?: { cx: number; cy: number }; total: number }) {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fafafa"
        fontSize={28}
        fontWeight={700}
        fontFamily="monospace"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#71717a"
        fontSize={10}
        fontWeight={500}
        letterSpacing="0.1em"
      >
        TOTAL
      </text>
    </g>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-zinc-400 font-medium">
            {entry.value.replace("_", " ")}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DecisionDonut({ data }: DecisionDonutProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data])

  const enrichedData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        percent: total > 0 ? (d.count / total) * 100 : 0,
      })),
    [data, total]
  )

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">
        Sem dados de decisao disponiveis
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={enrichedData}
          dataKey="count"
          nameKey="decision"
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          strokeWidth={0}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
          label={false}
        >
          {enrichedData.map((entry, index) => (
            <Cell
              key={index}
              fill={DECISION_COLORS[entry.decision] ?? "#71717a"}
              stroke="rgba(9, 9, 11, 0.5)"
              strokeWidth={2}
            />
          ))}
          <CenterLabel total={total} />
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
