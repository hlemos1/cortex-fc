"use client"

import { useState, useMemo } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { CortexDecision } from "@/types/cortex"
import { getDecisionColor } from "@/lib/db-transforms"

interface ScatterPoint {
  name: string
  vx: number
  rx: number
  decision: CortexDecision
  scn?: number
}

interface VxRxScatterProps {
  data: ScatterPoint[]
  height?: number
}

const ALL_DECISIONS: CortexDecision[] = [
  "CONTRATAR",
  "BLINDAR",
  "MONITORAR",
  "RECUSAR",
  "ALERTA_CINZA",
]

function CustomDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: ScatterPoint }) {
  if (!cx || !cy || !payload) return null
  const colors = getDecisionColor(payload.decision)

  return (
    <g filter="url(#dotGlow)">
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={12} fill={colors.fill} fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={9} fill={colors.fill} fillOpacity={0.1} stroke={colors.fill} strokeOpacity={0.3} strokeWidth={1} />
      {/* Main dot */}
      <circle cx={cx} cy={cy} r={6} fill={colors.fill} fillOpacity={0.9} stroke="#fff" strokeOpacity={0.2} strokeWidth={1} />
      {/* Inner highlight */}
      <circle cx={cx - 1.5} cy={cy - 1.5} r={2} fill="#fff" fillOpacity={0.25} />
    </g>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPoint }> }) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload

  const colors = getDecisionColor(point.decision)

  return (
    <div
      className="rounded-xl p-3.5 shadow-2xl border"
      style={{
        backgroundColor: "rgba(24, 24, 27, 0.85)",
        borderColor: "rgba(63, 63, 70, 0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <p className="text-sm font-semibold text-zinc-100 mb-2">{point.name}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-400">Vx:</span>
          <span className="text-emerald-400 font-mono font-medium">{point.vx.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-zinc-400">Rx:</span>
          <span className="text-red-400 font-mono font-medium">{point.rx.toFixed(2)}</span>
        </div>
        {point.scn !== undefined && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-zinc-400">SCN+:</span>
            <span className="text-cyan-400 font-mono font-medium">{point.scn}</span>
          </div>
        )}
        <div className="pt-1 mt-1 border-t border-zinc-700/50">
          <span className={`font-semibold ${colors.text}`}>{point.decision}</span>
        </div>
      </div>
    </div>
  )
}

export function VxRxScatter({ data, height = 400 }: VxRxScatterProps) {
  const [activeDecisions, setActiveDecisions] = useState<Set<CortexDecision>>(
    () => new Set(ALL_DECISIONS)
  )

  const filteredData = useMemo(
    () => data.filter((d) => activeDecisions.has(d.decision)),
    [data, activeDecisions]
  )

  function toggleDecision(decision: CortexDecision) {
    setActiveDecisions((prev) => {
      const next = new Set(prev)
      if (next.has(decision)) {
        next.delete(decision)
      } else {
        next.add(decision)
      }
      return next
    })
  }

  // Determine which decisions are present in data
  const presentDecisions = useMemo(
    () => new Set(data.map((d) => d.decision)),
    [data]
  )

  return (
    <div className="space-y-3">
      {/* Decision filter pills */}
      <div className="flex flex-wrap gap-1.5 px-2">
        {ALL_DECISIONS.filter((d) => presentDecisions.has(d)).map((decision) => {
          const colors = getDecisionColor(decision)
          const isActive = activeDecisions.has(decision)

          return (
            <button
              key={decision}
              type="button"
              onClick={() => toggleDecision(decision)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 border"
              style={{
                backgroundColor: isActive ? `${colors.fill}20` : "rgba(39, 39, 42, 0.4)",
                borderColor: isActive ? `${colors.fill}50` : "rgba(63, 63, 70, 0.3)",
                color: isActive ? colors.fill : "#52525b",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                style={{
                  backgroundColor: isActive ? colors.fill : "#52525b",
                }}
              />
              {decision.replace("_", " ")}
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="overflow-x-auto -mx-2 px-2">
        <ResponsiveContainer width="100%" height={height} minWidth={480}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <filter id="dotGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Subtle quadrant gradients */}
              <linearGradient id="quadrantTopRight" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.03} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.06} />
              </linearGradient>
              <linearGradient id="quadrantBottomLeft" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.03} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.06} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" strokeOpacity={0.6} />

            <XAxis
              type="number"
              dataKey="vx"
              name="Vx"
              domain={[0.5, 2.5]}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              label={{ value: "Vx (Valor)", position: "bottom", fill: "#71717a", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="rx"
              name="Rx"
              domain={[0, 2]}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              label={{ value: "Rx (Risco)", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 12 }}
            />

            {/* Reference lines with labels */}
            <ReferenceLine
              x={1.0}
              stroke="#3f3f46"
              strokeDasharray="5 5"
              label={{ value: "Vx=1.0", fill: "#52525b", fontSize: 9, position: "top" }}
            />
            <ReferenceLine
              x={1.5}
              stroke="#3f3f46"
              strokeDasharray="5 5"
              label={{ value: "Vx=1.5", fill: "#52525b", fontSize: 9, position: "top" }}
            />
            <ReferenceLine
              y={0.8}
              stroke="#3f3f46"
              strokeDasharray="5 5"
              label={{ value: "Rx=0.8 \u2014 Baixo Risco", fill: "#52525b", fontSize: 9, position: "right" }}
            />
            <ReferenceLine
              y={1.5}
              stroke="#3f3f46"
              strokeDasharray="5 5"
              label={{ value: "Rx=1.5 \u2014 Alto Risco", fill: "#52525b", fontSize: 9, position: "right" }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#3f3f46" }} />

            <Scatter
              data={filteredData}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
              shape={<CustomDot />}
            >
              {filteredData.map((entry, index) => (
                <Cell key={index} fill={getDecisionColor(entry.decision).fill} fillOpacity={0.85} r={7} />
              ))}
            </Scatter>

            {/* Quadrant labels as customized labels via ReferenceLine trick — using text annotations */}
            {/* Top-right quadrant: Alto Valor / Baixo Risco */}
            <ReferenceLine
              x={2.2}
              y={0.3}
              ifOverflow="extendDomain"
              label={{
                value: "Alto Valor / Baixo Risco",
                fill: "#10b981",
                fontSize: 9,
                opacity: 0.25,
                position: "center",
              }}
              stroke="none"
            />
            {/* Bottom-left quadrant: Baixo Valor / Alto Risco */}
            <ReferenceLine
              x={0.8}
              y={1.8}
              ifOverflow="extendDomain"
              label={{
                value: "Baixo Valor / Alto Risco",
                fill: "#ef4444",
                fontSize: 9,
                opacity: 0.25,
                position: "center",
              }}
              stroke="none"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Data point count badge */}
      <div className="flex justify-center px-2">
        <span className="text-[11px] text-zinc-500 font-medium bg-zinc-800/50 border border-zinc-700/30 rounded-full px-3 py-0.5">
          {filteredData.length} jogador{filteredData.length !== 1 ? "es" : ""}
          {filteredData.length !== data.length && (
            <span className="text-zinc-600 ml-1">de {data.length}</span>
          )}
        </span>
      </div>
    </div>
  )
}
