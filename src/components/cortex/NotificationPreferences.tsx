"use client"

import { useState } from "react"
import {
  Activity,
  FileText,
  Cpu,
  Search,
  AlertTriangle,
  TrendingUp,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleSwitch } from "@/components/ui/toggle-switch"

interface NotificationPreferencesProps {
  preferences: {
    analysis_complete: boolean
    report_generated: boolean
    agent_complete: boolean
    scouting_update: boolean
    contract_alert: boolean
    market_opportunity: boolean
  }
  onSave: (prefs: Record<string, boolean>) => void
}

const notificationTypes = [
  {
    key: "analysis_complete" as const,
    label: "Analise Concluida",
    description: "Receber quando uma analise neural for finalizada",
    icon: Activity,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  {
    key: "report_generated" as const,
    label: "Relatorio Gerado",
    description: "Receber quando um relatorio PDF estiver pronto",
    icon: FileText,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  {
    key: "agent_complete" as const,
    label: "Agente IA",
    description: "Receber quando um agente autonomo completar",
    icon: Cpu,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
  },
  {
    key: "scouting_update" as const,
    label: "Scouting",
    description: "Receber atualizacoes do pipeline de scouting",
    icon: Search,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
  {
    key: "contract_alert" as const,
    label: "Alertas de Contrato",
    description: "Receber alertas de contratos expirando",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
  },
  {
    key: "market_opportunity" as const,
    label: "Oportunidades",
    description: "Receber oportunidades de mercado identificadas",
    icon: TrendingUp,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
]

export function NotificationPreferences({
  preferences,
  onSave,
}: NotificationPreferencesProps) {
  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean>>({
    ...preferences,
  })

  const handleToggle = (key: string, checked: boolean) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: checked }))
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
          <Bell className="w-4 h-4 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300">
          Preferencias de Notificacao
        </h3>
      </div>

      <div className="space-y-1">
        {notificationTypes.map((notif) => {
          const Icon = notif.icon
          return (
            <div
              key={notif.key}
              className="flex items-center justify-between gap-3 py-3 px-2 rounded-lg hover:bg-zinc-800/30 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg ${notif.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${notif.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200">
                    {notif.label}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {notif.description}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={!!localPrefs[notif.key]}
                onChange={(checked) => handleToggle(notif.key, checked)}
                size="sm"
              />
            </div>
          )
        })}
      </div>

      <div className="mt-5">
        <Button
          onClick={() => onSave(localPrefs)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
        >
          Salvar Preferencias
        </Button>
      </div>
    </div>
  )
}
