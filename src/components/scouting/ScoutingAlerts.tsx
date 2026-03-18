"use client"

import Link from "next/link"
import {
  Bell,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// ============================================
// Types
// ============================================

interface Alert {
  id: string
  type: string
  severity: string
  title: string
  description: string
  playerId: string
  playerName: string
}

export interface ScoutingAlertsProps {
  alerts: Alert[]
  alertsLoading: boolean
  onRefresh: () => void
}

export function ScoutingAlerts({ alerts, alertsLoading, onRefresh }: ScoutingAlertsProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Alertas de Mercado
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={alertsLoading}
          className="text-zinc-500 hover:text-emerald-400 text-xs"
        >
          Atualizar
        </Button>
      </div>

      {alertsLoading && (
        <div className="py-12 text-center text-zinc-500 text-sm">Carregando alertas...</div>
      )}

      {!alertsLoading && alerts.length === 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Bell className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum alerta ativo no momento</p>
            <p className="text-zinc-500 text-xs mt-1">Adicione jogadores ao pipeline para receber alertas</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`bg-zinc-900/80 border-zinc-800 transition-colors hover:bg-zinc-800/40 ${
              alert.severity === "high" ? "border-l-2 border-l-red-500" : "border-l-2 border-l-amber-500"
            }`}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.severity === "high" ? "bg-red-500/10" : "bg-amber-500/10"
                }`}>
                  {alert.type === "contract_expiring" ? (
                    <Clock className={`w-4 h-4 ${alert.severity === "high" ? "text-red-400" : "text-amber-400"}`} />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${alert.severity === "high" ? "text-red-400" : "text-amber-400"}`} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{alert.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{alert.description}</p>
                </div>
                <Link href={`/players/${alert.playerId}`}>
                  <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-emerald-400 text-xs">
                    Ver
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
