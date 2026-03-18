"use client"

import { memo, useState, useCallback } from "react"
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
  benchmarkLayers?: NeuralLayers
  benchmarkLabel?: string
  playerName?: string
  scnScore?: number
  size?: number
}

const layerLabels: Record<keyof NeuralLayers, string> = {
  C1_technical: "C1 Tecnico",
  C2_tactical: "C2 Tatico",
  C3_physical: "C3 Fisico",
  C4_behavioral: "C4 Comportamental",
  C5_narrative: "C5 Narrativa",
  C6_economic: "C6 Economico",
  C7_ai: "C7 IA",
}

interface RadarDataPoint {
  layer: string
  value: number
  benchmark?: number
  fullMark: number
}

// Custom Tooltip Component
function NeuralTooltipContent({
  active,
  payload,
  hasBenchmark,
  playerName,
  benchmarkLabel,
}: {
  active?: boolean
  payload?: Array<{ payload: RadarDataPoint }>
  hasBenchmark: boolean
  playerName?: string
  benchmarkLabel?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload
  const playerScore = data.value
  const benchmarkScore = data.benchmark
  const maxVal = Math.max(playerScore, benchmarkScore ?? 0, 1)

  return (
    <div
      style={{
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        border: "1px solid rgba(39, 39, 42, 0.8)",
        borderRadius: "10px",
        padding: "10px 14px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        minWidth: 160,
      }}
    >
      <p style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 6, fontWeight: 600 }}>
        {data.layer}
      </p>

      {/* Player score */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#10b981",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: "#d4d4d8", flex: 1 }}>
          {playerName || "Jogador"}
        </span>
        <span style={{ fontSize: 12, color: "#fafafa", fontWeight: 700, fontFamily: "monospace" }}>
          {playerScore}
        </span>
      </div>

      {/* Player bar */}
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "rgba(39, 39, 42, 0.6)",
          marginBottom: hasBenchmark ? 8 : 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(playerScore / 100) * 100}%`,
            background: "linear-gradient(90deg, #10b981, #06b6d4)",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Benchmark score */}
      {hasBenchmark && benchmarkScore !== undefined && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#f59e0b",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: "#d4d4d8", flex: 1 }}>
              {benchmarkLabel || "Benchmark"}
            </span>
            <span style={{ fontSize: 12, color: "#fafafa", fontWeight: 700, fontFamily: "monospace" }}>
              {benchmarkScore}
            </span>
          </div>

          {/* Benchmark bar */}
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "rgba(39, 39, 42, 0.6)",
              marginBottom: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(benchmarkScore / 100) * 100}%`,
                background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                borderRadius: 2,
              }}
            />
          </div>

          {/* Delta */}
          {(() => {
            const delta = playerScore - benchmarkScore
            const color = delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "#a1a1aa"
            const sign = delta > 0 ? "+" : ""
            return (
              <div style={{ textAlign: "right", fontSize: 12, color, fontWeight: 600, fontFamily: "monospace" }}>
                {sign}{delta} pts
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

// Custom Tick with hover score display
function CustomTickWithHover({
  payload,
  x,
  y,
  textAnchor,
  hoveredLayer,
  onHover,
  layerScore,
  benchmarkScore,
}: {
  payload: { value: string }
  x: string | number
  y: string | number
  textAnchor: string
  hoveredLayer: string | null
  onHover: (layer: string | null) => void
  layerScore: number
  benchmarkScore?: number
}) {
  const isHovered = hoveredLayer === payload.value
  const nx = Number(x)
  const ny = Number(y)
  const anchor = textAnchor as "start" | "middle" | "end" | "inherit"

  return (
    <g
      transform={`translate(${nx},${ny})`}
      onMouseEnter={() => onHover(payload.value)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      <text
        textAnchor={anchor}
        fill={isHovered ? "#e4e4e7" : "#a1a1aa"}
        fontSize={10}
        fontWeight={isHovered ? 700 : 500}
        letterSpacing="0.02em"
        dy={4}
      >
        {payload.value}
      </text>
      {isHovered && (
        <text
          textAnchor={anchor}
          fill="#10b981"
          fontSize={11}
          fontWeight={700}
          fontFamily="monospace"
          dy={18}
        >
          {layerScore}{benchmarkScore !== undefined ? ` / ${benchmarkScore}` : ""}
        </text>
      )}
    </g>
  )
}

export const NeuralRadar = memo(function NeuralRadar({
  layers,
  benchmarkLayers,
  benchmarkLabel,
  playerName,
  scnScore,
  size = 300,
}: NeuralRadarProps) {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)

  const handleLayerHover = useCallback((layer: string | null) => {
    setHoveredLayer(layer)
  }, [])

  // Build a lookup from label -> scores for the tick
  const scoreByLabel: Record<string, { player: number; benchmark?: number }> = {}

  const data: RadarDataPoint[] = Object.entries(layers).map(([key, value]) => {
    const label = layerLabels[key as keyof NeuralLayers]
    const benchmarkValue = benchmarkLayers?.[key as keyof NeuralLayers]
    scoreByLabel[label] = { player: value, benchmark: benchmarkValue }
    return {
      layer: label,
      value,
      benchmark: benchmarkValue,
      fullMark: 100,
    }
  })

  const hasBenchmark = !!benchmarkLayers

  return (
    <div className="flex flex-col items-center">
      {playerName && (
        <div className="text-center mb-2">
          <p className="text-sm font-semibold text-zinc-200">{playerName}</p>
        </div>
      )}
      <div className="relative w-full max-w-[220px] sm:max-w-none overflow-hidden" style={{ width: Math.min(size, 300), height: Math.min(size, 300) }}>
        {/* Center score overlay */}
        {scnScore !== undefined && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
              {scnScore}
            </span>
            <span className="text-xs font-mono text-emerald-400/70 tracking-widest uppercase mt-0.5">
              SCN+
            </span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
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
              <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="benchmarkStroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8} />
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
              tick={(props: Record<string, unknown>) => {
                const tickProps = props as { payload: { value: string }; x: string | number; y: string | number; textAnchor: string }
                return (
                  <CustomTickWithHover
                    {...tickProps}
                    hoveredLayer={hoveredLayer}
                    onHover={handleLayerHover}
                    layerScore={scoreByLabel[tickProps.payload.value]?.player ?? 0}
                    benchmarkScore={scoreByLabel[tickProps.payload.value]?.benchmark}
                  />
                )
              }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#3f3f46", fontSize: 9 }}
              tickCount={5}
              axisLine={false}
            />

            {/* Benchmark radar (rendered first so player is on top) */}
            {hasBenchmark && (
              <Radar
                name="Benchmark"
                dataKey="benchmark"
                stroke="url(#benchmarkStroke)"
                fill="url(#benchmarkGradient)"
                fillOpacity={0.3}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                isAnimationActive={true}
                animationDuration={1400}
                animationEasing="ease-out"
              />
            )}

            {/* Player radar */}
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
              content={
                <NeuralTooltipContent
                  hasBenchmark={hasBenchmark}
                  playerName={playerName}
                  benchmarkLabel={benchmarkLabel}
                />
              }
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {(playerName || hasBenchmark) && (
        <div className="flex items-center gap-4 mt-3" role="list" aria-label="Legenda do radar">
          <div className="flex items-center gap-1.5" role="listitem">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: "#10b981" }}
              aria-hidden="true"
            />
            <span className="text-xs text-zinc-400 font-medium">
              {playerName || "Jogador"}
            </span>
          </div>
          {hasBenchmark && (
            <div className="flex items-center gap-1.5" role="listitem">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "#f59e0b" }}
                aria-hidden="true"
              />
              <span className="text-xs text-zinc-400 font-medium">
                {benchmarkLabel || "Benchmark"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
