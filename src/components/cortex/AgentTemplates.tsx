"use client"

import { useState } from "react"
import {
  Brain,
  Search,
  UserCheck,
  Landmark,
  Banknote,
  Gamepad2,
  Bot,
} from "lucide-react"
import { AgentLaunchModal } from "./AgentLaunchModal"

interface AgentTemplate {
  type: "ORACLE" | "ANALISTA" | "SCOUT" | "BOARD_ADVISOR" | "CFO_MODELER" | "COACHING_ASSIST"
  name: string
  description: string
  icon: typeof Brain
  color: string
  borderGlow: string
  capabilities: string[]
  avgDuration: string
  avgTokens: string
}

const TEMPLATES: AgentTemplate[] = [
  {
    type: "ORACLE",
    name: "ORACLE",
    description: "Motor de decisao neural",
    icon: Brain,
    color: "emerald",
    borderGlow: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
    capabilities: ["Analise Vx/Rx", "Score SCN+", "Decisao autonoma", "Camadas neurais"],
    avgDuration: "2.3s",
    avgTokens: "~1.2k tokens",
  },
  {
    type: "ANALISTA",
    name: "ANALISTA",
    description: "Analise detalhada de jogador",
    icon: UserCheck,
    color: "cyan",
    borderGlow: "hover:border-cyan-500/50 hover:shadow-cyan-500/10",
    capabilities: ["Perfil tecnico", "Analise tatica", "Comparacao com benchmarks"],
    avgDuration: "3.1s",
    avgTokens: "~1.8k tokens",
  },
  {
    type: "SCOUT",
    name: "SCOUT",
    description: "Scouting e descoberta",
    icon: Search,
    color: "amber",
    borderGlow: "hover:border-amber-500/50 hover:shadow-amber-500/10",
    capabilities: ["Busca por perfil", "Pipeline de scouting", "Alertas de mercado"],
    avgDuration: "4.2s",
    avgTokens: "~2.1k tokens",
  },
  {
    type: "BOARD_ADVISOR",
    name: "BOARD ADVISOR",
    description: "Assessor da diretoria",
    icon: Landmark,
    color: "purple",
    borderGlow: "hover:border-purple-500/50 hover:shadow-purple-500/10",
    capabilities: ["Analise estrategica", "ROI de contratacao", "Recomendacoes ao board"],
    avgDuration: "3.5s",
    avgTokens: "~2.0k tokens",
  },
  {
    type: "CFO_MODELER",
    name: "CFO MODELER",
    description: "Modelagem financeira",
    icon: Banknote,
    color: "blue",
    borderGlow: "hover:border-blue-500/50 hover:shadow-blue-500/10",
    capabilities: ["Simulacao de contrato", "Impacto salarial", "Analise de custo-beneficio"],
    avgDuration: "2.8s",
    avgTokens: "~1.5k tokens",
  },
  {
    type: "COACHING_ASSIST",
    name: "COACHING ASSIST",
    description: "Assistente tatico",
    icon: Gamepad2,
    color: "violet",
    borderGlow: "hover:border-violet-500/50 hover:shadow-violet-500/10",
    capabilities: ["Sugestoes de formacao", "Pontos fortes/fracos", "Plano de desenvolvimento"],
    avgDuration: "3.0s",
    avgTokens: "~1.6k tokens",
  },
]

const COLOR_MAP: Record<string, { icon: string; bg: string; border: string; pill: string }> = {
  emerald: {
    icon: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  cyan: {
    icon: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    pill: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  amber: {
    icon: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  purple: {
    icon: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    pill: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  violet: {
    icon: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    pill: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
}

export function AgentTemplates() {
  const [launchModal, setLaunchModal] = useState<{ type: string; name: string } | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t, idx) => {
          const colors = COLOR_MAP[t.color]
          const Icon = t.icon
          return (
            <div
              key={t.type}
              className={`group rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-5 card-hover transition-all duration-300 ${t.borderGlow} hover:shadow-lg animate-slide-up`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-100 tracking-tight">{t.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.description}</p>
                </div>
              </div>

              {/* Capabilities pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-md border ${colors.pill}`}
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">
                  Avg: {t.avgDuration} | {t.avgTokens}
                </span>
                <button
                  onClick={() => setLaunchModal({ type: t.type, name: t.name })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <Bot className="w-3 h-3" />
                  Executar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {launchModal && (
        <AgentLaunchModal
          isOpen={true}
          onClose={() => setLaunchModal(null)}
          agentType={launchModal.type}
          agentName={launchModal.name}
        />
      )}
    </>
  )
}
