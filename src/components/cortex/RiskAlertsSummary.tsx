"use client"

import Link from "next/link"
import { ShieldAlert, Clock, AlertTriangle, Eye } from "lucide-react"

interface RiskAlertsSummaryProps {
  highRiskCount: number
  contractExpiring: number
  lowConfidence: number
  grayAlerts: number
}

interface AlertPill {
  label: string
  value: number
  icon: React.ReactNode
  href: string
  thresholdHigh: number
}

export function RiskAlertsSummary({
  highRiskCount,
  contractExpiring,
  lowConfidence,
  grayAlerts,
}: RiskAlertsSummaryProps) {
  const pills: AlertPill[] = [
    {
      label: "Alto Risco",
      value: highRiskCount,
      icon: <ShieldAlert className="w-4 h-4" />,
      href: "/analysis?filter=high-risk",
      thresholdHigh: 3,
    },
    {
      label: "Contratos Expirando",
      value: contractExpiring,
      icon: <Clock className="w-4 h-4" />,
      href: "/players?filter=expiring",
      thresholdHigh: 5,
    },
    {
      label: "Baixa Confianca",
      value: lowConfidence,
      icon: <AlertTriangle className="w-4 h-4" />,
      href: "/analysis?filter=low-confidence",
      thresholdHigh: 3,
    },
    {
      label: "Alertas Cinza",
      value: grayAlerts,
      icon: <Eye className="w-4 h-4" />,
      href: "/analysis?filter=gray-alert",
      thresholdHigh: 2,
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider px-1">
        Resumo de Riscos
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pills.map((pill, i) => {
          const isHigh = pill.value >= pill.thresholdHigh
          const isZero = pill.value === 0

          return (
            <Link
              key={i}
              href={pill.href}
              className={`
                group relative flex items-center gap-3 rounded-xl p-3.5
                border backdrop-blur-sm transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-lg animate-slide-up
                ${
                  isHigh
                    ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:shadow-red-900/10"
                    : isZero
                      ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-900/10"
                      : "bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700/60"
                }
              `}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={`
                  w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-white/5
                  ${
                    isHigh
                      ? "bg-red-500/10 text-red-400"
                      : isZero
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-800/60 text-zinc-400"
                  }
                `}
              >
                {pill.icon}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-lg font-bold font-mono tracking-tight ${
                    isHigh ? "text-red-400" : isZero ? "text-emerald-400" : "text-zinc-200"
                  }`}
                >
                  {pill.value}
                </p>
                <p className="text-[11px] text-zinc-500 font-medium truncate">
                  {pill.label}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
