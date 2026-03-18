"use client"

import { Info, Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================
// Types
// ============================================

export interface AnalysisSliderFieldProps {
  label: string
  tooltip: string
  value: number
  max?: number
  onChange: (v: number) => void
  color?: string
  aiFilled?: boolean
}

function AIBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 ml-1.5">
      <Sparkles className="w-2.5 h-2.5" />
      IA
    </span>
  )
}

export function AnalysisSliderField({ label, tooltip, value, max = 10, onChange, color = "emerald", aiFilled }: AnalysisSliderFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-zinc-400">{label}</Label>
          {aiFilled && <AIBadge />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3 h-3 text-zinc-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 text-zinc-200 border-zinc-700 max-w-xs text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
        <span className={`text-xs font-mono font-semibold text-${color}-400`}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={max === 100 ? 1 : 0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  )
}
