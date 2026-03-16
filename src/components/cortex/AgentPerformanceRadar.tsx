"use client"

import { useState, useCallback } from "react"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

interface AgentPerformanceRadarProps {
  agents: {
    name: string
    successRate: number
    avgSpeed: number
    tokenEfficiency: number
    usage: number
    reliability: number
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

const DIMENSIONS = [
  { key: "successRate", label: "Taxa Sucesso" },
  { key: "avgSpeed", label: "Velocidade" },
  { key: "tokenEfficiency", label: "Eficiencia Tokens" },
  { key: "usage", label: "Uso" },
  { key: "reliability", label: "Confiabilidade" },
]

function RadarTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color: string }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/90 backdrop-blur-md p-3 shadow-xl">
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

export function AgentPerformanceRadar({ agents }: AgentPerformanceRadarProps) {
  const [hiddenAgents, setHiddenAgents] = useState<Set<string>>(new Set())

  const toggleAgent = useCallback((agentName: string) => {
    setHiddenAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agentName)) {
        next.delete(agentName)
      } else {
        next.add(agentName)
      }
      return next
    })
  }, [])

  // Transform data for Recharts RadarChart format
  const chartData = DIMENSIONS.map((dim) => {
    const point: Record<string, string | number> = { dimension: dim.label }
    for (const agent of agents) {
      point[agent.name] = agent[dim.key as keyof typeof agent] as number
    }
    return point
  })

  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Performance Comparativa dos Agentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={380}>
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#52525b", fontSize: 9 }}
              axisLine={false}
            />
            <Tooltip content={<RadarTooltip />} />
            {agents.map((agent) => {
              const color = CHART_COLORS[agent.name] ?? "#71717a"
              if (hiddenAgents.has(agent.name)) return null
              return (
                <Radar
                  key={agent.name}
                  name={agent.name}
                  dataKey={agent.name}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              )
            })}
            <Legend
              verticalAlign="bottom"
              onClick={(e) => {
                if (e && e.value) toggleAgent(e.value as string)
              }}
              formatter={(value: string) => (
                <span
                  className={`text-xs cursor-pointer ${
                    hiddenAgents.has(value) ? "text-zinc-600 line-through" : "text-zinc-400"
                  }`}
                >
                  {AGENT_LABELS[value] ?? value}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
