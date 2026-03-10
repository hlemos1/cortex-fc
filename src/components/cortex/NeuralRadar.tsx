"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { NeuralLayers } from "@/types/cortex"

interface NeuralRadarProps {
  layers: NeuralLayers
  playerName?: string
  scnScore?: number
  size?: number
}

const layerLabels: Record<keyof NeuralLayers, string> = {
  C1_technical: "C1 Técnico",
  C2_tactical: "C2 Tático",
  C3_physical: "C3 Físico",
  C4_behavioral: "C4 Comportamental",
  C5_narrative: "C5 Narrativa",
  C6_economic: "C6 Econômico",
  C7_ai: "C7 IA",
}

export function NeuralRadar({ layers, playerName, scnScore, size = 300 }: NeuralRadarProps) {
  const data = Object.entries(layers).map(([key, value]) => ({
    layer: layerLabels[key as keyof NeuralLayers],
    value,
    fullMark: 100,
  }))

  return (
    <div className="flex flex-col items-center">
      {playerName && (
        <div className="text-center mb-2">
          <p className="text-sm font-semibold text-zinc-200">{playerName}</p>
          {scnScore !== undefined && (
            <p className="text-xs text-emerald-400 font-mono">SCN+ {scnScore}</p>
          )}
        </div>
      )}
      <ResponsiveContainer width={size} height={size}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis
            dataKey="layer"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#52525b", fontSize: 9 }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Neural Score"
            dataKey="value"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#fafafa",
            }}
            formatter={(value) => [`${value}/100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
