"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import { Search, Globe, Loader2, UserPlus, Check, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { useToast } from "@/components/ui/toast"

interface ExternalPlayer {
  player: {
    id: number
    name: string
    firstname: string
    lastname: string
    age: number
    nationality: string
    height: string | null
    weight: string | null
    photo: string
    birth: { date: string; country: string }
  }
  statistics: Array<{
    team: { id: number; name: string }
    league: { id: number; name: string }
    games: {
      position: string
      appearences: number
      minutes: number
    }
    goals: { total: number | null }
    passes: { total: number | null; accuracy: number | null }
  }>
}

interface League {
  league: { id: number; name: string; type: string; logo: string }
  country: { name: string; code: string | null; flag: string | null }
}

const POPULAR_LEAGUES = [
  { id: 71, name: "Serie A", country: "Brazil" },
  { id: 72, name: "Serie B", country: "Brazil" },
  { id: 39, name: "Premier League", country: "England" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 135, name: "Serie A", country: "Italy" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 61, name: "Ligue 1", country: "France" },
  { id: 94, name: "Primeira Liga", country: "Portugal" },
  { id: 88, name: "Eredivisie", country: "Netherlands" },
  { id: 2, name: "Champions League", country: "World" },
  { id: 13, name: "Libertadores", country: "World" },
  { id: 128, name: "Liga Argentina", country: "Argentina" },
]

export function ExternalPlayerSearch() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [leagueSearch, setLeagueSearch] = useState("")
  const [searchedLeagues, setSearchedLeagues] = useState<League[]>([])
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false)
  const [results, setResults] = useState<ExternalPlayer[]>([])
  const [selectedSeason, setSelectedSeason] = useState(2024)
  const [loading, setLoading] = useState(false)
  const [leagueLoading, setLeagueLoading] = useState(false)
  const [imported, setImported] = useState<Map<number, "importing" | "done">>(new Map())
  const [error, setError] = useState("")
  const [paging, setPaging] = useState<{ current: number; total: number } | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [batchImporting, setBatchImporting] = useState(false)

  const selectedLeagueName = POPULAR_LEAGUES.find(l => l.id === selectedLeague)?.name
    ?? searchedLeagues.find(l => l.league.id === selectedLeague)?.league.name
    ?? ""

  const leagueDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchLeagues = useCallback((q: string) => {
    if (q.length < 3) return
    if (leagueDebounceRef.current) clearTimeout(leagueDebounceRef.current)
    leagueDebounceRef.current = setTimeout(async () => {
      setLeagueLoading(true)
      try {
        const res = await fetch(`/api/football/leagues?search=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (data.data) setSearchedLeagues(data.data)
      } catch {
        // ignore
      } finally {
        setLeagueLoading(false)
      }
    }, 400)
  }, [])

  const searchPlayers = useCallback(async (page = 1) => {
    if (!query || query.length < 4 || !selectedLeague) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch(
        `/api/players/search-external?q=${encodeURIComponent(query)}&league=${selectedLeague}&season=${selectedSeason}&page=${page}`
      )
      const data = await res.json()

      if (!res.ok) {
        const msg = data.error ?? "Erro na busca"
        if (msg.includes("Free plans")) {
          toast({ type: "warning", title: "Temporada indisponivel", description: "Plano gratuito: use 2022-2024" })
          setError("Temporada nao disponivel no plano gratuito. Use 2022-2024.")
        } else {
          toast({ type: "error", title: msg })
          setError(msg)
        }
        return
      }

      if (page === 1) {
        setResults(data.data)
        setSelected(new Set())
        setExpandedPlayer(null)
      } else {
        setResults(prev => [...prev, ...data.data])
      }
      setPaging(data.paging)
      setTotalResults(data.results)
    } catch {
      setError("Erro de conexao")
    } finally {
      setLoading(false)
    }
  }, [query, selectedLeague, selectedSeason, toast])

  // Auto-debounce player search
  useEffect(() => {
    if (playerDebounceRef.current) clearTimeout(playerDebounceRef.current)
    if (query.length >= 4 && selectedLeague) {
      playerDebounceRef.current = setTimeout(() => {
        searchPlayers(1)
      }, 500)
    }
    return () => {
      if (playerDebounceRef.current) clearTimeout(playerDebounceRef.current)
    }
  }, [query, selectedLeague, selectedSeason, searchPlayers])

  useEffect(() => {
    return () => {
      if (leagueDebounceRef.current) clearTimeout(leagueDebounceRef.current)
      if (playerDebounceRef.current) clearTimeout(playerDebounceRef.current)
    }
  }, [])

  async function importPlayer(externalId: number) {
    setImported(prev => new Map(prev).set(externalId, "importing"))
    try {
      const res = await fetch("/api/players/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setImported(prev => { const n = new Map(prev); n.delete(externalId); return n })
        toast({ type: "error", title: data.error ?? "Erro ao importar" })
        return
      }

      setImported(prev => new Map(prev).set(externalId, "done"))
      toast({ type: "success", title: "Jogador importado com sucesso" })
    } catch {
      setImported(prev => { const n = new Map(prev); n.delete(externalId); return n })
      toast({ type: "error", title: "Erro ao importar jogador", description: "Tente novamente em alguns segundos" })
    }
  }

  async function batchImport() {
    if (selected.size === 0) return
    setBatchImporting(true)
    const ids = Array.from(selected)
    for (const id of ids) {
      if (imported.get(id) === "done") continue
      await importPlayer(id)
    }
    setSelected(new Set())
    setBatchImporting(false)
  }

  function toggleSelected(playerId: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }

  const activeSelected = Array.from(selected).filter(id => imported.get(id) !== "done").length

  return (
    <Sheet onOpenChange={(open) => {
      if (!open) {
        setResults([])
        setError("")
        setSelected(new Set())
        setExpandedPlayer(null)
      }
    }}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
        >
          <Globe className="w-4 h-4 mr-2" />
          Buscar Jogador Mundial
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-zinc-950 border-zinc-800 flex flex-col"
        showCloseButton
      >
        <SheetHeader className="border-b border-zinc-800 pb-3">
          <SheetTitle className="text-lg text-zinc-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Busca Mundial — API-Football
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500 flex items-center justify-between">
            <span>1.200+ ligas, 100 requisicoes/dia (plano gratuito)</span>
            <span className="font-mono text-emerald-500/70">~100 req/dia</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {/* League Selector */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Liga</label>
            <div className="relative">
              <button
                onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
                className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-left flex items-center justify-between text-zinc-300 hover:border-zinc-600 transition-colors"
              >
                {selectedLeague ? `${selectedLeagueName} (ID: ${selectedLeague})` : "Selecione uma liga..."}
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>

              {showLeagueDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-xl max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-zinc-700">
                    <Input
                      placeholder="Buscar liga..."
                      value={leagueSearch}
                      onChange={(e) => {
                        setLeagueSearch(e.target.value)
                        searchLeagues(e.target.value)
                      }}
                      className="h-8 bg-zinc-900 border-zinc-600 text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="py-1">
                    <div className="px-2 py-1 text-[10px] text-zinc-600 uppercase tracking-wider">
                      Ligas populares
                    </div>
                    {POPULAR_LEAGUES.map(l => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setSelectedLeague(l.id)
                          setShowLeagueDropdown(false)
                          setLeagueSearch("")
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700/50 transition-colors flex items-center justify-between ${
                          selectedLeague === l.id ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-300"
                        }`}
                      >
                        <span>{l.name}</span>
                        <span className="text-xs text-zinc-500">{l.country}</span>
                      </button>
                    ))}
                    {searchedLeagues.length > 0 && (
                      <>
                        <div className="px-2 py-1 mt-2 text-[10px] text-zinc-600 uppercase tracking-wider border-t border-zinc-700">
                          Resultados da busca
                        </div>
                        {searchedLeagues.map(l => (
                          <button
                            key={l.league.id}
                            onClick={() => {
                              setSelectedLeague(l.league.id)
                              setShowLeagueDropdown(false)
                              setLeagueSearch("")
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700/50 transition-colors flex items-center justify-between ${
                              selectedLeague === l.league.id ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-300"
                            }`}
                          >
                            <span>{l.league.name}</span>
                            <span className="text-xs text-zinc-500">{l.country.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {leagueLoading && (
                      <div className="px-3 py-2 text-xs text-zinc-500 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Buscando ligas...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Season Selector */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Temporada</label>
            <div className="flex gap-2">
              {[2024, 2023, 2022].map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedSeason(year)}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono transition-all ${
                    selectedSeason === year
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  {year}/{String(year + 1).slice(2)}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600">Plano gratuito: temporadas 2022 a 2024</p>
          </div>

          {/* Player Name Search — auto-debounce, no button */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Nome do jogador (min. 4 caracteres)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-spin" />
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">
                {totalResults} jogadores encontrados
              </p>
              <div className="space-y-1">
                {results.map((r) => {
                  const stats = r.statistics?.[0]
                  const importStatus = imported.get(r.player.id)
                  const isImporting = importStatus === "importing"
                  const isImported = importStatus === "done"
                  const isExpanded = expandedPlayer === r.player.id
                  const isChecked = selected.has(r.player.id)

                  return (
                    <div key={r.player.id}>
                      <div
                        className={`flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/60 border transition-all group cursor-pointer ${
                          isChecked ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800/50"
                        }`}
                        onClick={() => setExpandedPlayer(isExpanded ? null : r.player.id)}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelected(r.player.id) }}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-zinc-600 hover:border-zinc-400"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-zinc-950" />}
                        </button>

                        {/* Expand indicator */}
                        <ChevronRight className={`w-3 h-3 text-zinc-600 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />

                        {/* Photo */}
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden ring-1 ring-zinc-700/50 flex-shrink-0">
                          <Image
                            src={r.player.photo}
                            alt={r.player.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-200 truncate">
                              {r.player.name}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-mono">
                              #{r.player.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{r.player.nationality}</span>
                            <span>·</span>
                            <span>{r.player.age} anos</span>
                            {stats && (
                              <>
                                <span>·</span>
                                <span className="truncate">{stats.team?.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Import button */}
                        <Button
                          size="sm"
                          variant={isImported ? "ghost" : "outline"}
                          disabled={isImported || isImporting}
                          onClick={(e) => { e.stopPropagation(); importPlayer(r.player.id) }}
                          className={
                            isImported
                              ? "text-emerald-400 cursor-default"
                              : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          }
                        >
                          {isImporting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isImported ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                        </Button>
                      </div>

                      {/* Expanded stats panel */}
                      {isExpanded && stats && (
                        <div className="ml-7 mt-1 mb-2 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 animate-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-4 gap-3">
                            <div className="text-center">
                              <div className="text-zinc-300 font-mono text-sm">{stats.games?.minutes ?? 0}</div>
                              <div className="text-[10px] text-zinc-500">minutos</div>
                            </div>
                            <div className="text-center">
                              <div className="text-zinc-300 font-mono text-sm">{stats.passes?.total ?? 0}</div>
                              <div className="text-[10px] text-zinc-500">passes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-zinc-300 font-mono text-sm">{stats.passes?.accuracy ?? 0}%</div>
                              <div className="text-[10px] text-zinc-500">precisao</div>
                            </div>
                            <div className="text-center">
                              <div className="text-zinc-300 font-mono text-sm">{stats.goals?.total ?? 0}</div>
                              <div className="text-[10px] text-zinc-500">gols</div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                            <span>{stats.games?.position}</span>
                            <span>·</span>
                            <span>{stats.games?.appearences ?? 0} jogos</span>
                            <span>·</span>
                            <span>{stats.league?.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Load more */}
              {paging && paging.current < paging.total && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => searchPlayers(paging.current + 1)}
                  disabled={loading}
                  className="w-full text-zinc-500 hover:text-emerald-400 text-xs mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  Carregar mais (pagina {paging.current}/{paging.total})
                </Button>
              )}
            </div>
          )}

          {results.length === 0 && !loading && !error && query.length >= 4 && selectedLeague && (
            <div className="text-center py-6 text-zinc-600 text-sm">
              Buscando automaticamente...
            </div>
          )}
        </div>

        {/* Footer with batch import */}
        {activeSelected > 0 && (
          <SheetFooter className="border-t border-zinc-800">
            <Button
              onClick={batchImport}
              disabled={batchImporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {batchImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Importar {activeSelected} selecionado{activeSelected > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
