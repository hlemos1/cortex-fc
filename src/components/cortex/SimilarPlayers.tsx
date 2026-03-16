"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import type { CortexDecision } from "@/types/cortex"
import { getDecisionColor } from "@/lib/db-transforms"

interface SimilarPlayer {
  id: string
  name: string
  photoUrl: string | null
  positionCluster: string
  positionDetail: string | null
  currentClub: string | null
  age: number | null
  marketValue: number | null
  scnPlus: number | null
  decision: string | null
  similarity: number
}

interface SimilarPlayersProps {
  players: SimilarPlayer[]
  currentPlayerId: string
}

const decisionAbbrev: Record<string, string> = {
  CONTRATAR: "CTR",
  BLINDAR: "BLD",
  MONITORAR: "MON",
  EMPRESTIMO: "EMP",
  RECUSAR: "REC",
  ALERTA_CINZA: "ALR",
}

function SimilarityBadge({ value }: { value: number }) {
  const color =
    value > 80
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : value > 60
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${color}`}
    >
      {value}%
    </span>
  )
}

function DecisionDot({ decision }: { decision: string }) {
  const colors = getDecisionColor(decision as CortexDecision)
  const abbrev = decisionAbbrev[decision] ?? decision.slice(0, 3)

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`w-1.5 h-1.5 rounded-full ${colors.bg} border ${colors.border}`}
        style={{ backgroundColor: colors.fill }}
      />
      <span className={`text-[9px] font-mono ${colors.text}`}>{abbrev}</span>
    </span>
  )
}

export function SimilarPlayers({ players, currentPlayerId }: SimilarPlayersProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (players.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <Users className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Nenhum jogador similar encontrado</p>
      </div>
    )
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = direction === "left" ? -200 : 200
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" })
  }

  return (
    <div className="relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm text-zinc-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-500" />
          Jogadores Similares
        </h3>
        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
          {players.length} encontrados
        </span>
      </div>

      {/* Scroll buttons (desktop only) */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/90 transition-all opacity-0 group-hover:opacity-100 hidden md:flex shadow-lg"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-zinc-800/90 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/90 transition-all opacity-0 group-hover:opacity-100 hidden md:flex shadow-lg"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {players.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="flex-shrink-0 snap-start"
          >
            <div className="w-40 rounded-lg bg-zinc-800/40 border border-zinc-700/30 p-3 hover:bg-zinc-800/60 hover:border-zinc-600/40 transition-all duration-200 cursor-pointer">
              {/* Photo + Name */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-600/30">
                  {player.photoUrl ? (
                    <Image
                      src={player.photoUrl}
                      alt={player.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs font-bold text-zinc-500">
                      {player.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-200 font-medium truncate leading-tight">
                    {player.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                    {player.positionDetail ?? player.positionCluster}
                    {player.currentClub ? ` · ${player.currentClub}` : ""}
                  </p>
                </div>
              </div>

              {/* Similarity badge */}
              <div className="flex items-center justify-between mb-1.5">
                <SimilarityBadge value={player.similarity} />
                {player.decision && <DecisionDot decision={player.decision} />}
              </div>

              {/* SCN+ if available */}
              {player.scnPlus != null && (
                <div className="text-[10px] text-zinc-500">
                  SCN+{" "}
                  <span className="font-mono text-cyan-400">
                    {player.scnPlus.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
