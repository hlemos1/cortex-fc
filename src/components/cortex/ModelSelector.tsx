"use client"

import { cn } from "@/lib/utils"
import { Cpu, Zap, Crown } from "lucide-react"
import type { AIModel } from "@/lib/ai-models"

interface ModelSelectorProps {
  models: AIModel[]
  selectedModel: string
  onSelect: (modelId: string) => void
  className?: string
}

export function ModelSelector({ models, selectedModel, onSelect, className }: ModelSelectorProps) {
  const icons = {
    fast: Zap,
    standard: Cpu,
    slow: Crown,
  }

  const speedColors = {
    fast: "text-cyan-400",
    standard: "text-emerald-400",
    slow: "text-amber-400",
  }

  return (
    <div className={cn("flex gap-2", className)}>
      {models.map((model) => {
        const Icon = icons[model.speed]
        const isSelected = selectedModel === model.id
        return (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-all min-h-[44px]",
              isSelected
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={cn("w-3.5 h-3.5", speedColors[model.speed])} />
              <span className="text-xs font-medium text-zinc-200">{model.name}</span>
            </div>
            <span className="text-[11px] text-zinc-500">{model.description}</span>
          </button>
        )
      })}
    </div>
  )
}
