"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import {
  Search,
  Star,
  ArrowLeft,
  Loader2,
  Globe,
  Shield,
  Users,
  MapPin,
  Calendar,
  Hash,
  Filter,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface League {
  league: { id: number; name: string; type: string; logo: string }
  country: { name: string; code: string | null; flag: string | null }
}

interface Team {
  team: { id: number; name: string; code: string; country: string; founded: number; logo: string }
  venue: { name: string; city: string; capacity: number }
}

interface SquadPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

interface SquadData {
  team: { id: number; name: string; logo: string }
  players: SquadPlayer[]
}

interface FavLeague {
  id: number
  name: string
  country: string
  logo: string
}

// ---------------------------------------------------------------------------
// Popular leagues (same as ExternalPlayerSearch)
// ---------------------------------------------------------------------------

const POPULAR_LEAGUES: FavLeague[] = [
  { id: 71, name: "Serie A", country: "Brazil", logo: "" },
  { id: 72, name: "Serie B", country: "Brazil", logo: "" },
  { id: 39, name: "Premier League", country: "England", logo: "" },
  { id: 140, name: "La Liga", country: "Spain", logo: "" },
  { id: 135, name: "Serie A", country: "Italy", logo: "" },
  { id: 78, name: "Bundesliga", country: "Germany", logo: "" },
  { id: 61, name: "Ligue 1", country: "France", logo: "" },
  { id: 94, name: "Primeira Liga", country: "Portugal", logo: "" },
  { id: 88, name: "Eredivisie", country: "Netherlands", logo: "" },
  { id: 2, name: "Champions League", country: "World", logo: "" },
  { id: 13, name: "Libertadores", country: "World", logo: "" },
  { id: 128, name: "Liga Argentina", country: "Argentina", logo: "" },
]

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Goleiro",
  Defender: "Defensor",
  Midfielder: "Meio-campista",
  Attacker: "Atacante",
}

const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Defender: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Midfielder: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Attacker: "bg-red-500/20 text-red-400 border-red-500/30",
}

const FAV_KEY = "cortex-fav-leagues"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadFavorites(): FavLeague[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavorites(favs: FavLeague[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
          <Skeleton className="h-12 w-12 rounded-lg mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
  )
}

function LeagueCard({
  league,
  isFav,
  onSelect,
  onToggleFav,
}: {
  league: FavLeague
  isFav: boolean
  onSelect: () => void
  onToggleFav: () => void
}) {
  return (
    <div
      className="group relative bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500/30 hover:bg-zinc-900 transition-all cursor-pointer animate-fade-in"
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFav()
        }}
        className={`absolute top-3 right-3 p-1 rounded-md transition-all ${
          isFav
            ? "text-amber-400 hover:text-amber-300"
            : "text-zinc-700 hover:text-zinc-500 opacity-0 group-hover:opacity-100"
        }`}
        title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Star className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
      </button>
      <div className="flex flex-col items-center gap-3">
        {league.logo ? (
          <Image
            src={league.logo}
            alt={league.name}
            width={48}
            height={48}
            className="object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Shield className="w-6 h-6 text-zinc-600" />
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200 truncate max-w-[140px]">
            {league.name}
          </p>
          <p className="text-xs text-zinc-500">{league.country}</p>
        </div>
      </div>
    </div>
  )
}

function TeamCard({
  team,
  onSelect,
}: {
  team: Team
  onSelect: () => void
}) {
  return (
    <div
      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500/30 hover:bg-zinc-900 transition-all cursor-pointer animate-fade-in"
      onClick={onSelect}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-lg bg-zinc-800/50 flex items-center justify-center overflow-hidden">
          <Image
            src={team.team.logo}
            alt={team.team.name}
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200 truncate max-w-[140px]">
            {team.team.name}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-zinc-600" />
            <span className="text-xs text-zinc-500">{team.venue.city}</span>
          </div>
          {team.team.founded > 0 && (
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] text-zinc-600">Fundado em {team.team.founded}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerCard({ player }: { player: SquadPlayer }) {
  const posClass = POSITION_COLORS[player.position] ?? "bg-zinc-700/20 text-zinc-400 border-zinc-600/30"
  const posLabel = POSITION_LABELS[player.position] ?? player.position

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-zinc-700/50">
            <Image
              src={player.photo}
              alt={player.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
          {player.number != null && (
            <span className="absolute -bottom-1 -right-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {player.number}
            </span>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200 truncate max-w-[130px]">
            {player.name}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{player.age} anos</p>
          <span
            className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium border ${posClass}`}
          >
            {posLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type Step = "leagues" | "teams" | "squad"

export default function ExplorePage() {
  // Navigation state
  const [step, setStep] = useState<Step>("leagues")
  const [selectedLeague, setSelectedLeague] = useState<FavLeague | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  // Data
  const [favorites, setFavorites] = useState<FavLeague[]>([])
  const [searchedLeagues, setSearchedLeagues] = useState<League[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [squad, setSquad] = useState<SquadData | null>(null)

  // UI state
  const [leagueQuery, setLeagueQuery] = useState("")
  const [teamQuery, setTeamQuery] = useState("")
  const [positionFilter, setPositionFilter] = useState("All")
  const [loading, setLoading] = useState(false)
  const [leagueSearchLoading, setLeagueSearchLoading] = useState(false)
  const [error, setError] = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load favorites on mount
  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  // ---------------------------------------------------------------------------
  // League search (debounced)
  // ---------------------------------------------------------------------------

  const searchLeagues = useCallback((q: string) => {
    if (q.length < 3) {
      setSearchedLeagues([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLeagueSearchLoading(true)
      try {
        const res = await fetch(`/api/football/leagues?search=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (data.data) setSearchedLeagues(data.data)
      } catch {
        // ignore
      } finally {
        setLeagueSearchLoading(false)
      }
    }, 400)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Toggle favorite
  // ---------------------------------------------------------------------------

  function toggleFavorite(league: FavLeague) {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === league.id)
      const next = exists ? prev.filter((f) => f.id !== league.id) : [...prev, league]
      saveFavorites(next)
      return next
    })
  }

  // ---------------------------------------------------------------------------
  // Select league -> fetch teams
  // ---------------------------------------------------------------------------

  async function selectLeague(league: FavLeague) {
    setSelectedLeague(league)
    setStep("teams")
    setLoading(true)
    setError("")
    setTeams([])
    setTeamQuery("")

    try {
      const res = await fetch(`/api/football/teams?league=${league.id}&season=2024`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar times")
      setTeams(data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar times")
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Select team -> fetch squad
  // ---------------------------------------------------------------------------

  async function selectTeam(team: Team) {
    setSelectedTeam(team)
    setStep("squad")
    setLoading(true)
    setError("")
    setSquad(null)
    setPositionFilter("All")

    try {
      const res = await fetch(`/api/football/squad?team=${team.team.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar elenco")
      setSquad(data.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar elenco")
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Back navigation
  // ---------------------------------------------------------------------------

  function goBack() {
    if (step === "squad") {
      setStep("teams")
      setSquad(null)
      setSelectedTeam(null)
      setError("")
    } else if (step === "teams") {
      setStep("leagues")
      setTeams([])
      setSelectedLeague(null)
      setError("")
    }
  }

  // ---------------------------------------------------------------------------
  // Filtered data
  // ---------------------------------------------------------------------------

  const filteredTeams = teamQuery
    ? teams.filter(
        (t) =>
          t.team.name.toLowerCase().includes(teamQuery.toLowerCase()) ||
          t.venue.city.toLowerCase().includes(teamQuery.toLowerCase())
      )
    : teams

  const filteredPlayers =
    squad?.players.filter((p) => positionFilter === "All" || p.position === positionFilter) ?? []

  const isFav = (id: number) => favorites.some((f) => f.id === id)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step !== "leagues" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-zinc-400 hover:text-zinc-200 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            {step === "leagues" && "Explorar Ligas"}
            {step === "teams" && selectedLeague?.name}
            {step === "squad" && selectedTeam?.team.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {step === "leagues" && "Selecione uma liga para ver os times"}
            {step === "teams" && `${filteredTeams.length} times na temporada 2024`}
            {step === "squad" &&
              `${squad?.players.length ?? 0} jogadores no elenco`}
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      {step !== "leagues" && (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <button onClick={() => { setStep("leagues"); setSelectedLeague(null); setSelectedTeam(null); setTeams([]); setSquad(null) }} className="hover:text-zinc-400 transition-colors">
            Ligas
          </button>
          <span>/</span>
          {selectedLeague && (
            <>
              <button
                onClick={() => {
                  if (step === "squad") {
                    setStep("teams")
                    setSquad(null)
                    setSelectedTeam(null)
                  }
                }}
                className={step === "squad" ? "hover:text-zinc-400 transition-colors" : "text-zinc-400"}
              >
                {selectedLeague.name}
              </button>
              {step === "squad" && selectedTeam && (
                <>
                  <span>/</span>
                  <span className="text-zinc-400">{selectedTeam.team.name}</span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* ================================================================== */}
      {/* STEP 1: Leagues */}
      {/* ================================================================== */}

      {step === "leagues" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Buscar liga (min. 3 caracteres)..."
              value={leagueQuery}
              onChange={(e) => {
                setLeagueQuery(e.target.value)
                searchLeagues(e.target.value)
              }}
              className="pl-9 bg-zinc-900/80 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
            />
            {leagueSearchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
            )}
          </div>

          {/* Favorites */}
          {favorites.length > 0 && !leagueQuery && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                Ligas Favoritas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((fav) => (
                  <LeagueCard
                    key={fav.id}
                    league={fav}
                    isFav={true}
                    onSelect={() => selectLeague(fav)}
                    onToggleFav={() => toggleFavorite(fav)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {leagueQuery.length >= 3 && searchedLeagues.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Resultados da busca
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchedLeagues.map((l) => {
                  const favLeague: FavLeague = {
                    id: l.league.id,
                    name: l.league.name,
                    country: l.country.name,
                    logo: l.league.logo,
                  }
                  return (
                    <LeagueCard
                      key={l.league.id}
                      league={favLeague}
                      isFav={isFav(l.league.id)}
                      onSelect={() => selectLeague(favLeague)}
                      onToggleFav={() => toggleFavorite(favLeague)}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {leagueQuery.length >= 3 && searchedLeagues.length === 0 && !leagueSearchLoading && (
            <div className="text-center py-12 text-zinc-600">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma liga encontrada para &quot;{leagueQuery}&quot;</p>
            </div>
          )}

          {/* Popular leagues */}
          {!leagueQuery && (
            <div className="space-y-3">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Ligas Populares
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {POPULAR_LEAGUES.map((l) => (
                  <LeagueCard
                    key={l.id}
                    league={l}
                    isFav={isFav(l.id)}
                    onSelect={() => selectLeague(l)}
                    onToggleFav={() => toggleFavorite(l)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* STEP 2: Teams */}
      {/* ================================================================== */}

      {step === "teams" && (
        <div className="space-y-4">
          {/* Search teams */}
          {!loading && teams.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Filtrar times..."
                value={teamQuery}
                onChange={(e) => setTeamQuery(e.target.value)}
                className="pl-9 bg-zinc-900/80 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
          )}

          {loading && <GridSkeleton count={12} />}

          {!loading && filteredTeams.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTeams.map((t) => (
                <TeamCard key={t.team.id} team={t} onSelect={() => selectTeam(t)} />
              ))}
            </div>
          )}

          {!loading && teams.length > 0 && filteredTeams.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum time encontrado para &quot;{teamQuery}&quot;</p>
            </div>
          )}

          {!loading && teams.length === 0 && !error && (
            <div className="text-center py-12 text-zinc-600">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum time encontrado nesta liga</p>
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* STEP 3: Squad */}
      {/* ================================================================== */}

      {step === "squad" && (
        <div className="space-y-4">
          {/* Team header */}
          {selectedTeam && !loading && (
            <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <div className="w-14 h-14 rounded-lg bg-zinc-800/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                  src={selectedTeam.team.logo}
                  alt={selectedTeam.team.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{selectedTeam.team.name}</h2>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedTeam.venue.city}
                  </span>
                  {selectedTeam.venue.name && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {selectedTeam.venue.name}
                    </span>
                  )}
                  {selectedTeam.team.founded > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedTeam.team.founded}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Position filter */}
          {!loading && squad && squad.players.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-zinc-600" />
              {["All", "Goalkeeper", "Defender", "Midfielder", "Attacker"].map((pos) => {
                const label = pos === "All" ? "Todos" : POSITION_LABELS[pos] ?? pos
                const count =
                  pos === "All"
                    ? squad.players.length
                    : squad.players.filter((p) => p.position === pos).length
                const isActive = positionFilter === pos

                return (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isActive
                        ? pos === "All"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : POSITION_COLORS[pos] ?? "bg-zinc-700/20 text-zinc-400 border-zinc-600/30"
                        : "bg-zinc-800/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {loading && <GridSkeleton count={12} />}

          {!loading && filteredPlayers.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          )}

          {!loading && squad && squad.players.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Elenco nao disponivel para este time</p>
            </div>
          )}

          {!loading && squad && squad.players.length > 0 && filteredPlayers.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum jogador nesta posicao</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
