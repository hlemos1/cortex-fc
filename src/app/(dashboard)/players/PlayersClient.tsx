"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ArrowUpDown, Filter, Users, X, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { ExternalPlayerSearch } from "@/components/players/ExternalPlayerSearch"
import { EmptyState } from "@/components/ui/empty-state"
import { EmptyStateCTA } from "@/components/cortex/EmptyStateCTA"
import { PlayerAvatar } from "@/components/ui/player-avatar"
import type { CortexDecision } from "@/types/cortex"

export interface PlayerListItem {
  id: string
  name: string
  age: number | null
  nationality: string
  position: string
  positionCluster: string
  club: string
  marketValue: number
  salary: number
  contractEnd: string
  photoUrl: string | null
  scn?: number
  decision?: CortexDecision
  vx?: number
  rx?: number
}

type SortField = "name" | "age" | "marketValue" | "scn" | "position" | "club"
type SortDir = "asc" | "desc"

export function PlayersClient({ players }: { players: PlayerListItem[] }) {
  const [search, setSearch] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [clubFilter, setClubFilter] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const positions = useMemo(
    () => [...new Set(players.map((p) => p.positionCluster))].sort(),
    [players]
  )
  const clubs = useMemo(
    () => [...new Set(players.map((p) => p.club))].sort(),
    [players]
  )

  const filtered = useMemo(() => {
    let result = players

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q)
      )
    }

    if (positionFilter) {
      result = result.filter((p) => p.positionCluster === positionFilter)
    }

    if (clubFilter) {
      result = result.filter((p) => p.club === clubFilter)
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break
        case "age": cmp = (a.age ?? 0) - (b.age ?? 0); break
        case "marketValue": cmp = a.marketValue - b.marketValue; break
        case "scn": cmp = (a.scn ?? 0) - (b.scn ?? 0); break
        case "position": cmp = a.position.localeCompare(b.position); break
        case "club": cmp = a.club.localeCompare(b.club); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [players, search, positionFilter, clubFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    const isActive = sortField === field
    return (
      <button
        onClick={() => toggleSort(field)}
        className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${
          isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        {children}
        <ArrowUpDown className={`w-3 h-3 transition-transform ${isActive ? "text-emerald-400 scale-110" : ""}`} />
      </button>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Jogadores</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Base de dados neural — {players.length} jogadores registrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExternalPlayerSearch />
          <Link href="/analysis/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-emerald-900/40 hover:-translate-y-0.5">
              Nova Analise
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up stagger-1">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
              <Input
                placeholder="Buscar jogador, clube ou posicao..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 transition-all focus:border-emerald-500/50 focus:bg-zinc-800/80 focus:shadow-[0_0_12px_rgba(16,185,129,0.08)]"
              />
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className={`h-9 rounded-md border bg-zinc-800/50 px-3 text-sm outline-none transition-all ${
                  positionFilter
                    ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/5"
                    : "border-zinc-700 text-zinc-300"
                } focus:border-emerald-500`}
              >
                <option value="">Todas Posicoes</option>
                {positions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
                className={`h-9 rounded-md border bg-zinc-800/50 px-3 text-sm outline-none transition-all ${
                  clubFilter
                    ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/5"
                    : "border-zinc-700 text-zinc-300"
                } focus:border-emerald-500`}
              >
                <option value="">Todos Clubes</option>
                {clubs.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {(search || positionFilter || clubFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(""); setPositionFilter(""); setClubFilter("") }}
                  className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2 animate-slide-up stagger-2">
        {filtered.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="block bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 active:bg-zinc-800/60 transition-all"
          >
            <div className="flex items-center gap-3">
              <PlayerAvatar src={player.photoUrl} name={player.name} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-200 truncate">{player.name}</p>
                  {player.decision ? (
                    <DecisionBadge decision={player.decision} size="sm" />
                  ) : (
                    <span className="text-zinc-700 text-[10px] flex-shrink-0">Sem analise</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  <span>{player.position}</span>
                  <span className="text-zinc-700">·</span>
                  <span>{player.club}</span>
                  {player.age && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span>{player.age}a</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-zinc-800/50">
              <span className="text-xs text-zinc-400 font-mono">&euro;{player.marketValue}M</span>
              {player.scn !== undefined && (
                <span className="font-mono text-cyan-400 text-[10px] font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                  SCN+ {player.scn}
                </span>
              )}
              <span className="text-[10px] text-zinc-600 ml-auto">{player.nationality}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && players.length === 0 && (
          <EmptyStateCTA
            icon={<Users className="w-6 h-6" />}
            title="Nenhum jogador na base"
            description="Importe jogadores do banco mundial ou explore ligas e times."
            primaryAction={{ label: "Importar Jogadores", href: "/players" }}
            secondaryAction={{ label: "Explorar Ligas", href: "/players/explore" }}
          />
        )}
        {filtered.length === 0 && players.length > 0 && (
          <EmptyState
            icon={Search}
            secondaryIcon={Filter}
            title="Nenhum jogador encontrado"
            description="Tente ajustar os filtros de busca"
          />
        )}
      </div>

      {/* Desktop Table */}
      <Card className="bg-zinc-900/80 border-zinc-800 animate-slide-up stagger-2 hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left py-3 px-4 w-8"></th>
                  <th className="text-left py-3 px-3">
                    <SortHeader field="name">Jogador</SortHeader>
                  </th>
                  <th className="text-left py-3 px-3">
                    <SortHeader field="position">Posicao</SortHeader>
                  </th>
                  <th className="text-left py-3 px-3">
                    <SortHeader field="club">Clube</SortHeader>
                  </th>
                  <th className="text-center py-3 px-3">
                    <SortHeader field="age">Idade</SortHeader>
                  </th>
                  <th className="text-right py-3 px-3">
                    <SortHeader field="marketValue">Valor (M&euro;)</SortHeader>
                  </th>
                  <th className="text-center py-3 px-3">
                    <SortHeader field="scn">SCN+</SortHeader>
                  </th>
                  <th className="text-center py-3 px-3">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Decisao
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player, index) => (
                  <tr
                    key={player.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-all duration-200 border-l-2 border-l-transparent hover:border-l-emerald-500 animate-slide-up"
                    style={{ animationDelay: `${(index + 1) * 40}ms` }}
                  >
                    <td className="py-3 px-4">
                      <PlayerAvatar src={player.photoUrl} name={player.name} size={32} />
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/players/${player.id}`}
                        className="text-zinc-200 font-medium hover:text-emerald-400 transition-colors"
                      >
                        {player.name}
                      </Link>
                      <p className="text-[11px] text-zinc-600">{player.nationality}</p>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 text-xs">
                      {player.position}
                      <span className="ml-1 text-zinc-600">({player.positionCluster})</span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 text-xs">{player.club}</td>
                    <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">
                      {player.age ?? "—"}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-300 font-mono text-xs">
                      &euro;{player.marketValue}M
                    </td>
                    <td className="py-3 px-3 text-center">
                      {player.scn !== undefined ? (
                        <span className="font-mono text-cyan-400 text-xs font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          {player.scn}
                        </span>
                      ) : (
                        <span className="text-zinc-700 text-xs">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {player.decision ? (
                        <DecisionBadge decision={player.decision} size="sm" />
                      ) : (
                        <span className="text-zinc-700 text-xs">Sem analise</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && players.length === 0 && (
            <EmptyStateCTA
              icon={<Users className="w-6 h-6" />}
              title="Nenhum jogador na base"
              description="Importe jogadores do banco mundial ou explore ligas e times."
              primaryAction={{ label: "Importar Jogadores", href: "/players" }}
              secondaryAction={{ label: "Explorar Ligas", href: "/players/explore" }}
            />
          )}
          {filtered.length === 0 && players.length > 0 && (
            <EmptyState
              icon={Search}
              secondaryIcon={Filter}
              title="Nenhum jogador encontrado"
              description="Tente ajustar os filtros de busca"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
