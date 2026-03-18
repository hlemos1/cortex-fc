"use client"

import { Check } from "lucide-react"

// ============================================
// Types
// ============================================

interface Step {
  id: number
  label: string
}

export interface AnalysisStepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick: (stepId: number) => void
}

export function AnalysisStepIndicator({ steps, currentStep, onStepClick }: AnalysisStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <button
            onClick={() => currentStep > s.id && onStepClick(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentStep === s.id
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : currentStep > s.id
                ? "bg-zinc-800 text-emerald-400 cursor-pointer"
                : "bg-zinc-900 text-zinc-500"
            }`}
          >
            {currentStep > s.id ? (
              <Check className="w-3 h-3" />
            ) : (
              <span className="w-4 text-center">{s.id}</span>
            )}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px ${currentStep > s.id ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
          )}
        </div>
      ))}
    </div>
  )
}
