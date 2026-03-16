"use client"

import { useState } from "react"
import {
  Eye,
  Briefcase,
  Search,
  DollarSign,
  Swords,
  Loader2,
} from "lucide-react"

interface QuickAction {
  id: string
  label: string
  description: string
  agentType: string
  icon: string
  color: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "analise-rapida",
    label: "Analise Rapida",
    description: "ORACLE analisa jogador selecionado",
    agentType: "ORACLE",
    icon: "Eye",
    color: "emerald",
  },
  {
    id: "relatorio-diretoria",
    label: "Relatorio da Diretoria",
    description: "Board Advisor gera sumario executivo",
    agentType: "BOARD_ADVISOR",
    icon: "Briefcase",
    color: "purple",
  },
  {
    id: "scouting-flash",
    label: "Scouting Flash",
    description: "Scout busca jogadores similares",
    agentType: "SCOUT",
    icon: "Search",
    color: "amber",
  },
  {
    id: "simulacao-financeira",
    label: "Simulacao Financeira",
    description: "CFO Modeler roda analise de custo",
    agentType: "CFO_MODELER",
    icon: "DollarSign",
    color: "blue",
  },
  {
    id: "avaliacao-tatica",
    label: "Avaliacao Tatica",
    description: "Coaching Assist faz avaliacao tatica",
    agentType: "COACHING_ASSIST",
    icon: "Swords",
    color: "violet",
  },
]

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Eye,
  Briefcase,
  Search,
  DollarSign,
  Swords,
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    hover: "hover:bg-emerald-500/20 hover:border-emerald-500/40",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    hover: "hover:bg-purple-500/20 hover:border-purple-500/40",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    hover: "hover:bg-amber-500/20 hover:border-amber-500/40",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    hover: "hover:bg-blue-500/20 hover:border-blue-500/40",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-400",
    hover: "hover:bg-violet-500/20 hover:border-violet-500/40",
  },
}

interface AgentQuickActionsProps {
  onAction?: (agentType: string, actionId: string) => void
}

export function AgentQuickActions({ onAction }: AgentQuickActionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleClick = async (action: QuickAction) => {
    if (loadingId) return
    setLoadingId(action.id)
    try {
      onAction?.(action.agentType, action.id)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-3 animate-slide-up">
      <h3 className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
        Acoes Rapidas
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {QUICK_ACTIONS.map((action) => {
          const colors = COLOR_MAP[action.color]
          const IconComponent = ICON_MAP[action.icon]
          const isLoading = loadingId === action.id

          return (
            <button
              key={action.id}
              onClick={() => handleClick(action)}
              disabled={!!loadingId}
              title={action.description}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition-all duration-200 ${colors.bg} ${colors.border} ${colors.text} ${colors.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                IconComponent && <IconComponent className="w-3.5 h-3.5" />
              )}
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
