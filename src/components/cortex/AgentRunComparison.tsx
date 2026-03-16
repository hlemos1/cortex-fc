"use client"

import { useState, useMemo } from "react"
import {
  GitCompareArrows,
  Bot,
  CheckCircle,
  XCircle,
  Timer,
  Hash,
  ChevronDown,
  Zap,
} from "lucide-react"

interface AgentRun {
  id: string
  agentType: string
  inputContext: Record<string, unknown>
  outputResult: Record<string, unknown> | null
  tokensUsed: number | null
  durationMs: number | null
  success: boolean
  createdAt: string
}

interface AgentRunComparisonProps {
  runs: AgentRun[]
}

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(ms: number | null) {
  if (ms == null) return "--"
  return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function formatTokens(t: number | null) {
  if (t == null) return "--"
  return t > 1000 ? `${(t / 1000).toFixed(1)}k` : String(t)
}

/** Compute a simple line-by-line diff of two JSON strings */
function computeDiff(a: string, b: string): { line: string; type: "same" | "added" | "removed" }[] {
  const linesA = a.split("\n")
  const linesB = b.split("\n")
  const maxLen = Math.max(linesA.length, linesB.length)
  const result: { line: string; type: "same" | "added" | "removed" }[] = []

  for (let i = 0; i < maxLen; i++) {
    const la = linesA[i]
    const lb = linesB[i]
    if (la === lb) {
      result.push({ line: la ?? "", type: "same" })
    } else {
      if (la !== undefined) result.push({ line: la, type: "removed" })
      if (lb !== undefined) result.push({ line: lb, type: "added" })
    }
  }

  return result
}

export function AgentRunComparison({ runs }: AgentRunComparisonProps) {
  const [runIdA, setRunIdA] = useState<string>("")
  const [runIdB, setRunIdB] = useState<string>("")

  const runA = useMemo(() => runs.find((r) => r.id === runIdA) ?? null, [runs, runIdA])
  const runB = useMemo(() => runs.find((r) => r.id === runIdB) ?? null, [runs, runIdB])

  const diff = useMemo(() => {
    if (!runA?.outputResult || !runB?.outputResult) return null
    const jsonA = JSON.stringify(runA.outputResult, null, 2)
    const jsonB = JSON.stringify(runB.outputResult, null, 2)
    return computeDiff(jsonA, jsonB)
  }, [runA, runB])

  const verdict = useMemo(() => {
    if (!runA || !runB) return null
    const points = { a: 0, b: 0 }

    // Faster
    if (runA.durationMs != null && runB.durationMs != null) {
      if (runA.durationMs < runB.durationMs) points.a++
      else if (runB.durationMs < runA.durationMs) points.b++
    }

    // Fewer tokens
    if (runA.tokensUsed != null && runB.tokensUsed != null) {
      if (runA.tokensUsed < runB.tokensUsed) points.a++
      else if (runB.tokensUsed < runA.tokensUsed) points.b++
    }

    // Success vs error
    if (runA.success && !runB.success) points.a++
    else if (runB.success && !runA.success) points.b++

    return points
  }, [runA, runB])

  const renderRunSelector = (
    value: string,
    onChange: (v: string) => void,
    label: string,
    excludeId?: string
  ) => (
    <div className="flex-1 min-w-0">
      <label className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider mb-1 block">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-300 text-xs px-3 pr-8 appearance-none cursor-pointer focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
        >
          <option value="">Selecionar execucao</option>
          {runs
            .filter((r) => r.id !== excludeId)
            .map((r) => {
              const agentLabel = AGENT_LABELS[r.agentType] ?? r.agentType
              return (
                <option key={r.id} value={r.id}>
                  {agentLabel} — {formatDate(r.createdAt)} — {r.id.slice(0, 8)}
                </option>
              )
            })}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
      </div>
    </div>
  )

  const renderRunCard = (run: AgentRun | null, label: string) => {
    if (!run) {
      return (
        <div className="flex-1 rounded-xl bg-zinc-800/20 border border-zinc-700/20 p-4 flex items-center justify-center min-h-[120px]">
          <p className="text-xs text-zinc-600">{label}</p>
        </div>
      )
    }

    const colors = AGENT_COLORS[run.agentType] ?? AGENT_COLORS.ORACLE

    return (
      <div className="flex-1 rounded-xl bg-zinc-800/20 border border-zinc-700/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>
            <Bot className="w-3 h-3" />
            {AGENT_LABELS[run.agentType] ?? run.agentType}
          </span>
          {run.success ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
              <CheckCircle className="w-3 h-3" /> OK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-400 text-[11px]">
              <XCircle className="w-3 h-3" /> Erro
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-zinc-900/50 p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Timer className="w-3 h-3 text-zinc-600" />
              <span className="text-[9px] text-zinc-600 uppercase">Duracao</span>
            </div>
            <p className="text-xs font-mono text-zinc-300">{formatDuration(run.durationMs)}</p>
          </div>
          <div className="rounded-lg bg-zinc-900/50 p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Hash className="w-3 h-3 text-zinc-600" />
              <span className="text-[9px] text-zinc-600 uppercase">Tokens</span>
            </div>
            <p className="text-xs font-mono text-zinc-300">{formatTokens(run.tokensUsed)}</p>
          </div>
        </div>

        <div className="text-[10px] text-zinc-600">
          {formatDate(run.createdAt)} | {run.id.slice(0, 8)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <h3 className="text-xs text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
        <GitCompareArrows className="w-3.5 h-3.5 text-emerald-500/70" />
        Comparar Execucoes
      </h3>

      {runs.length < 2 ? (
        <div className="glass rounded-xl p-6 text-center">
          <GitCompareArrows className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-600">
            Necessario pelo menos 2 execucoes para comparar
          </p>
        </div>
      ) : (
        <>
          {/* Selectors */}
          <div className="flex items-end gap-3">
            {renderRunSelector(runIdA, setRunIdA, "Execucao A", runIdB)}
            <div className="pb-1">
              <GitCompareArrows className="w-4 h-4 text-zinc-600" />
            </div>
            {renderRunSelector(runIdB, setRunIdB, "Execucao B", runIdA)}
          </div>

          {/* Side by side cards */}
          {(runA || runB) && (
            <div className="flex gap-3">
              {renderRunCard(runA, "Selecione a execucao A")}
              {renderRunCard(runB, "Selecione a execucao B")}
            </div>
          )}

          {/* Verdict */}
          {verdict && runA && runB && (
            <div className="glass rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                  Qual foi melhor?
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-zinc-800/30 p-2">
                  <p className="text-[9px] text-zinc-600 uppercase mb-1">Mais rapido</p>
                  <p className={`text-xs font-semibold ${
                    runA.durationMs != null && runB.durationMs != null
                      ? (runA.durationMs <= runB.durationMs ? "text-emerald-400" : "text-zinc-500")
                      : "text-zinc-600"
                  }`}>
                    {runA.durationMs != null && runB.durationMs != null
                      ? (runA.durationMs <= runB.durationMs ? "A" : "B")
                      : "--"}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/30 p-2">
                  <p className="text-[9px] text-zinc-600 uppercase mb-1">Mais economico</p>
                  <p className={`text-xs font-semibold ${
                    runA.tokensUsed != null && runB.tokensUsed != null
                      ? (runA.tokensUsed <= runB.tokensUsed ? "text-emerald-400" : "text-zinc-500")
                      : "text-zinc-600"
                  }`}>
                    {runA.tokensUsed != null && runB.tokensUsed != null
                      ? (runA.tokensUsed <= runB.tokensUsed ? "A" : "B")
                      : "--"}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/30 p-2">
                  <p className="text-[9px] text-zinc-600 uppercase mb-1">Sucesso</p>
                  <p className={`text-xs font-semibold ${
                    runA.success === runB.success
                      ? "text-zinc-500"
                      : runA.success
                        ? "text-emerald-400"
                        : "text-zinc-500"
                  }`}>
                    {runA.success === runB.success
                      ? "Empate"
                      : runA.success ? "A" : "B"}
                  </p>
                </div>
              </div>
              {verdict.a !== verdict.b && (
                <p className="text-xs text-center mt-2">
                  <span className="text-emerald-400 font-semibold">
                    Execucao {verdict.a > verdict.b ? "A" : "B"}
                  </span>
                  <span className="text-zinc-500"> teve melhor desempenho geral</span>
                </p>
              )}
              {verdict.a === verdict.b && (
                <p className="text-xs text-center text-zinc-500 mt-2">
                  Desempenho equivalente entre as duas execucoes
                </p>
              )}
            </div>
          )}

          {/* Diff view */}
          {diff && (
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                Diff do Output
              </p>
              <pre className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-[11px] font-mono overflow-x-auto max-h-72 overflow-y-auto">
                {diff.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.type === "added"
                        ? "text-emerald-400 bg-emerald-500/5"
                        : line.type === "removed"
                          ? "text-red-400 bg-red-500/5"
                          : "text-zinc-500"
                    }
                  >
                    <span className="select-none text-zinc-700 mr-2">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    {line.line}
                  </div>
                ))}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}
