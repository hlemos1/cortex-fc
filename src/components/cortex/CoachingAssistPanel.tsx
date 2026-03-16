"use client"

import { useState } from "react"
import {
  Bot,
  GraduationCap,
  Loader2,
  Target,
  Dumbbell,
  Brain,
  CalendarCheck,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CoachingAssistOutput, PlayerCluster } from "@/types/cortex"

interface Props {
  playerId: string
  playerName: string
  position: PlayerCluster
  age: number
  currentClub: string
}

export function CoachingAssistPanel({ playerId, playerName, position, age, currentClub }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CoachingAssistOutput | null>(null)
  const [error, setError] = useState("")

  // Form
  const [targetRole, setTargetRole] = useState("")
  const [strengths, setStrengths] = useState("")
  const [weaknesses, setWeaknesses] = useState("")
  const [formationContext, setFormationContext] = useState("")
  const [horizon, setHorizon] = useState<"short" | "medium" | "long">("medium")

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          playerName,
          position,
          age,
          currentClub,
          targetRole,
          strengths: strengths.split("\n").filter(Boolean),
          weaknesses: weaknesses.split("\n").filter(Boolean),
          formationContext: formationContext || undefined,
          developmentHorizon: horizon,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar plano")
      } else {
        setResult(data.data)
      }
    } catch {
      setError("Erro de conexao")
    }
    setLoading(false)
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 glass animate-slide-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-violet-500" />
            Plano de Desenvolvimento
          </CardTitle>
          {!expanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 text-xs gap-1"
            >
              <Bot className="w-3.5 h-3.5" />
              Assistente Tatico
            </Button>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {!result ? (
            <>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Papel Tatico Alvo</label>
                    <Input
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="ex: inverted fullback, box-to-box"
                      className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-xs h-8"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-zinc-500 font-medium mb-1 block">Formacao</label>
                      <Input
                        value={formationContext}
                        onChange={(e) => setFormationContext(e.target.value)}
                        placeholder="4-3-3"
                        className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 font-medium mb-1 block">Horizonte</label>
                      <select
                        value={horizon}
                        onChange={(e) => setHorizon(e.target.value as "short" | "medium" | "long")}
                        className="w-full h-8 rounded-md bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-xs px-2"
                      >
                        <option value="short">3 meses</option>
                        <option value="medium">6 meses</option>
                        <option value="long">12+ meses</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Pontos Fortes (1 por linha)</label>
                    <textarea
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder={"Passe longo preciso\nLeitura defensiva\nResistencia fisica"}
                      rows={3}
                      className="w-full rounded-md bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-xs p-2 resize-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Pontos Fracos (1 por linha)</label>
                    <textarea
                      value={weaknesses}
                      onChange={(e) => setWeaknesses(e.target.value)}
                      placeholder={"Drible em espacos curtos\nFinalizacao\nPosicionamento ofensivo"}
                      rows={3}
                      className="w-full rounded-md bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-xs p-2 resize-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading || !targetRole || !strengths || !weaknesses}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Gerando plano...
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    Gerar Plano de Desenvolvimento
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-5">
              {/* Tactical Integration Bar */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                <div className="text-center">
                  <p className="text-[10px] text-zinc-600 uppercase">Fit Atual</p>
                  <p className="text-lg font-bold font-mono text-amber-400">{result.tacticalIntegration.currentFit}%</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
                <div className="text-center">
                  <p className="text-[10px] text-zinc-600 uppercase">Fit Projetado</p>
                  <p className="text-lg font-bold font-mono text-emerald-400">{result.tacticalIntegration.projectedFit}%</p>
                </div>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden ml-3">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${result.tacticalIntegration.projectedFit}%` }}
                  />
                </div>
              </div>

              {/* Development Phases */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Target className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Fases de Desenvolvimento</span>
                </div>
                <div className="space-y-3">
                  {result.developmentPlan.map((phase, i) => (
                    <div key={i} className="rounded-lg border border-zinc-800/50 bg-zinc-800/20 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-200">{phase.phase}</span>
                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-2 py-0.5 rounded">{phase.duration}</span>
                      </div>
                      <div className="space-y-1">
                        {phase.objectives.map((obj, j) => (
                          <p key={j} className="text-[11px] text-zinc-400 pl-3 border-l border-violet-500/30">
                            {obj}
                          </p>
                        ))}
                      </div>
                      {phase.kpis.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {phase.kpis.map((kpi, k) => (
                            <span key={k} className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                              {kpi}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical + Mental */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Dumbbell className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Fisico</span>
                  </div>
                  {result.physicalPlan.focus.map((f, i) => (
                    <p key={i} className="text-[11px] text-zinc-400 mb-0.5">- {f}</p>
                  ))}
                  <p className="text-[10px] text-zinc-600 mt-1.5 italic">{result.physicalPlan.loadManagement}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Mental</span>
                  </div>
                  {result.mentalDevelopment.areas.map((a, i) => (
                    <p key={i} className="text-[11px] text-zinc-400 mb-0.5">- {a}</p>
                  ))}
                  <p className="text-[10px] text-zinc-600 mt-1.5 italic">{result.mentalDevelopment.approach}</p>
                </div>
              </div>

              {/* Timeline */}
              {result.timeline.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Milestones</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-violet-500/30 to-transparent" />
                    <div className="space-y-2">
                      {result.timeline.map((m, i) => (
                        <div key={i} className="relative pl-6 text-xs">
                          <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-violet-500/50 border border-violet-400" />
                          <p className="text-zinc-300">{m.milestone}</p>
                          <p className="text-[10px] text-zinc-600">{m.expectedDate} — {m.metric}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
                <p className="text-xs text-zinc-300 leading-relaxed">{result.reasoning}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => { setResult(null); setExpanded(true) }}
                className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Novo Plano
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
