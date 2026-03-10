"use client"

import { Shield, ShieldCheck, Eye, ArrowRightLeft, XCircle, AlertTriangle } from "lucide-react"
import type { CortexDecision } from "@/types/cortex"
import { getDecisionColor } from "@/lib/db-transforms"
import { cn } from "@/lib/utils"

const decisionConfig: Record<CortexDecision, { label: string; icon: React.ElementType; accent: string; pulse: boolean }> = {
  CONTRATAR: { label: "CONTRATAR", icon: ShieldCheck, accent: "#10b981", pulse: true },
  BLINDAR: { label: "BLINDAR", icon: Shield, accent: "#3b82f6", pulse: false },
  MONITORAR: { label: "MONITORAR", icon: Eye, accent: "#f59e0b", pulse: false },
  EMPRESTIMO: { label: "EMPRESTIMO", icon: ArrowRightLeft, accent: "#a855f7", pulse: false },
  RECUSAR: { label: "RECUSAR", icon: XCircle, accent: "#ef4444", pulse: false },
  ALERTA_CINZA: { label: "ALERTA CINZA", icon: AlertTriangle, accent: "#71717a", pulse: true },
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
    sm: "px-2.5 py-1 text-[10px] gap-1.5",
    md: "px-3.5 py-1.5 text-xs gap-2",
    lg: "px-5 py-2.5 text-sm gap-2.5",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg font-semibold tracking-wide border transition-all duration-200",
        "hover:brightness-110 hover:shadow-sm",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: config.accent,
        background: `linear-gradient(135deg, ${config.accent}10 0%, transparent 60%)`,
      }}
    >
      {/* Pulse dot indicator */}
      {config.pulse && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: config.accent }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: config.accent }}
          />
        </span>
      )}

      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  )
}
