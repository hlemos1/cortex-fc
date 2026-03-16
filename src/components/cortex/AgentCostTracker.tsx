"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, DollarSign, TrendingUp, Calendar } from "lucide-react"

interface AgentCostTrackerProps {
  totalTokens: number
  totalRuns: number
  byAgent: { agentType: string; totalTokens: number; count: number }[]
  dailyUsage: { date: string; tokens: number; cost: number }[]
}

const COST_PER_TOKEN = 0.000015
const MONTHLY_BUDGET = 100

const AGENT_COLORS: Record<string, string> = {
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

function MiniTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/90 backdrop-blur-md p-2 shadow-xl">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="text-xs font-mono text-zinc-200">${payload[0].value.toFixed(4)}</p>
    </div>
  )
}

export function AgentCostTracker({ totalTokens, totalRuns, byAgent, dailyUsage }: AgentCostTrackerProps) {
  const totalCost = totalTokens * COST_PER_TOKEN
  const days = dailyUsage.length || 1
  const dailyAvg = totalCost / days
  const projectedMonthly = dailyAvg * 30
  const budgetPct = Math.min((projectedMonthly / MONTHLY_BUDGET) * 100, 100)
  const overBudget = budgetPct > 80

  const maxAgentTokens = useMemo(() => {
    return Math.max(...byAgent.map((a) => a.totalTokens), 1)
  }, [byAgent])

  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          Custo e Consumo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-2.5 text-center">
            <p className="text-[9px] text-zinc-600 uppercase font-medium tracking-wider">Total</p>
            <p className="text-sm font-bold font-mono text-zinc-100">${totalCost.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-2.5 text-center">
            <p className="text-[9px] text-zinc-600 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> Dia
            </p>
            <p className="text-sm font-bold font-mono text-zinc-100">${dailyAvg.toFixed(3)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-2.5 text-center">
            <p className="text-[9px] text-zinc-600 uppercase font-medium tracking-wider flex items-center justify-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> Proj. Mes
            </p>
            <p className={`text-sm font-bold font-mono ${overBudget ? "text-amber-400" : "text-zinc-100"}`}>
              ${projectedMonthly.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Per-agent token bars */}
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Tokens por Agente</p>
          {byAgent.map((agent) => {
            const pct = (agent.totalTokens / maxAgentTokens) * 100
            const color = AGENT_COLORS[agent.agentType] ?? "#71717a"
            return (
              <div key={agent.agentType} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">{AGENT_LABELS[agent.agentType] ?? agent.agentType}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {agent.totalTokens > 1000 ? `${(agent.totalTokens / 1000).toFixed(1)}k` : agent.totalTokens}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Mini area chart */}
        {dailyUsage.length > 0 && (
          <div>
            <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider mb-2">Custo Diario (30d)</p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={dailyUsage} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip content={<MiniTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  fill="url(#costGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Budget section */}
        <div className="rounded-lg bg-zinc-800/20 border border-zinc-700/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Orcamento Mensal</p>
            <span className="text-[10px] font-mono text-zinc-500">${MONTHLY_BUDGET.toFixed(0)}/mes</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overBudget ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono ${overBudget ? "text-amber-400" : "text-zinc-500"}`}>
              {budgetPct.toFixed(0)}% utilizado
            </span>
            {overBudget && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                <AlertTriangle className="w-3 h-3" />
                Atencao: &gt;80% do orcamento
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
