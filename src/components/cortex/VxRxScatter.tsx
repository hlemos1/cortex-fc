"use client"

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

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPoint }> }) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload

  const colors = getDecisionColor(point.decision)

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-zinc-100 mb-1">{point.name}</p>
      <div className="space-y-1 text-xs">
        <p className="text-zinc-400">
          Vx: <span className="text-emerald-400 font-mono">{point.vx.toFixed(2)}</span>
        </p>
        <p className="text-zinc-400">
          Rx: <span className="text-red-400 font-mono">{point.rx.toFixed(2)}</span>
        </p>
        {point.scn !== undefined && (
          <p className="text-zinc-400">
            SCN+: <span className="text-cyan-400 font-mono">{point.scn}</span>
          </p>
        )}
        <p className={`font-semibold ${colors.text}`}>{point.decision}</p>
      </div>
    </div>
  )
}

export function VxRxScatter({ data, height = 400 }: VxRxScatterProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
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

        {/* Reference lines for decision zones */}
        <ReferenceLine x={1.0} stroke="#27272a" strokeDasharray="5 5" label={{ value: "Vx=1.0", fill: "#52525b", fontSize: 9 }} />
        <ReferenceLine x={1.5} stroke="#27272a" strokeDasharray="5 5" label={{ value: "Vx=1.5", fill: "#52525b", fontSize: 9 }} />
        <ReferenceLine y={0.8} stroke="#27272a" strokeDasharray="5 5" label={{ value: "Rx=0.8", fill: "#52525b", fontSize: 9 }} />
        <ReferenceLine y={1.5} stroke="#27272a" strokeDasharray="5 5" label={{ value: "Rx=1.5", fill: "#52525b", fontSize: 9 }} />

        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#3f3f46" }} />

        <Scatter data={data} isAnimationActive={true}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getDecisionColor(entry.decision).fill} fillOpacity={0.85} r={7} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
