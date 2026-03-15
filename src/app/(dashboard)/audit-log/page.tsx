"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  User,
  Clock,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AuditEntry {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
  userName: string | null
  userEmail: string | null
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "analysis.created": { label: "Analise Criada", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  "agent.executed": { label: "Agente Executado", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  "member.invited": { label: "Membro Convidado", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  "member.removed": { label: "Membro Removido", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  "member.role_changed": { label: "Papel Alterado", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  "apikey.created": { label: "API Key Criada", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  "apikey.revoked": { label: "API Key Revogada", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  "webhook.created": { label: "Webhook Criado", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  "webhook.deleted": { label: "Webhook Removido", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  "branding.updated": { label: "Branding Atualizado", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  "sso.updated": { label: "SSO Atualizado", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  "data.exported": { label: "Dados Exportados", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  "report.generated": { label: "Relatorio Gerado", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  "settings.updated": { label: "Config Atualizada", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
}

const ENTITY_FILTERS = [
  "Todos",
  "analysis",
  "player",
  "api_key",
  "webhook",
  "organization",
  "member",
  "report",
]

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState("Todos")
  const [offset, setOffset] = useState(0)
  const LIMIT = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) })
      if (entityFilter !== "Todos") params.set("entityType", entityFilter)

      const res = await fetch(`/api/audit-logs?${params}`)
      const json = await res.json()
      setLogs(json.data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [offset, entityFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function getActionInfo(action: string) {
    return ACTION_LABELS[action] ?? { label: action, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
  }

  function exportCSV() {
    const headers = ["Data", "Usuario", "Acao", "Entidade", "ID Entidade", "IP"]
    const rows = logs.map((l) => [
      l.createdAt,
      l.userEmail ?? "",
      l.action,
      l.entityType ?? "",
      l.entityId ?? "",
      l.ipAddress ?? "",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cortex-audit-log.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            Audit Log
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Historico completo de acoes na organizacao
          </p>
        </div>
        <Button
          onClick={exportCSV}
          variant="outline"
          size="sm"
          className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-600" />
        {ENTITY_FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={entityFilter === f ? "default" : "ghost"}
            onClick={() => { setEntityFilter(f); setOffset(0) }}
            className={`text-xs h-7 ${
              entityFilter === f
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f === "Todos" ? f : f.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Log Table */}
      <Card className="glass rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-sm">
              Nenhum registro encontrado
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {logs.map((log) => {
                const info = getActionInfo(log.action)
                const isExpanded = expandedId === log.id

                return (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/30 transition-colors text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <Badge className={`text-[10px] font-mono border ${info.color}`}>
                          {info.label}
                        </Badge>

                        {log.entityType && (
                          <span className="text-[10px] text-zinc-600 font-mono">
                            {log.entityType}
                            {log.entityId && `:${log.entityId.slice(0, 8)}`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <User className="w-3 h-3" />
                          {log.userName ?? log.userEmail ?? "Sistema"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-mono">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-12 pb-4 space-y-2 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-zinc-600">Email:</span>{" "}
                            <span className="text-zinc-400">{log.userEmail ?? "-"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-zinc-600" />
                            <span className="text-zinc-600">IP:</span>{" "}
                            <span className="text-zinc-400 font-mono">{log.ipAddress ?? "-"}</span>
                          </div>
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] text-zinc-600 uppercase mb-1">Metadata</p>
                            <pre className="text-[11px] text-zinc-500 font-mono bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/50">
              <Button
                size="sm"
                variant="ghost"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                className="text-xs text-zinc-500"
              >
                Anterior
              </Button>
              <span className="text-[11px] text-zinc-600">
                {offset + 1} - {offset + logs.length}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={logs.length < LIMIT}
                onClick={() => setOffset(offset + LIMIT)}
                className="text-xs text-zinc-500"
              >
                Proximo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
