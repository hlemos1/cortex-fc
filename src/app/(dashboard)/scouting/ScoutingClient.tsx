"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Crosshair,
  Filter,
  GitCompare,
  Kanban,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Plus,
  Bell,
  Share2,
  Bot,
  Trash2,
  GripVertical,
  AlertTriangle,
  Clock,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import type { ScoutingPlayerUI } from "@/lib/db-transforms"
import type { CortexDecision } from "@/types/cortex"

// ============================================
// Types
// ============================================

interface ScoutingTarget {
  id: string
  playerId: string
  playerName: string
  playerAge: number | null
  playerNationality: string
  playerPosition: string | null
  playerCluster: string
  playerMarketValue: number | null
  playerPhoto: string | null
  clubName: string | null
  priority: string
  status: string
  notes: string | null
  targetPrice: number | null
  createdAt: string
  updatedAt: string
  analysis: {
    vx: number
    rx: number
    scnPlus: number | null
    decision: string
    confidence: number
  } | null
}

interface Alert {
  id: string
  type: string
  severity: string
  title: string
  description: string
  playerId: string
  playerName: string
}

interface ScoutCandidate {
  name: string
  age: number
  club: string
  marketValue: number
  fitScore: number
  strengths: string[]
  risks: string[]
}

// ============================================
// Pipeline config
// ============================================

type PipelineStatus = "watching" | "contacted" | "negotiating" | "closed" | "passed"

const STATUS_CONFIG: Record<PipelineStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  watching: { label: "Observando", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", icon: Eye },
  contacted: { label: "Contatado", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", icon: MessageSquare },
  negotiating: { label: "Negociando", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", icon: CheckCircle2 },
  closed: { label: "Fechado", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20", icon: CheckCircle2 },
  passed: { label: "Descartado", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", icon: XCircle },
}

const PIPELINE_STAGES: PipelineStatus[] = ["watching", "contacted", "negotiating", "closed"]

// ============================================
// Props
// ============================================

interface Props {
  scoutingTargets: ScoutingPlayerUI[]
  initialTargets?: ScoutingTarget[]
}

export function ScoutingClient({ scoutingTargets, initialTargets }: Props) {
  const [search, setSearch] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"targets" | "compare" | "pipeline" | "scout" | "alerts">("targets")

  // CRUD state
  const [targets, setTargets] = useState<ScoutingTarget[]>(initialTargets ?? [])
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [addPlayerSearch, setAddPlayerSearch] = useState("")
  const [addSearchResults, setAddSearchResults] = useState<Array<{ id: string; name: string; position: string; club: string }>>([])

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  // Scout agent
  const [scoutForm, setScoutForm] = useState({
    position: "CM",
    ageMin: 20,
    ageMax: 28,
    budgetMax: 30,
    style: "",
    leaguePreference: "",
    mustHaveTraits: "",
  })
  const [scoutResults, setScoutResults] = useState<ScoutCandidate[] | null>(null)
  const [scoutReasoning, setScoutReasoning] = useState("")
  const [scoutLoading, setScoutLoading] = useState(false)
  const [scoutError, setScoutError] = useState("")

  // Share
  const [shareUrl, setShareUrl] = useState("")
  const [sharing, setSharing] = useState(false)

  // Drag state
  const [draggedTarget, setDraggedTarget] = useState<string | null>(null)

  const positions = useMemo(
    () => [...new Set(scoutingTargets.map((p) => p.positionCluster))].sort(),
    [scoutingTargets]
  )

  const filtered = useMemo(() => {
    let result = scoutingTargets
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
    result = result.filter(
      (p) => p.marketValue >= priceRange[0] && p.marketValue <= priceRange[1]
    )
    return result
  }, [scoutingTargets, search, positionFilter, priceRange])

  // Pipeline grouped by status
  const pipelineByStatus = useMemo(() => {
    const grouped: Record<PipelineStatus, ScoutingTarget[]> = {
      watching: [],
      contacted: [],
      negotiating: [],
      closed: [],
      passed: [],
    }
    targets.forEach((t) => {
      const status = t.status as PipelineStatus
      if (grouped[status]) {
        grouped[status].push(t)
      }
    })
    return grouped
  }, [targets])

  const selectedPlayers = useMemo(() => {
    return selectedForCompare
      .map((id) => scoutingTargets.find((p) => p.id === id))
      .filter(Boolean) as ScoutingPlayerUI[]
  }, [selectedForCompare, scoutingTargets])

  function toggleCompareSelection(playerId: string) {
    setSelectedForCompare((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId)
      if (prev.length >= 3) return prev
      return [...prev, playerId]
    })
  }

  // ============================================
  // CRUD operations
  // ============================================

  async function searchPlayersToAdd(q: string) {
    if (q.length < 2) { setAddSearchResults([]); return }
    try {
      const res = await fetch(`/api/players?search=${encodeURIComponent(q)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setAddSearchResults(
          (data.data ?? []).map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            position: p.positionDetail ?? p.positionCluster,
            club: (p.currentClub as Record<string, string>)?.name ?? "—",
          }))
        )
      }
    } catch {}
  }

  async function addTarget(playerId: string) {
    try {
      const res = await fetch("/api/scouting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, priority: "medium" }),
      })
      if (res.ok) {
        // Refresh targets
        await refreshTargets()
        setAddingPlayer(false)
        setAddPlayerSearch("")
        setAddSearchResults([])
      }
    } catch {}
  }

  async function updateTarget(targetId: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/scouting/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setTargets((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, ...updates } as ScoutingTarget : t))
        )
      }
    } catch {}
  }

  async function deleteTarget(targetId: string) {
    try {
      const res = await fetch(`/api/scouting/${targetId}`, { method: "DELETE" })
      if (res.ok) {
        setTargets((prev) => prev.filter((t) => t.id !== targetId))
      }
    } catch {}
  }

  async function refreshTargets() {
    try {
      const res = await fetch("/api/scouting")
      if (res.ok) {
        const data = await res.json()
        setTargets(data.data ?? [])
      }
    } catch {}
  }

  // ============================================
  // Drag and drop for pipeline
  // ============================================

  function handleDragStart(targetId: string) {
    setDraggedTarget(targetId)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(newStatus: PipelineStatus) {
    if (draggedTarget) {
      updateTarget(draggedTarget, { status: newStatus })
      setDraggedTarget(null)
    }
  }

  // ============================================
  // Alerts
  // ============================================

  async function loadAlerts() {
    setAlertsLoading(true)
    try {
      const res = await fetch("/api/scouting/alerts")
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.data ?? [])
      }
    } catch {}
    setAlertsLoading(false)
  }

  useEffect(() => {
    if (activeTab === "alerts" && alerts.length === 0) {
      loadAlerts()
    }
  }, [activeTab])

  // ============================================
  // SCOUT agent
  // ============================================

  async function runScoutAgent() {
    setScoutLoading(true)
    setScoutError("")
    setScoutResults(null)
    try {
      const res = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: scoutForm.position,
          ageRange: [scoutForm.ageMin, scoutForm.ageMax],
          budgetMax: scoutForm.budgetMax,
          style: scoutForm.style,
          leaguePreference: scoutForm.leaguePreference ? scoutForm.leaguePreference.split(",").map((s) => s.trim()) : [],
          mustHaveTraits: scoutForm.mustHaveTraits ? scoutForm.mustHaveTraits.split(",").map((s) => s.trim()) : [],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setScoutResults(data.data?.candidates ?? [])
        setScoutReasoning(data.data?.reasoning ?? "")
      } else {
        const err = await res.json()
        setScoutError(err.error ?? "Erro ao executar SCOUT")
      }
    } catch {
      setScoutError("Erro de conexao")
    }
    setScoutLoading(false)
  }

  // ============================================
  // Share
  // ============================================

  async function shareShortlist() {
    const targetIds = targets
      .filter((t) => t.status !== "passed")
      .map((t) => t.id)
    if (targetIds.length === 0) return

    setSharing(true)
    try {
      const res = await fetch("/api/scouting/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIds }),
      })
      if (res.ok) {
        const data = await res.json()
        setShareUrl(data.data?.url ?? "")
      }
    } catch {}
    setSharing(false)
  }

  // ============================================
  // Tabs
  // ============================================

  const tabs = [
    { id: "targets" as const, label: "Alvos", icon: Crosshair },
    { id: "pipeline" as const, label: "Pipeline", icon: Kanban },
    { id: "scout" as const, label: "SCOUT IA", icon: Bot },
    { id: "alerts" as const, label: "Alertas", icon: Bell },
    { id: "compare" as const, label: "Comparar", icon: GitCompare },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Scouting Intelligence
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pipeline completo de prospeccao, analise e negociacao
          </p>
        </div>
        <div className="flex items-center gap-2">
          {targets.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={shareShortlist}
              disabled={sharing}
              className="text-zinc-500 hover:text-emerald-400"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Compartilhar
            </Button>
          )}
          {selectedForCompare.length >= 2 && (
            <Link href={`/scouting/compare?ids=${selectedForCompare.join(",")}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
                <GitCompare className="w-4 h-4 mr-2" />
                Comparar ({selectedForCompare.length})
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Share URL */}
      {shareUrl && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 animate-fade-in">
          <Share2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-xs text-emerald-400 font-mono outline-none"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-emerald-400 text-xs"
            onClick={() => { navigator.clipboard.writeText(shareUrl); }}
          >
            Copiar
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="relative flex gap-1 glass rounded-xl p-1.5 w-fit animate-slide-up stagger-1 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "text-emerald-400 bg-zinc-800/80 shadow-lg shadow-emerald-900/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
              }`}
            >
              {isActive && (
                <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              )}
              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : ""}`} />
              {tab.label}
              {tab.id === "alerts" && alerts.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
              {tab.id === "compare" && selectedForCompare.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                  {selectedForCompare.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filters (targets & compare tabs) */}
      {(activeTab === "targets" || activeTab === "compare") && (
        <div className="glass rounded-xl p-4 animate-slide-up stagger-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Buscar alvo por nome, clube ou posicao..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-200 placeholder:text-zinc-600 rounded-lg"
              />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="h-9 rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 text-sm text-zinc-300 outline-none"
              >
                <option value="">Todas Posicoes</option>
                {positions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 whitespace-nowrap">Valor:</span>
                <Input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-20 h-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono rounded-lg"
                />
                <span className="text-zinc-600">-</span>
                <Input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-20 h-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono rounded-lg"
                />
                <span className="text-xs text-zinc-600">&euro;</span>
              </div>
              {(search || positionFilter || priceRange[0] > 0 || priceRange[1] < 200) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(""); setPositionFilter(""); setPriceRange([0, 200]) }}
                  className="text-zinc-500 hover:text-emerald-400"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TARGETS TAB */}
      {/* ============================================ */}
      {activeTab === "targets" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                {filtered.length} alvos encontrados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-zinc-600">Selecione 2-3 para comparar</p>
              <Button
                size="sm"
                onClick={() => setAddingPlayer(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar ao Pipeline
              </Button>
            </div>
          </div>

          {/* Add Player Modal */}
          {addingPlayer && (
            <Card className="bg-zinc-900/95 border-emerald-500/20 animate-slide-up">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-white font-medium">Adicionar jogador ao pipeline</p>
                  <button onClick={() => { setAddingPlayer(false); setAddSearchResults([]) }} className="text-zinc-500 hover:text-red-400">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Buscar jogador..."
                    value={addPlayerSearch}
                    onChange={(e) => {
                      setAddPlayerSearch(e.target.value)
                      searchPlayersToAdd(e.target.value)
                    }}
                    className="pl-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-200"
                  />
                </div>
                {addSearchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {addSearchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addTarget(p.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm text-white">{p.name}</p>
                          <p className="text-[10px] text-zinc-500">{p.position} — {p.club}</p>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-500" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Targets Table */}
          <Card className="bg-zinc-900/80 border-zinc-800/80 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      <th className="text-left py-3.5 px-4 w-10">
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sel</span>
                      </th>
                      <th className="text-left py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Jogador</span></th>
                      <th className="text-left py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Posicao</span></th>
                      <th className="text-left py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Clube</span></th>
                      <th className="text-center py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Idade</span></th>
                      <th className="text-right py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Valor</span></th>
                      <th className="text-center py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Vx</span></th>
                      <th className="text-center py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Rx</span></th>
                      <th className="text-center py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">SCN+</span></th>
                      <th className="text-center py-3.5 px-3"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Decisao</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((player, idx) => {
                      const isSelected = selectedForCompare.includes(player.id)
                      return (
                        <tr
                          key={player.id}
                          className={`border-b border-zinc-800/30 transition-all duration-200 group ${
                            isSelected
                              ? "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] border-l-2 border-l-emerald-500"
                              : `hover:bg-emerald-500/[0.03] border-l-2 border-l-transparent ${idx % 2 === 0 ? "bg-transparent" : "bg-zinc-800/[0.12]"}`
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleCompareSelection(player.id)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-zinc-700 hover:border-emerald-500/50"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <Link href={`/players/${player.id}`} className="flex items-center gap-2 group/link">
                              <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center border border-zinc-700/50">
                                <User className="w-4 h-4 text-zinc-500" />
                              </div>
                              <div>
                                <span className="text-zinc-200 font-medium group-hover/link:text-emerald-400 transition-colors">{player.name}</span>
                                <p className="text-[11px] text-zinc-600">{player.nationality}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-zinc-400 text-xs">{player.position}</td>
                          <td className="py-3 px-3 text-zinc-400 text-xs">{player.club}</td>
                          <td className="py-3 px-3 text-center text-zinc-400 font-mono text-xs">{player.age}</td>
                          <td className="py-3 px-3 text-right text-zinc-300 font-mono text-xs">&euro;{player.marketValue}M</td>
                          <td className="py-3 px-3 text-center">
                            {player.vx !== undefined ? (
                              <span className="font-mono text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-500/[0.08]">{player.vx.toFixed(2)}</span>
                            ) : <span className="text-zinc-700 text-xs">--</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.rx !== undefined ? (
                              <span className="font-mono text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-500/[0.08]">{player.rx.toFixed(2)}</span>
                            ) : <span className="text-zinc-700 text-xs">--</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.scn !== undefined ? (
                              <span className="font-mono text-cyan-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/[0.08]">{player.scn}</span>
                            ) : <span className="text-zinc-700 text-xs">--</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.decision ? <DecisionBadge decision={player.decision} size="sm" /> : <span className="text-zinc-700 text-xs">Sem analise</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-zinc-600 text-sm">Nenhum alvo encontrado com os filtros atuais.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================ */}
      {/* PIPELINE TAB (Kanban with drag-and-drop) */}
      {/* ============================================ */}
      {activeTab === "pipeline" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Pipeline — {targets.length} alvos no funil
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => { setActiveTab("targets"); setAddingPlayer(true) }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIPELINE_STAGES.map((status) => {
              const config = STATUS_CONFIG[status]
              const Icon = config.icon
              const stageTargets = pipelineByStatus[status]

              return (
                <div
                  key={status}
                  className="space-y-3"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status)}
                >
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${config.borderColor} ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                    <Badge variant="secondary" className={`ml-auto ${config.bgColor} ${config.color} border ${config.borderColor} text-[10px] px-2 py-0.5 font-bold`}>
                      {stageTargets.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 min-h-[120px]">
                    {stageTargets.map((target) => (
                      <Card
                        key={target.id}
                        draggable
                        onDragStart={() => handleDragStart(target.id)}
                        className={`bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700 transition-all p-3 cursor-grab active:cursor-grabbing group ${
                          draggedTarget === target.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-3 h-3 text-zinc-700 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <Link href={`/players/${target.playerId}`}>
                                <p className="text-sm font-semibold text-zinc-100 truncate hover:text-emerald-400 transition-colors">
                                  {target.playerName}
                                </p>
                              </Link>
                              <button
                                onClick={() => deleteTarget(target.id)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {target.playerPosition ?? target.playerCluster} — {target.clubName ?? "—"}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-[10px] text-zinc-400 font-mono">&euro;{target.playerMarketValue ?? 0}M</span>
                              {target.analysis && (
                                <>
                                  <span className="text-[10px] font-mono text-emerald-400 px-1 py-0.5 rounded bg-emerald-500/[0.08]">
                                    Vx {target.analysis.vx.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-mono text-red-400 px-1 py-0.5 rounded bg-red-500/[0.08]">
                                    Rx {target.analysis.rx.toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>
                            {target.analysis && (
                              <div className="mt-2">
                                <DecisionBadge decision={target.analysis.decision as CortexDecision} size="sm" />
                              </div>
                            )}
                            {/* Priority selector */}
                            <div className="flex items-center gap-1 mt-2">
                              {(["high", "medium", "low"] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => updateTarget(target.id, { priority: p })}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${
                                    target.priority === p
                                      ? p === "high"
                                        ? "bg-red-500/20 text-red-400"
                                        : p === "medium"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-zinc-500/20 text-zinc-400"
                                      : "text-zinc-700 hover:text-zinc-500"
                                  }`}
                                >
                                  {p === "high" ? "Alta" : p === "medium" ? "Media" : "Baixa"}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {stageTargets.length === 0 && (
                      <div className="py-8 text-center text-zinc-700 text-xs border border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/30">
                        Arraste alvos aqui
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SCOUT IA TAB */}
      {/* ============================================ */}
      {activeTab === "scout" && (
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-zinc-900/80 border-zinc-800 glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-500" />
                SCOUT Agent — Busca Inteligente de Alvos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Posicao</label>
                  <select
                    value={scoutForm.position}
                    onChange={(e) => setScoutForm({ ...scoutForm, position: e.target.value })}
                    className="w-full h-9 rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 text-sm text-zinc-300 outline-none"
                  >
                    {["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Idade min-max</label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={scoutForm.ageMin}
                      onChange={(e) => setScoutForm({ ...scoutForm, ageMin: Number(e.target.value) })}
                      className="w-full h-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono"
                    />
                    <Input
                      type="number"
                      value={scoutForm.ageMax}
                      onChange={(e) => setScoutForm({ ...scoutForm, ageMax: Number(e.target.value) })}
                      className="w-full h-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Orcamento max (M&euro;)</label>
                  <Input
                    type="number"
                    value={scoutForm.budgetMax}
                    onChange={(e) => setScoutForm({ ...scoutForm, budgetMax: Number(e.target.value) })}
                    className="h-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Estilo de jogo desejado</label>
                <Input
                  placeholder="Ex: ball-playing CB, pressing forward, creative playmaker..."
                  value={scoutForm.style}
                  onChange={(e) => setScoutForm({ ...scoutForm, style: e.target.value })}
                  className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Ligas preferidas (separar por virgula)</label>
                  <Input
                    placeholder="Premier League, La Liga..."
                    value={scoutForm.leaguePreference}
                    onChange={(e) => setScoutForm({ ...scoutForm, leaguePreference: e.target.value })}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 placeholder:text-zinc-600 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Tracos obrigatorios</label>
                  <Input
                    placeholder="lideranca, velocidade, passe longo..."
                    value={scoutForm.mustHaveTraits}
                    onChange={(e) => setScoutForm({ ...scoutForm, mustHaveTraits: e.target.value })}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 placeholder:text-zinc-600 text-xs"
                  />
                </div>
              </div>
              <Button
                onClick={runScoutAgent}
                disabled={scoutLoading || !scoutForm.style}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
              >
                {scoutLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Executar SCOUT
                  </>
                )}
              </Button>
              {scoutError && (
                <p className="text-xs text-red-400">{scoutError}</p>
              )}
            </CardContent>
          </Card>

          {/* Scout Results */}
          {scoutResults && (
            <div className="space-y-4 animate-slide-up">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                {scoutResults.length} candidatos identificados pelo SCOUT
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoutResults.map((c, i) => (
                  <Card key={i} className="bg-zinc-900/80 border-zinc-800 glass card-hover">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-bold">{c.name}</p>
                          <p className="text-xs text-zinc-500">{c.age} anos — {c.club}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold font-mono ${
                            c.fitScore >= 80 ? "text-emerald-400" : c.fitScore >= 60 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {c.fitScore}
                          </span>
                          <p className="text-[9px] text-zinc-600 uppercase">Fit Score</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mb-2">&euro;{c.marketValue}M</p>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] text-emerald-500 uppercase mb-0.5">Pontos fortes</p>
                          <div className="flex flex-wrap gap-1">
                            {c.strengths.map((s, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-red-500 uppercase mb-0.5">Riscos</p>
                          <div className="flex flex-wrap gap-1">
                            {c.risks.map((r, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{r}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {scoutReasoning && (
                <Card className="bg-zinc-900/80 border-zinc-800 glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-400">Raciocinio do SCOUT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{scoutReasoning}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* ALERTS TAB */}
      {/* ============================================ */}
      {activeTab === "alerts" && (
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
              onClick={loadAlerts}
              disabled={alertsLoading}
              className="text-zinc-500 hover:text-emerald-400 text-xs"
            >
              Atualizar
            </Button>
          </div>

          {alertsLoading && (
            <div className="py-12 text-center text-zinc-600 text-sm">Carregando alertas...</div>
          )}

          {!alertsLoading && alerts.length === 0 && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardContent className="py-12 text-center">
                <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Nenhum alerta ativo no momento</p>
                <p className="text-zinc-600 text-xs mt-1">Adicione jogadores ao pipeline para receber alertas</p>
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
      )}

      {/* ============================================ */}
      {/* COMPARE TAB */}
      {/* ============================================ */}
      {activeTab === "compare" && (
        <div className="space-y-6 animate-fade-in">
          {selectedPlayers.length < 2 ? (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardContent className="py-16 text-center">
                <GitCompare className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 text-sm">
                  Selecione 2-3 jogadores na aba &quot;Alvos&quot; para comparar
                </p>
                <Button
                  variant="ghost"
                  className="text-emerald-400 hover:text-emerald-300 mt-4"
                  onClick={() => setActiveTab("targets")}
                >
                  Ir para Alvos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Comparando {selectedPlayers.length} jogadores
                </p>
                <Link href={`/scouting/compare?ids=${selectedForCompare.join(",")}`}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    Comparacao completa <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>

              <Card className="bg-zinc-900/80 border-zinc-800/80 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Camadas Neurais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`grid gap-4 ${selectedPlayers.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {selectedPlayers.map((player) => (
                      <div key={player.id} className="flex flex-col items-center p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02]">
                        {player.layers ? (
                          <NeuralRadar layers={player.layers} playerName={player.name} scnScore={player.scn} size={260} />
                        ) : (
                          <div className="w-[260px] h-[260px] flex items-center justify-center text-zinc-600 text-xs">Sem dados neurais</div>
                        )}
                        <div className="mt-2">
                          {player.decision && <DecisionBadge decision={player.decision} size="sm" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 border-zinc-800/80 overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Metricas Comparativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left py-2.5 px-3 text-xs text-zinc-500 uppercase">Metrica</th>
                          {selectedPlayers.map((p) => (
                            <th key={p.id} className="text-center py-2.5 px-3 text-xs text-zinc-300">{p.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Idade", getter: (p: ScoutingPlayerUI) => `${p.age} anos` },
                          { label: "Valor", getter: (p: ScoutingPlayerUI) => `\u20AC${p.marketValue}M` },
                          { label: "Vx", getter: (p: ScoutingPlayerUI) => p.vx?.toFixed(2) ?? "--", color: "text-emerald-400" },
                          { label: "Rx", getter: (p: ScoutingPlayerUI) => p.rx?.toFixed(2) ?? "--", color: "text-red-400" },
                          { label: "SCN+", getter: (p: ScoutingPlayerUI) => p.scn?.toString() ?? "--", color: "text-cyan-400" },
                          { label: "Contrato", getter: (p: ScoutingPlayerUI) => p.contractEnd },
                        ].map((m, i) => (
                          <tr key={m.label} className={`border-b border-zinc-800/30 ${i % 2 === 1 ? "bg-zinc-800/[0.1]" : ""}`}>
                            <td className="py-2.5 px-3 text-xs text-zinc-500">{m.label}</td>
                            {selectedPlayers.map((p) => (
                              <td key={p.id} className={`py-2.5 px-3 text-center font-mono text-xs ${m.color ?? "text-zinc-300"}`}>{m.getter(p)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
