"use client"

import { Users, BarChart3, TrendingUp, ShieldAlert, Brain } from "lucide-react"
import { AnimatedNumber } from "@/components/ui/animated-number"

interface AnalyticsKPIRowProps {
  totalPlayers: number
  totalAnalyses: number
  avgVx: number
  avgRx: number
  avgSCNPlus: number
}

const KPI_CONFIG = [
  {
    key: "totalPlayers",
    label: "Jogadores",
    icon: Users,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    iconBg: "bg-emerald-500/15",
    decimals: 0,
  },
  {
    key: "totalAnalyses",
    label: "Analises",
    icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconBg: "bg-cyan-500/15",
    decimals: 0,
  },
  {
    key: "avgVx",
    label: "Vx Medio",
    icon: TrendingUp,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    iconBg: "bg-amber-500/15",
    decimals: 2,
  },
  {
    key: "avgRx",
    label: "Rx Medio",
    icon: ShieldAlert,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    iconBg: "bg-red-500/15",
    decimals: 2,
  },
  {
    key: "avgSCNPlus",
    label: "SCN+ Medio",
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconBg: "bg-purple-500/15",
    decimals: 1,
  },
] as const

export function AnalyticsKPIRow({
  totalPlayers,
  totalAnalyses,
  avgVx,
  avgRx,
  avgSCNPlus,
}: AnalyticsKPIRowProps) {
  const values: Record<string, number> = {
    totalPlayers,
    totalAnalyses,
    avgVx,
    avgRx,
    avgSCNPlus,
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon
        const value = values[kpi.key]

        return (
          <div
            key={kpi.key}
            className={`rounded-xl border bg-zinc-900/80 border-zinc-800 p-4 transition-all hover:brightness-105`}
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg ${kpi.iconBg} flex items-center justify-center ring-1 ring-white/5`}
              >
                <Icon className={`w-4.5 h-4.5 ${kpi.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate">
                  {kpi.label}
                </p>
                <p className={`text-xl font-bold font-mono tracking-tight ${kpi.color}`}>
                  <AnimatedNumber value={value} decimals={kpi.decimals} />
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
