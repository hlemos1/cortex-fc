"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, Users, X, Globe, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { ExternalPlayerSearch } from "@/components/players/ExternalPlayerSearch"
import { EmptyState } from "@/components/ui/empty-state"
import { EmptyStateCTA } from "@/components/cortex/EmptyStateCTA"
import { PlayerAvatar } from "@/components/ui/player-avatar"
import type { CortexDecision } from "@/types/cortex"
import { useSearchPreferences } from "@/hooks/useSearchPreferences"

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
  const { prefs, loaded: prefsLoaded, setSortField: saveSortField, setSortDir: saveSortDir, setFilter: saveFilter, clearFilters: clearSavedFilters } = useSearchPreferences("players")
  const [search, setSearch] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [clubFilter, setClubFilter] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Restore preferences from localStorage after mount
  useEffect(() => {
    if (!prefsLoaded) return
    if (prefs.sortField && ["name", "age", "marketValue", "scn", "position", "club"].includes(prefs.sortField)) {
      setSortField(prefs.sortField as SortField)
    }
    if (prefs.sortDir) {
      setSortDir(prefs.sortDir)
    }
    if (prefs.filters.position) setPositionFilter(prefs.filters.position)
    if (prefs.filters.club) setClubFilter(prefs.filters.club)
  }, [prefsLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save preferences on change
  useEffect(() => {
    if (!prefsLoaded) return
    saveSortField(sortField)
    saveSortDir(sortDir)
    saveFilter("position", positionFilter)
    saveFilter("club", clubFilter)
  }, [sortField, sortDir, positionFilter, clubFilter, prefsLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const activeFilterCount = [positionFilter, clubFilter].filter(Boolean).length + (search ? 1 : 0)

  const sortPills: { field: SortField; label: string }[] = [
    { field: "name", label: "Nome" },
    { field: "age", label: "Idade" },
    { field: "marketValue", label: "Valor" },
    { field: "scn", label: "SCN+" },
    { field: "position", label: "Posicao" },
  ]

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
    <div className="animate-fade-in space-y-6" aria-busy="false">
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

      {/* Search + Filters — Mobile */}
      <div className="md:hidden space-y-3 animate-slide-up stagger-1">
        {/* Search bar mobile */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
          <input
            type="text"
            placeholder="Buscar jogador, clube ou posicao..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-10 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-sm placeholder:text-zinc-500 outline-none transition-all focus:border-emerald-500/50 focus:bg-zinc-800/80 focus:shadow-[0_0_12px_rgba(16,185,129,0.08)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-700/60 text-zinc-400 active:bg-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters toggle mobile */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className={`flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border text-sm transition-all ${
              activeFilterCount > 0
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-zinc-700 bg-zinc-900/80 text-zinc-400"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros{activeFilterCount > 0 && ` (${activeFilterCount})`}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`} />
          </button>
          {(search || positionFilter || clubFilter) && (
            <button
              onClick={() => { setSearch(""); setPositionFilter(""); setClubFilter(""); clearSavedFilters() }}
              className="flex items-center gap-1 min-h-[36px] px-3 rounded-lg border border-zinc-700 bg-zinc-900/80 text-red-400 text-sm active:bg-red-500/10"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        {/* Expandable filter section */}
        {mobileFiltersOpen && (
          <div className="flex flex-col gap-2 animate-expand">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className={`min-h-[36px] rounded-lg border bg-zinc-800/50 px-3 text-sm outline-none transition-all ${
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
              className={`min-h-[36px] rounded-lg border bg-zinc-800/50 px-3 text-sm outline-none transition-all ${
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
          </div>
        )}
      </div>

      {/* Search + Filters — Desktop */}
      <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up stagger-1 hidden md:block">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
              <Input
                placeholder="Buscar jogador, clube ou posicao..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 transition-all focus:border-emerald-500/50 focus:bg-zinc-800/80 focus:shadow-[0_0_12px_rgba(16,185,129,0.08)]"
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
                  onClick={() => { setSearch(""); setPositionFilter(""); setClubFilter(""); clearSavedFilters() }}
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

      {/* Mobile Sort Pills + Cards */}
      <div className="md:hidden space-y-3 animate-slide-up stagger-2">
        {/* Sort pills — horizontal scrollable */}
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
          <div className="flex gap-2 w-max">
            {sortPills.map(({ field, label }) => {
              const isActive = sortField === field
              return (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  style={{ scrollSnapAlign: "start" }}
                  className={`flex items-center gap-1 min-h-[32px] px-3 rounded-full border text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 active:bg-zinc-800"
                  }`}
                >
                  {label}
                  {isActive && (
                    sortDir === "asc"
                      ? <ArrowUp className="w-3 h-3" />
                      : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Player count */}
        <p className="text-xs text-zinc-500">{filtered.length} jogador{filtered.length !== 1 ? "es" : ""}</p>

        {/* Cards */}
        <div className="space-y-2">
          {filtered.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="block bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 active:bg-zinc-800/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar src={player.photoUrl} name={player.name} size={48} className="w-12 h-12 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-200 truncate">{player.name}</p>
                    {player.decision && (
                      <DecisionBadge decision={player.decision} size="sm" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <span>{player.position}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="truncate">{player.club}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/50 flex-wrap">
                <span className="text-xs text-zinc-400 font-mono">&euro;{player.marketValue}M</span>
                {player.vx !== undefined && (
                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Vx {player.vx}
                  </span>
                )}
                {player.rx !== undefined && (
                  <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                    Rx {player.rx}
                  </span>
                )}
                {player.scn !== undefined && (
                  <span className="font-mono text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    SCN+ {player.scn}
                  </span>
                )}
                {player.age && (
                  <span className="text-xs text-zinc-500 ml-auto">{player.age}a</span>
                )}
              </div>
            </Link>
          ))}
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
      </div>

      {/* Desktop Table */}
      <Card className="bg-zinc-900/80 border-zinc-800 animate-slide-up stagger-2 hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Lista de jogadores do elenco com metricas de desempenho</caption>
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th scope="col" className="text-left py-3 px-4 w-8"></th>
                  <th scope="col" className="text-left py-3 px-3" aria-sort={sortField === "name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <SortHeader field="name">Jogador</SortHeader>
                  </th>
                  <th scope="col" className="text-left py-3 px-3" aria-sort={sortField === "position" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <SortHeader field="position">Posicao</SortHeader>
                  </th>
                  <th scope="col" className="text-left py-3 px-3" aria-sort={sortField === "club" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <SortHeader field="club">Clube</SortHeader>
                  </th>
                  <th scope="col" className="text-center py-3 px-3" aria-sort={sortField === "age" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <SortHeader field="age">Idade</SortHeader>
                  </th>
                  <th scope="col" className="text-right py-3 px-3" aria-sort={sortField === "marketValue" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <SortHeader field="marketValue">Valor (M&euro;)</SortHeader>
                  </th>
                  <th scope="col" className="text-center py-3 px-3" aria-sort={sortField === "scn" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <SortHeader field="scn">SCN+</SortHeader>
                  </th>
                  <th scope="col" className="text-center py-3 px-3">
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
                      <p className="text-xs text-zinc-500">{player.nationality}</p>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 text-xs">
                      {player.position}
                      <span className="ml-1 text-zinc-500">({player.positionCluster})</span>
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
                        <span className="text-zinc-500 text-xs">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {player.decision ? (
                        <DecisionBadge decision={player.decision} size="sm" />
                      ) : (
                        <span className="text-zinc-500 text-xs">Sem analise</span>
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
