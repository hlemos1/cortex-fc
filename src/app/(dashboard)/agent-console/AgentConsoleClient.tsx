"use client"

import { useState, useMemo } from "react"
import {
  Monitor,
  Bot,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Hash,
  Timer,
  Cpu,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AgentRun {
  id: string
  agentType: string
  inputContext: Record<string, unknown>
  outputResult: Record<string, unknown> | null
  modelUsed: string
  tokensUsed: number | null
  durationMs: number | null
  success: boolean
  error: string | null
  userId: string | null
  orgId: string | null
  createdAt: string
}

interface Metrics {
  totalRuns: number
  totalTokens: number
  avgDuration: number
  successCount: number
  errorCount: number
  byAgent: {
    agentType: string
    count: number
    totalTokens: string | null
    avgDuration: string | null
  }[]
}

interface Props {
  initialRuns: AgentRun[]
  metrics: Metrics
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

// Approximate cost per token (Claude Sonnet input+output average)
const COST_PER_TOKEN = 0.000015 // ~$15/1M tokens average

export function AgentConsoleClient({ initialRuns, metrics }: Props) {
  const [runs] = useState(initialRuns)
  const [agentFilter, setAgentFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "success" | "error">("ALL")
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null)

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      if (agentFilter !== "ALL" && r.agentType !== agentFilter) return false
      if (statusFilter === "success" && !r.success) return false
      if (statusFilter === "error" && r.success) return false
      return true
    })
  }, [runs, agentFilter, statusFilter])

  const estimatedCost = metrics.totalTokens * COST_PER_TOKEN
  const successRate = metrics.totalRuns > 0
    ? Math.round((metrics.successCount / metrics.totalRuns) * 100)
    : 0

  const handleExportCsv = () => {
    const headers = ["ID", "Agente", "Modelo", "Tokens", "Duracao (ms)", "Sucesso", "Erro", "Data"]
    const csvRows = [
      headers.join(","),
      ...filteredRuns.map((r) =>
        [
          r.id,
          r.agentType,
          r.modelUsed,
          r.tokensUsed ?? "",
          r.durationMs ?? "",
          r.success ? "Sim" : "Nao",
          `"${(r.error ?? "").replace(/"/g, '""')}"`,
          new Date(r.createdAt).toISOString(),
        ].join(",")
      ),
    ]
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agent-runs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Console de Agentes IA
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Historico, metricas e auditoria das execucoes de IA
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Total Runs</p>
                <p className="text-xl font-bold text-zinc-100 font-mono">{metrics.totalRuns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Tokens</p>
                <p className="text-xl font-bold text-zinc-100 font-mono">
                  {metrics.totalTokens > 1000
                    ? `${(metrics.totalTokens / 1000).toFixed(1)}k`
                    : metrics.totalTokens}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Timer className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Duracao Media</p>
                <p className="text-xl font-bold text-zinc-100 font-mono">
                  {metrics.avgDuration > 1000
                    ? `${(metrics.avgDuration / 1000).toFixed(1)}s`
                    : `${metrics.avgDuration}ms`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Custo Est.</p>
                <p className="text-xl font-bold text-zinc-100 font-mono">
                  ${estimatedCost.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up stagger-5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                successRate >= 90
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : successRate >= 70
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-red-500/10 border border-red-500/20"
              }`}>
                <CheckCircle className={`w-5 h-5 ${
                  successRate >= 90 ? "text-emerald-400" : successRate >= 70 ? "text-amber-400" : "text-red-400"
                }`} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase font-medium tracking-wider">Success Rate</p>
                <p className="text-xl font-bold text-zinc-100 font-mono">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Distribution */}
      {metrics.byAgent.length > 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              Distribuicao por Agente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.byAgent.map((agent) => {
                const colors = AGENT_COLORS[agent.agentType] ?? AGENT_COLORS.ORACLE
                const pct = metrics.totalRuns > 0 ? Math.round((agent.count / metrics.totalRuns) * 100) : 0
                return (
                  <div
                    key={agent.agentType}
                    className={`rounded-lg border p-3 ${colors.border} ${colors.bg} cursor-pointer transition-all hover:scale-[1.02]`}
                    onClick={() => setAgentFilter(agentFilter === agent.agentType ? "ALL" : agent.agentType)}
                  >
                    <p className={`text-xs font-bold ${colors.text}`}>
                      {AGENT_LABELS[agent.agentType] ?? agent.agentType}
                    </p>
                    <p className="text-lg font-bold font-mono text-zinc-100 mt-1">{agent.count}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-zinc-600">{pct}%</span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {Number(agent.avgDuration ?? 0) > 1000
                          ? `${(Number(agent.avgDuration) / 1000).toFixed(1)}s`
                          : `${Math.round(Number(agent.avgDuration ?? 0))}ms`}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${colors.text.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Export */}
      <div className="glass rounded-xl p-4 animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-500/70" />
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Agent filter */}
            {["ALL", "ORACLE", "ANALISTA", "SCOUT", "BOARD_ADVISOR", "CFO_MODELER", "COACHING_ASSIST"].map((agent) => {
              const isActive = agentFilter === agent
              const colors = agent !== "ALL" ? AGENT_COLORS[agent] : null
              return (
                <button
                  key={agent}
                  onClick={() => setAgentFilter(agent)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all font-medium ${
                    isActive
                      ? colors
                        ? `${colors.bg} ${colors.border} ${colors.text}`
                        : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {agent === "ALL" ? "Todos" : AGENT_LABELS[agent] ?? agent}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            {(["ALL", "success", "error"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all font-medium ${
                  statusFilter === s
                    ? s === "success"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : s === "error"
                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                        : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {s === "ALL" ? "Todos" : s === "success" ? "Sucesso" : "Erro"}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="bg-zinc-800/40 border-zinc-700/40 text-zinc-400 hover:text-zinc-200 text-xs gap-1.5 ml-2"
            >
              <Download className="w-3 h-3" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Runs Table */}
      <Card className="bg-zinc-900/80 border-zinc-800/80 animate-slide-up">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Agente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tokens</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Duracao</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Custo</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Data</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run, idx) => {
                  const colors = AGENT_COLORS[run.agentType] ?? AGENT_COLORS.ORACLE
                  const cost = (run.tokensUsed ?? 0) * COST_PER_TOKEN
                  return (
                    <tr
                      key={run.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-all cursor-pointer"
                      style={{ animationDelay: `${idx * 30}ms` }}
                      onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                    >
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>
                          <Bot className="w-3 h-3" />
                          {AGENT_LABELS[run.agentType] ?? run.agentType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {run.success ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle className="w-3 h-3" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                            <XCircle className="w-3 h-3" />
                            Erro
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono text-zinc-400">
                        {run.tokensUsed != null ? run.tokensUsed.toLocaleString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono text-zinc-400">
                        {run.durationMs != null
                          ? run.durationMs > 1000
                            ? `${(run.durationMs / 1000).toFixed(1)}s`
                            : `${run.durationMs}ms`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono text-zinc-400">
                        ${cost.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-zinc-600">
                        {formatDate(run.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {selectedRun?.id === run.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredRuns.length === 0 && (
            <div className="py-12 text-center">
              <Monitor className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Nenhuma execucao encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border-l border-zinc-800 w-full max-w-xl h-full overflow-y-auto shadow-2xl animate-slide-left p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                  AGENT_COLORS[selectedRun.agentType]?.bg ?? ""
                } ${AGENT_COLORS[selectedRun.agentType]?.border ?? ""}`}>
                  <Bot className={`w-4.5 h-4.5 ${AGENT_COLORS[selectedRun.agentType]?.text ?? "text-zinc-400"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {AGENT_LABELS[selectedRun.agentType] ?? selectedRun.agentType}
                  </h3>
                  <p className="text-[10px] text-zinc-600 font-mono">{selectedRun.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
                <p className="text-[10px] text-zinc-600 uppercase font-medium">Status</p>
                {selectedRun.success ? (
                  <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Sucesso
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-red-400 mt-1 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Erro
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
                <p className="text-[10px] text-zinc-600 uppercase font-medium">Data</p>
                <p className="text-sm text-zinc-300 mt-1">{formatDate(selectedRun.createdAt)}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
                <p className="text-[10px] text-zinc-600 uppercase font-medium">Tokens</p>
                <p className="text-sm text-zinc-300 font-mono mt-1">
                  {selectedRun.tokensUsed?.toLocaleString() ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
                <p className="text-[10px] text-zinc-600 uppercase font-medium">Duracao</p>
                <p className="text-sm text-zinc-300 font-mono mt-1">
                  {selectedRun.durationMs != null
                    ? `${(selectedRun.durationMs / 1000).toFixed(2)}s`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3">
              <p className="text-[10px] text-zinc-600 uppercase font-medium mb-1">Modelo</p>
              <p className="text-xs text-zinc-300 font-mono">{selectedRun.modelUsed}</p>
            </div>

            {selectedRun.error && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-[10px] text-red-500 uppercase font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Erro
                </p>
                <p className="text-xs text-red-400">{selectedRun.error}</p>
              </div>
            )}

            {/* Input Context */}
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Input Context</p>
              <pre className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-[11px] text-zinc-400 font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(selectedRun.inputContext, null, 2)}
              </pre>
            </div>

            {/* Output Result */}
            {selectedRun.outputResult && (
              <div>
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Output Result</p>
                <pre className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-[11px] text-zinc-400 font-mono overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedRun.outputResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
