"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Bot,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AgentLaunchModalProps {
  isOpen: boolean
  onClose: () => void
  agentType: string
  agentName: string
}

interface PlayerResult {
  id: string
  name: string
  position: string | null
  currentClub: string | null
}

const AGENT_ENDPOINTS: Record<string, { url: string; method: string }> = {
  ORACLE: { url: "/api/oracle", method: "POST" },
  ANALISTA: { url: "/api/analyses", method: "POST" },
  SCOUT: { url: "/api/scout", method: "POST" },
  BOARD_ADVISOR: { url: "/api/analyses", method: "POST" },
  CFO_MODELER: { url: "/api/analyses", method: "POST" },
  COACHING_ASSIST: { url: "/api/coaching", method: "POST" },
}

const STEPS = [
  { key: "preparing", label: "Preparando contexto" },
  { key: "executing", label: "Executando agente" },
  { key: "processing", label: "Processando resultado" },
]

export function AgentLaunchModal({ isOpen, onClose, agentType, agentName }: AgentLaunchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PlayerResult[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(null)
  const [context, setContext] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchPlayers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(`/api/players?search=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.data ?? data ?? [])
        setShowDropdown(true)
      }
    } catch {
      setSearchResults([])
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (searchQuery.length >= 2) {
      searchTimeout.current = setTimeout(() => searchPlayers(searchQuery), 300)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchQuery, searchPlayers])

  if (!isOpen) return null

  const handleSelectPlayer = (player: PlayerResult) => {
    setSelectedPlayer(player)
    setSearchQuery("")
    setSearchResults([])
    setShowDropdown(false)
  }

  const handleExecute = async () => {
    if (!selectedPlayer) return
    setLoading(true)
    setError("")
    setSuccess(false)
    setCurrentStep(0)

    const endpoint = AGENT_ENDPOINTS[agentType] ?? AGENT_ENDPOINTS.ORACLE

    // Simulate step progression
    const stepTimer1 = setTimeout(() => setCurrentStep(1), 800)
    const stepTimer2 = setTimeout(() => setCurrentStep(2), 2000)

    try {
      const body: Record<string, unknown> = {
        playerId: selectedPlayer.id,
      }

      if (agentType === "BOARD_ADVISOR" || agentType === "CFO_MODELER") {
        body.agentType = agentType
      }

      if (context.trim()) {
        body.additionalContext = context.trim()
      }

      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao executar agente")
      } else {
        setCurrentStep(2)
        setSuccess(true)
      }
    } catch {
      setError("Erro de conexao")
    }

    clearTimeout(stepTimer1)
    clearTimeout(stepTimer2)
    setLoading(false)
  }

  const handleRetry = () => {
    setError("")
    setSuccess(false)
    setCurrentStep(0)
  }

  const handleClose = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedPlayer(null)
    setContext("")
    setLoading(false)
    setSuccess(false)
    setError("")
    setCurrentStep(0)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900/95 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Bot className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Executar {agentName}</h2>
              <p className="text-xs text-zinc-500">Configurar e lancar agente</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!success && !error ? (
            <>
              {/* Player Selector */}
              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                  Selecionar jogador
                </label>

                {selectedPlayer ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm text-emerald-400 font-medium">{selectedPlayer.name}</span>
                    {selectedPlayer.position && (
                      <span className="text-[10px] text-zinc-500">{selectedPlayer.position}</span>
                    )}
                    {selectedPlayer.currentClub && (
                      <span className="text-[10px] text-zinc-600">- {selectedPlayer.currentClub}</span>
                    )}
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="ml-auto text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar jogador..."
                      className="pl-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-sm"
                    />
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl max-h-48 overflow-y-auto">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectPlayer(p)}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors flex items-center gap-2"
                          >
                            <span className="font-medium">{p.name}</span>
                            {p.position && (
                              <span className="text-[10px] text-zinc-500">{p.position}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Context */}
              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                  Contexto adicional (opcional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  placeholder="Informacoes adicionais para o agente..."
                  className="w-full rounded-lg bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-sm p-3 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-zinc-600"
                />
              </div>

              {/* Loading stepper */}
              {loading && (
                <div className="space-y-2">
                  {STEPS.map((step, idx) => (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                        idx < currentStep
                          ? "bg-emerald-500 text-white"
                          : idx === currentStep
                            ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                            : "bg-zinc-800 border border-zinc-700 text-zinc-600"
                      }`}>
                        {idx < currentStep ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : idx === currentStep ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs transition-colors ${
                        idx <= currentStep ? "text-zinc-300" : "text-zinc-600"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Execute button */}
              <Button
                onClick={handleExecute}
                disabled={loading || !selectedPlayer}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Executar
                  </>
                )}
              </Button>
            </>
          ) : error ? (
            /* Error state */
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-400">Erro na execucao</p>
                <p className="text-xs text-zinc-500 mt-1">{error}</p>
              </div>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 gap-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Agente executado com sucesso</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {agentName} processou {selectedPlayer?.name} com exito
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                {selectedPlayer && (
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <a href={`/players/${selectedPlayer.id}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver perfil do jogador
                    </a>
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
