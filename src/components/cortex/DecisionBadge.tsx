"use client"

import { Shield, ShieldCheck, Eye, ArrowRightLeft, XCircle, AlertTriangle } from "lucide-react"
import type { CortexDecision } from "@/types/cortex"
import { getDecisionColor } from "@/lib/db-transforms"
import { cn } from "@/lib/utils"

const decisionConfig: Record<CortexDecision, { label: string; icon: React.ElementType }> = {
  CONTRATAR: { label: "CONTRATAR", icon: ShieldCheck },
  BLINDAR: { label: "BLINDAR", icon: Shield },
  MONITORAR: { label: "MONITORAR", icon: Eye },
  EMPRESTIMO: { label: "EMPRÉSTIMO", icon: ArrowRightLeft },
  RECUSAR: { label: "RECUSAR", icon: XCircle },
  ALERTA_CINZA: { label: "ALERTA CINZA", icon: AlertTriangle },
}

interface DecisionBadgeProps {
  decision: CortexDecision
  size?: "sm" | "md" | "lg"
  className?: string
}

export function DecisionBadge({ decision, size = "md", className }: DecisionBadgeProps) {
  const config = decisionConfig[decision]
  const colors = getDecisionColor(decision)
  const Icon = config.icon

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide border",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  )
}
