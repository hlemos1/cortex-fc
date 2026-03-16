"use client"

import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  label: string
  description?: string
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentStep
        const isActive = i === currentStep
        const isPending = i > currentStep

        return (
          <div key={i} className="flex items-start gap-3">
            {/* Step indicator */}
            <div className={cn(
              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300",
              isCompleted && "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
              isActive && "bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/60 animate-pulse-glow",
              isPending && "bg-zinc-800/50 text-zinc-600 ring-1 ring-zinc-700/50"
            )}>
              {isCompleted ? (
                <Check className="w-3.5 h-3.5" />
              ) : isActive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>

            {/* Step text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={cn(
                "text-sm font-medium transition-colors",
                isCompleted && "text-emerald-400",
                isActive && "text-zinc-200",
                isPending && "text-zinc-600"
              )}>
                {step.label}
              </p>
              {step.description && (
                <p className={cn(
                  "text-xs mt-0.5",
                  isActive ? "text-zinc-500" : "text-zinc-700"
                )}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface BatchProgressProps {
  current: number
  total: number
  label?: string
  className?: string
}

export function BatchProgress({ current, total, label, className }: BatchProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label ?? "Progresso"}</span>
        <span className="text-zinc-500 font-mono">{current}/{total}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
