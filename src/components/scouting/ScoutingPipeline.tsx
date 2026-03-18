"use client"

import Link from "next/link"
import {
  GripVertical,
  MessageSquare,
  Trash2,
  Plus,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import type { CortexDecision } from "@/types/cortex"

// ============================================
// Types
// ============================================

type PipelineStatus = "watching" | "contacted" | "negotiating" | "closed" | "passed"

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

const STATUS_CONFIG: Record<PipelineStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  watching: { label: "Observando", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", icon: () => null },
  contacted: { label: "Contatado", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", icon: () => null },
  negotiating: { label: "Negociando", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", icon: () => null },
  closed: { label: "Fechado", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20", icon: () => null },
  passed: { label: "Descartado", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", icon: () => null },
}

const PIPELINE_STAGES: PipelineStatus[] = ["watching", "contacted", "negotiating", "closed"]

export interface ScoutingPipelineProps {
  targets: ScoutingTarget[]
  pipelineByStatus: Record<PipelineStatus, ScoutingTarget[]>
  draggedTarget: string | null
  onDragStart: (targetId: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (newStatus: PipelineStatus) => void
  onOpenComments: (targetId: string) => void
  onDeleteTarget: (targetId: string) => void
  onUpdateTarget: (targetId: string, updates: Record<string, unknown>) => void
  onAddPlayer: () => void
  statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }>
}

export function ScoutingPipeline({
  targets,
  pipelineByStatus,
  draggedTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onOpenComments,
  onDeleteTarget,
  onUpdateTarget,
  onAddPlayer,
  statusConfig,
}: ScoutingPipelineProps) {
  const config = statusConfig as typeof STATUS_CONFIG

  return (
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
          onClick={onAddPlayer}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_STAGES.map((status) => {
          const stageConfig = config[status]
          const Icon = stageConfig.icon
          const stageTargets = pipelineByStatus[status]
          return (
            <div
              key={status}
              className="space-y-3"
              onDragOver={onDragOver}
              onDrop={() => onDrop(status)}
            >
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${stageConfig.borderColor} ${stageConfig.bgColor}`}>
                <Icon className={`w-4 h-4 ${stageConfig.color}`} />
                <span className={`text-sm font-semibold ${stageConfig.color}`}>{stageConfig.label}</span>
                <Badge variant="secondary" className={`ml-auto ${stageConfig.bgColor} ${stageConfig.color} border ${stageConfig.borderColor} text-xs px-2 py-0.5 font-bold`}>
                  {stageTargets.length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[120px]">
                {stageTargets.map((target) => (
                  <Card
                    key={target.id}
                    draggable
                    onDragStart={() => onDragStart(target.id)}
                    className={`bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700 transition-all p-3 cursor-grab active:cursor-grabbing group ${
                      draggedTarget === target.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3 h-3 text-zinc-500 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/players/${target.playerId}`}>
                            <p className="text-sm font-semibold text-zinc-100 truncate hover:text-emerald-400 transition-colors">
                              {target.playerName}
                            </p>
                          </Link>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenComments(target.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-emerald-400 transition-all"
                              title="Comentarios"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteTarget(target.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {target.playerPosition ?? target.playerCluster} — {target.clubName ?? "\u2014"}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-zinc-400 font-mono">&euro;{target.playerMarketValue ?? 0}M</span>
                          {target.analysis && (
                            <>
                              <span className="text-xs font-mono text-emerald-400 px-1 py-0.5 rounded bg-emerald-500/[0.08]">
                                Vx {target.analysis.vx.toFixed(2)}
                              </span>
                              <span className="text-xs font-mono text-red-400 px-1 py-0.5 rounded bg-red-500/[0.08]">
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
                              onClick={() => onUpdateTarget(target.id, { priority: p })}
                              className={`text-[9px] px-1.5 py-0.5 rounded-full transition-colors ${
                                target.priority === p
                                  ? p === "high"
                                    ? "bg-red-500/20 text-red-400"
                                    : p === "medium"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-zinc-500/20 text-zinc-400"
                                  : "text-zinc-500 hover:text-zinc-500"
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
                  <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/30">
                    Arraste alvos aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
