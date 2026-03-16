"use client"

import { useMemo } from "react"
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react"

interface AnalyticsInsightCardsProps {
  avgVx: number
  avgRx: number
  avgSCNPlus: number
  totalAnalyses: number
  decisionsBreakdown: { decision: string; count: number }[]
  topPerformers: { name: string; scnPlus: number }[]
}

type InsightType = "positive" | "neutral" | "warning"

interface Insight {
  type: InsightType
  text: string
}

const INSIGHT_STYLES: Record<InsightType, { border: string; bg: string; iconColor: string }> = {
  positive: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  neutral: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-400",
  },
  warning: {
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    iconColor: "text-red-400",
  },
}

function InsightIcon({ type }: { type: InsightType }) {
  const style = INSIGHT_STYLES[type]
  if (type === "warning") return <AlertTriangle className={`w-4 h-4 ${style.iconColor}`} />
  if (type === "neutral") return <Lightbulb className={`w-4 h-4 ${style.iconColor}`} />
  return <TrendingUp className={`w-4 h-4 ${style.iconColor}`} />
}

export function AnalyticsInsightCards({
  avgVx,
  avgRx,
  avgSCNPlus,
  totalAnalyses,
  decisionsBreakdown,
  topPerformers,
}: AnalyticsInsightCardsProps) {
  const insights = useMemo(() => {
    const result: Insight[] = []

    // Check dominant decision
    if (totalAnalyses > 0) {
      const sorted = [...decisionsBreakdown].sort((a, b) => b.count - a.count)
      const dominant = sorted[0]
      if (dominant) {
        const pct = Math.round((dominant.count / totalAnalyses) * 100)
        if (pct > 50) {
          const isWarning = dominant.decision === "RECUSAR" || dominant.decision === "ALERTA_CINZA"
          result.push({
            type: isWarning ? "warning" : "neutral",
            text: `${pct}% das analises resultaram em ${dominant.decision} — ${
              isWarning
                ? "revise os criterios de scouting"
                : "considere ajustar criterios de scouting"
            }`,
          })
        }
      }
    }

    // SCN+ trend
    if (avgSCNPlus > 0) {
      if (avgSCNPlus >= 7.0) {
        result.push({
          type: "positive",
          text: `O SCN+ medio subiu para ${avgSCNPlus.toFixed(1)} — o pipeline esta mais seletivo`,
        })
      } else if (avgSCNPlus < 5.0) {
        result.push({
          type: "warning",
          text: `SCN+ medio em ${avgSCNPlus.toFixed(1)} — qualidade do pipeline precisa de atencao`,
        })
      } else {
        result.push({
          type: "neutral",
          text: `SCN+ medio em ${avgSCNPlus.toFixed(1)} — pipeline com qualidade moderada`,
        })
      }
    }

    // Vx vs Rx balance
    if (avgVx > 0 && avgRx > 0) {
      if (avgVx > avgRx * 1.5) {
        result.push({
          type: "positive",
          text: `Vx medio (${avgVx.toFixed(2)}) supera Rx medio (${avgRx.toFixed(2)}) — bom equilibrio valor/risco`,
        })
      } else if (avgRx > avgVx) {
        result.push({
          type: "warning",
          text: `Rx medio (${avgRx.toFixed(2)}) supera Vx medio (${avgVx.toFixed(2)}) — risco elevado no pipeline`,
        })
      } else {
        result.push({
          type: "neutral",
          text: `Vx medio (${avgVx.toFixed(2)}) e Rx medio (${avgRx.toFixed(2)}) estao proximos — equilibrio neutro`,
        })
      }
    }

    // Top performer
    if (topPerformers.length > 0) {
      const top = topPerformers[0]
      result.push({
        type: "positive",
        text: `Top performer: ${top.name} com SCN+ ${top.scnPlus.toFixed(1)}`,
      })
    }

    return result.slice(0, 4)
  }, [avgVx, avgRx, avgSCNPlus, totalAnalyses, decisionsBreakdown, topPerformers])

  if (insights.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {insights.map((insight, i) => {
        const style = INSIGHT_STYLES[insight.type]
        return (
          <div
            key={i}
            className={`
              relative rounded-xl border border-zinc-800/60 backdrop-blur-sm
              ${style.bg} border-l-4 ${style.border}
              p-4 animate-slide-up
            `}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center flex-shrink-0 ring-1 ring-white/5">
                <InsightIcon type={insight.type} />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                {insight.text}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
