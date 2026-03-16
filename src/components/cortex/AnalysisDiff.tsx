"use client"

import { ArrowUp, ArrowDown, Minus, ArrowRight } from "lucide-react"
import { DecisionBadge } from "./DecisionBadge"
import type { CortexDecision } from "@/types/cortex"

interface AnalysisSnapshot {
  date: string
  vx: number
  rx: number
  scnPlus: number
  decision: string
  confidence: number
}

interface AnalysisDiffProps {
  current: AnalysisSnapshot
  previous: AnalysisSnapshot
}

function DeltaIndicator({
  value,
  inverted = false,
}: {
  value: number
  inverted?: boolean
}) {
  if (Math.abs(value) < 0.01) {
    return (
      <span className="inline-flex items-center gap-0.5 text-zinc-500 text-[10px] font-mono">
        <Minus className="w-3 h-3" />
        0.00
      </span>
    )
  }

  const isPositive = value > 0
  // For inverted metrics (Rx), a decrease is good
  const isGood = inverted ? !isPositive : isPositive

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-mono ${
        isGood ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {isPositive ? (
        <ArrowUp className="w-3 h-3" />
      ) : (
        <ArrowDown className="w-3 h-3" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(2)}
    </span>
  )
}

function MetricRow({
  label,
  oldVal,
  newVal,
  inverted = false,
}: {
  label: string
  oldVal: number
  newVal: number
  inverted?: boolean
}) {
  const delta = newVal - oldVal

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wide w-16">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-zinc-500">{oldVal.toFixed(2)}</span>
        <ArrowRight className="w-3 h-3 text-zinc-600" />
        <span className="text-xs font-mono text-zinc-300">{newVal.toFixed(2)}</span>
        <DeltaIndicator value={delta} inverted={inverted} />
      </div>
    </div>
  )
}

function getAssessment(current: AnalysisSnapshot, previous: AnalysisSnapshot) {
  const vxDelta = current.vx - previous.vx
  const rxDelta = current.rx - previous.rx

  // Positive evolution: Vx up AND Rx down
  if (vxDelta > 0.05 && rxDelta < -0.05) {
    return {
      label: "Evolucao positiva",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    }
  }

  // Regression: Vx down OR Rx up significantly
  if (vxDelta < -0.1 || rxDelta > 0.15) {
    return {
      label: "Atencao: regressao",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
    }
  }

  return {
    label: "Estavel",
    color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  }
}

export function AnalysisDiff({ current, previous }: AnalysisDiffProps) {
  const assessment = getAssessment(current, previous)
  const decisionChanged = current.decision !== previous.decision

  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
      {/* Header */}
      <p className="text-[11px] text-zinc-500 font-mono mb-3">
        {previous.date} → {current.date}
      </p>

      {/* Metric rows */}
      <div className="divide-y divide-zinc-800/50">
        <MetricRow label="Vx" oldVal={previous.vx} newVal={current.vx} />
        <MetricRow label="Rx" oldVal={previous.rx} newVal={current.rx} inverted />
        <MetricRow label="SCN+" oldVal={previous.scnPlus} newVal={current.scnPlus} />
        <MetricRow
          label="Conf."
          oldVal={previous.confidence}
          newVal={current.confidence}
        />
      </div>

      {/* Decision change */}
      <div className="mt-3 pt-3 border-t border-zinc-800/50">
        {decisionChanged ? (
          <div className="flex items-center gap-2 flex-wrap">
            <DecisionBadge decision={previous.decision as CortexDecision} size="sm" />
            <ArrowRight className="w-3 h-3 text-zinc-600" />
            <DecisionBadge decision={current.decision as CortexDecision} size="sm" />
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500">
            Decisao mantida:{" "}
            <span className="text-zinc-400 font-medium">{current.decision}</span>
          </p>
        )}
      </div>

      {/* Assessment */}
      <div className="mt-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold border ${assessment.color}`}
        >
          {assessment.label}
        </span>
      </div>
    </div>
  )
}
