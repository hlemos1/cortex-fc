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

function CustomTick({ payload, x, y, textAnchor }: { payload: { value: string }; x: number; y: number; textAnchor: "start" | "middle" | "end" | "inherit" }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor={textAnchor}
        fill="#a1a1aa"
        fontSize={10}
        fontWeight={500}
        letterSpacing="0.02em"
        dy={4}
      >
        {payload.value}
      </text>
    </g>
  )
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
        </div>
      )}
      <div className="relative w-full max-w-[220px] sm:max-w-none" style={{ width: size, height: size }}>
        {/* Center score overlay */}
        {scnScore !== undefined && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
              {scnScore}
            </span>
            <span className="text-[10px] font-mono text-emerald-400/70 tracking-widest uppercase mt-0.5">
              SCN+
            </span>
          </div>
        )}
        <ResponsiveContainer width={size} height={size}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <defs>
              <linearGradient id="neuralRadarGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="neuralRadarStroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={1} />
              </linearGradient>
              <filter id="neuralGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="polygonShadow">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.35" />
              </filter>
            </defs>
            <PolarGrid stroke="#27272a" strokeDasharray="3 6" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="layer"
              tick={<CustomTick payload={{ value: "" }} x={0} y={0} textAnchor="middle" />}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#3f3f46", fontSize: 9 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Neural Score"
              dataKey="value"
              stroke="url(#neuralRadarStroke)"
              fill="url(#neuralRadarGradient)"
              fillOpacity={1}
              strokeWidth={2}
              filter="url(#polygonShadow)"
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(24, 24, 27, 0.95)",
                border: "1px solid rgba(39, 39, 42, 0.8)",
                borderRadius: "10px",
                fontSize: "12px",
                color: "#fafafa",
                backdropFilter: "blur(8px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              }}
              formatter={(value) => [`${value}/100`, "Score"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
