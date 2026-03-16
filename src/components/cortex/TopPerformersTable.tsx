"use client"

import Link from "next/link"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import type { CortexDecision } from "@/types/cortex"

interface TopPerformersTableProps {
  data: {
    id: string
    name: string
    scnPlus: number | null
    vx: number
    rx: number
    decision: string
    photoUrl: string | null
  }[]
}

const MEDAL_COLORS: Record<number, string> = {
  1: "text-amber-400",
  2: "text-zinc-300",
  3: "text-amber-700",
}

function PlayerAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-700"
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-zinc-800 ring-1 ring-zinc-700 flex items-center justify-center">
      <span className="text-[10px] font-semibold text-zinc-400">{initials}</span>
    </div>
  )
}

export function TopPerformersTable({ data }: TopPerformersTableProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
        Sem dados de jogadores
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left text-[11px] text-zinc-500 font-medium uppercase tracking-wider py-2 px-2 w-8">
              #
            </th>
            <th className="text-left text-[11px] text-zinc-500 font-medium uppercase tracking-wider py-2 px-2">
              Jogador
            </th>
            <th className="text-right text-[11px] text-zinc-500 font-medium uppercase tracking-wider py-2 px-2">
              SCN+
            </th>
            <th className="text-right text-[11px] text-zinc-500 font-medium uppercase tracking-wider py-2 px-2">
              Vx
            </th>
            <th className="text-right text-[11px] text-zinc-500 font-medium uppercase tracking-wider py-2 px-2">
              Rx
            </th>
            <th className="text-left text-[11px] text-zinc-500 font-medium uppercase tracking-wider py-2 px-2">
              Decisao
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((player, index) => {
            const rank = index + 1
            const medalClass = MEDAL_COLORS[rank]

            return (
              <tr
                key={player.id}
                className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40"
              >
                <td className="py-2.5 px-2">
                  <span
                    className={`font-mono font-bold text-sm ${medalClass ?? "text-zinc-600"}`}
                  >
                    {rank}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  <Link
                    href={`/players/${player.id}`}
                    className="flex items-center gap-2.5 group"
                  >
                    <PlayerAvatar name={player.name} photoUrl={player.photoUrl} />
                    <span className="text-zinc-200 font-medium group-hover:text-emerald-400 transition-colors">
                      {player.name}
                    </span>
                  </Link>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className="font-mono font-semibold text-emerald-400">
                    {player.scnPlus ?? "—"}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className="font-mono text-zinc-300">
                    {player.vx.toFixed(2)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className="font-mono text-zinc-300">
                    {player.rx.toFixed(2)}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  <DecisionBadge decision={player.decision as CortexDecision} size="sm" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
