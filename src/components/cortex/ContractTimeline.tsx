"use client"

import { memo } from "react"
import Link from "next/link"

interface ContractTimelineProps {
  data: {
    quarter: string
    players: {
      id: string
      name: string
      club: string | null
      contractUntil: string | Date
      marketValue: number | null
    }[]
  }[]
}

function getUrgencyColor(contractUntil: string | Date): { bg: string; border: string; text: string } {
  const now = new Date()
  const expiry = contractUntil instanceof Date ? contractUntil : new Date(contractUntil)
  const monthsRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)

  if (monthsRemaining < 6) {
    return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" }
  }
  if (monthsRemaining < 12) {
    return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" }
  }
  return { bg: "bg-zinc-500/10", border: "border-zinc-500/30", text: "text-zinc-400" }
}

function formatValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }
  return value.toString()
}

export const ContractTimeline = memo(function ContractTimeline({ data }: ContractTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
        Sem dados de contratos
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex gap-4 min-w-max pb-2">
        {data.map((quarter, qi) => (
          <div key={quarter.quarter} className="flex flex-col items-center min-w-[200px]">
            {/* Quarter header */}
            <div className="flex items-center gap-2 mb-3 w-full">
              {qi > 0 && <div className="flex-1 h-px bg-zinc-800" />}
              <div className="px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50">
                <span className="text-xs font-semibold text-zinc-300 tracking-wide">
                  {quarter.quarter}
                </span>
              </div>
              {qi < data.length - 1 && <div className="flex-1 h-px bg-zinc-800" />}
            </div>

            {/* Timeline connector dot */}
            <div className="w-3 h-3 rounded-full bg-zinc-700 border-2 border-zinc-600 mb-3" />

            {/* Player chips */}
            <div className="flex flex-col gap-2 w-full">
              {quarter.players.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-4">
                  Nenhum jogador
                </div>
              ) : (
                quarter.players.map((player) => {
                  const colors = getUrgencyColor(player.contractUntil)
                  return (
                    <div
                      key={player.id}
                      className={`rounded-lg p-2.5 border ${colors.bg} ${colors.border} transition-all hover:brightness-110`}
                    >
                      <Link
                        href={`/players/${player.id}`}
                        className={`text-xs font-semibold ${colors.text} hover:underline`}
                      >
                        {player.name}
                      </Link>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-zinc-500 truncate max-w-[100px]">
                          {player.club ?? "—"}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 font-medium">
                          {player.marketValue != null ? formatValue(player.marketValue) : "—"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[9px] text-zinc-500">
                          Ate {(player.contractUntil instanceof Date ? player.contractUntil : new Date(player.contractUntil)).toLocaleDateString("pt-BR", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-zinc-800/50" role="list" aria-label="Legenda de urgencia do contrato">
        <div className="flex items-center gap-1.5" role="listitem">
          <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-xs text-zinc-500">&lt;6 meses</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
          <span className="text-xs text-zinc-500">6-12 meses</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <span className="w-2 h-2 rounded-full bg-zinc-500" aria-hidden="true" />
          <span className="text-xs text-zinc-500">12-18 meses</span>
        </div>
      </div>
    </div>
  )
})
