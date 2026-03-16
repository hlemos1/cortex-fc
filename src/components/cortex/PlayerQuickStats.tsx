"use client"

import type { CortexDecision } from "@/types/cortex"

interface PlayerQuickStatsProps {
  vx?: number
  rx?: number
  scnPlus?: number
  decision?: CortexDecision
  appearances?: number
  goals?: number
  assists?: number
  rating?: number
  marketValue?: number
  age?: number
}

const decisionDotColor: Record<CortexDecision, string> = {
  CONTRATAR: "bg-emerald-400",
  BLINDAR: "bg-blue-400",
  MONITORAR: "bg-amber-400",
  EMPRESTIMO: "bg-cyan-400",
  RECUSAR: "bg-red-400",
  ALERTA_CINZA: "bg-zinc-400",
}

export function PlayerQuickStats({
  vx,
  rx,
  scnPlus,
  decision,
  appearances,
  goals,
  assists,
  rating,
  marketValue,
  age,
}: PlayerQuickStatsProps) {
  const stats: { label: string; value: React.ReactNode; key: string; stagger: string }[] = []

  if (vx !== undefined) {
    stats.push({
      key: "vx",
      label: "Vx",
      stagger: "stagger-1",
      value: <span className="text-emerald-400">{vx.toFixed(2)}</span>,
    })
  }

  if (rx !== undefined) {
    stats.push({
      key: "rx",
      label: "Rx",
      stagger: "stagger-1",
      value: <span className="text-red-400">{rx.toFixed(2)}</span>,
    })
  }

  if (scnPlus !== undefined) {
    stats.push({
      key: "scn",
      label: "SCN+",
      stagger: "stagger-2",
      value: (
        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-bold">
          {scnPlus}
        </span>
      ),
    })
  }

  if (decision !== undefined) {
    stats.push({
      key: "decision",
      label: "Decisao",
      stagger: "stagger-2",
      value: (
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${decisionDotColor[decision]}`} />
          <span className="text-zinc-200">{decision}</span>
        </span>
      ),
    })
  }

  if (appearances !== undefined) {
    stats.push({
      key: "appearances",
      label: "Jogos",
      stagger: "stagger-3",
      value: <span className="text-zinc-200">{appearances}</span>,
    })
  }

  if (goals !== undefined) {
    stats.push({
      key: "goals",
      label: "Gols",
      stagger: "stagger-3",
      value: <span className="text-zinc-200">{goals}</span>,
    })
  }

  if (assists !== undefined) {
    stats.push({
      key: "assists",
      label: "Assists",
      stagger: "stagger-4",
      value: <span className="text-zinc-200">{assists}</span>,
    })
  }

  if (rating !== undefined) {
    stats.push({
      key: "rating",
      label: "Rating",
      stagger: "stagger-4",
      value: <span className="text-amber-400">{rating.toFixed(1)}</span>,
    })
  }

  if (marketValue !== undefined) {
    stats.push({
      key: "marketValue",
      label: "Valor",
      stagger: "stagger-5",
      value: <span className="text-zinc-200">&euro;{marketValue}M</span>,
    })
  }

  if (age !== undefined) {
    stats.push({
      key: "age",
      label: "Idade",
      stagger: "stagger-5",
      value: <span className="text-zinc-200">{age}</span>,
    })
  }

  if (stats.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-x-visible scrollbar-hide">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className={`animate-slide-up ${stat.stagger} bg-zinc-800/40 border border-zinc-700/30 rounded-lg px-3 py-2 flex-shrink-0`}
        >
          <p className="text-[10px] text-zinc-500 leading-tight">{stat.label}</p>
          <p className="text-base font-mono font-bold leading-tight mt-0.5">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
