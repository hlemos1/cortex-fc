"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bookmark,
  Plus,
  X,
  Bot,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AgentPreset {
  id: string
  name: string
  agentType: string
  defaultPlayerId?: string
  defaultPlayerName?: string
  context: string
  createdAt: string
}

const STORAGE_KEY = "cortexfc-agent-presets"
const MAX_PRESETS = 10

const AGENT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  ORACLE: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ANALISTA: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  SCOUT: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  BOARD_ADVISOR: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  CFO_MODELER: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  COACHING_ASSIST: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
}

const AGENT_LABELS: Record<string, string> = {
  ORACLE: "ORACLE",
  ANALISTA: "ANALISTA",
  SCOUT: "SCOUT",
  BOARD_ADVISOR: "BOARD ADVISOR",
  CFO_MODELER: "CFO MODELER",
  COACHING_ASSIST: "COACHING ASSIST",
}

interface AgentPresetsProps {
  onLaunch?: (preset: AgentPreset) => void
  showSaveForm?: boolean
  saveFormData?: {
    agentType: string
    playerId?: string
    playerName?: string
    context: string
  }
  onSaveComplete?: () => void
}

export function AgentPresets({
  onLaunch,
  showSaveForm = false,
  saveFormData,
  onSaveComplete,
}: AgentPresetsProps) {
  const [presets, setPresets] = useState<AgentPreset[]>([])
  const [isAdding, setIsAdding] = useState(showSaveForm)
  const [presetName, setPresetName] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPresets(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const persistPresets = useCallback((updated: AgentPreset[]) => {
    setPresets(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [])

  const handleSave = () => {
    if (!presetName.trim() || !saveFormData) return
    if (presets.length >= MAX_PRESETS) return

    setSaving(true)
    const newPreset: AgentPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      agentType: saveFormData.agentType,
      defaultPlayerId: saveFormData.playerId,
      defaultPlayerName: saveFormData.playerName,
      context: saveFormData.context,
      createdAt: new Date().toISOString(),
    }

    const updated = [newPreset, ...presets]
    persistPresets(updated)
    setPresetName("")
    setIsAdding(false)
    setSaving(false)
    onSaveComplete?.()
  }

  const handleDelete = (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id)
      return
    }
    const updated = presets.filter((p) => p.id !== id)
    persistPresets(updated)
    setDeleteConfirmId(null)
  }

  const nearLimit = presets.length >= MAX_PRESETS - 2

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-emerald-500/70" />
          Presets Salvos
        </h3>
        {!isAdding && saveFormData && presets.length < MAX_PRESETS && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-xs text-zinc-500 hover:text-emerald-400 gap-1 h-7"
          >
            <Plus className="w-3 h-3" />
            Salvar Preset
          </Button>
        )}
      </div>

      {/* Save form */}
      {isAdding && saveFormData && (
        <div className="glass rounded-xl p-4 space-y-3 border border-emerald-500/10">
          <div className="flex items-center gap-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome do preset"
              className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-xs h-8 flex-1"
              maxLength={50}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!presetName.trim() || saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setPresetName("")
              }}
              className="text-zinc-500 h-8 px-2"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <span>Agente: {AGENT_LABELS[saveFormData.agentType] ?? saveFormData.agentType}</span>
            {saveFormData.playerName && (
              <>
                <span>|</span>
                <span>Jogador: {saveFormData.playerName}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Limit warning */}
      {nearLimit && presets.length < MAX_PRESETS && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80">
          <AlertTriangle className="w-3 h-3" />
          {MAX_PRESETS - presets.length} preset(s) restante(s) — maximo {MAX_PRESETS}
        </div>
      )}

      {presets.length >= MAX_PRESETS && (
        <div className="flex items-center gap-1.5 text-[10px] text-red-400/80">
          <AlertTriangle className="w-3 h-3" />
          Limite de {MAX_PRESETS} presets atingido. Exclua um para salvar novos.
        </div>
      )}

      {/* Presets list */}
      {presets.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center">
          <Bookmark className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-600">
            Salve suas configuracoes frequentes como presets
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => {
            const colors = AGENT_COLORS[preset.agentType] ?? AGENT_COLORS.ORACLE
            const isConfirmingDelete = deleteConfirmId === preset.id

            return (
              <div
                key={preset.id}
                className="glass rounded-xl p-3 flex items-center justify-between gap-3 group cursor-pointer transition-all hover:border-zinc-700/60"
                onClick={() => onLaunch?.(preset)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                    <Bot className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {preset.name}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>
                        {AGENT_LABELS[preset.agentType] ?? preset.agentType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {preset.defaultPlayerName && (
                        <span className="text-[10px] text-zinc-500 truncate">
                          {preset.defaultPlayerName}
                        </span>
                      )}
                      {preset.context && (
                        <span className="text-[10px] text-zinc-600 truncate max-w-[200px]">
                          {preset.context.slice(0, 60)}{preset.context.length > 60 ? "..." : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(preset.id)
                  }}
                  className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                    isConfirmingDelete
                      ? "bg-red-500/20 border border-red-500/30 text-red-400"
                      : "opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                  title={isConfirmingDelete ? "Clique novamente para confirmar" : "Excluir preset"}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
