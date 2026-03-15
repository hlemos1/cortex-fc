import { Brain, ExternalLink, Key, Zap, FileText, Users, Activity, Bot } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/players",
    description: "Lista jogadores no banco de dados",
    params: "?search=name&limit=50&offset=0",
    auth: "Bearer <api_key>",
    response: '{ "data": [Player], "meta": { limit, offset, count } }',
    icon: Users,
    color: "text-blue-400",
  },
  {
    method: "GET",
    path: "/api/v1/analyses",
    description: "Lista analises neurais da organizacao",
    params: "?id=uuid&limit=50&offset=0",
    auth: "Bearer <api_key>",
    response: '{ "data": [Analysis], "meta": { limit, offset, count } }',
    icon: Activity,
    color: "text-emerald-400",
  },
  {
    method: "POST",
    path: "/api/v1/oracle",
    description: "Executa analise neural ORACLE para um jogador",
    params: "Body: { playerId, clubContextId, playerName, position, age?, nationality?, currentClub?, marketValue? }",
    auth: "Bearer <api_key>",
    response: '{ "data": OracleOutput }',
    icon: Bot,
    color: "text-cyan-400",
  },
  {
    method: "GET",
    path: "/api/v1/reports",
    description: "Lista relatorios gerados pela organizacao",
    params: "?id=uuid&limit=20&offset=0",
    auth: "Bearer <api_key>",
    response: '{ "data": [Report], "meta": { limit, offset, count } }',
    icon: FileText,
    color: "text-amber-400",
  },
  {
    method: "GET/POST/DELETE",
    path: "/api/v1/keys",
    description: "Gerenciar API keys (criar, listar, revogar)",
    params: "POST body: { name?, rateLimitPerMin? } | DELETE ?id=uuid",
    auth: "Session (Dashboard login)",
    response: '{ "data": ApiKey, "warning": "..." }',
    icon: Key,
    color: "text-purple-400",
  },
  {
    method: "GET/POST/DELETE",
    path: "/api/v1/webhooks",
    description: "Gerenciar webhook endpoints para notificacoes",
    params: "POST body: { url, events? } | DELETE ?id=uuid",
    auth: "Session (Dashboard login)",
    response: '{ "data": Webhook }',
    icon: Zap,
    color: "text-red-400",
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  POST: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  "GET/POST/DELETE": "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/60 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">CORTEX FC API</h1>
              <p className="text-xs text-zinc-500 font-mono">v1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            API REST para integrar a inteligencia neural do CORTEX FC aos seus sistemas.
            Acesse jogadores, analises, execute o agente ORACLE e receba notificacoes via webhooks.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Auth Section */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              Autenticacao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-400">
              Todos os endpoints <code className="text-emerald-400 bg-zinc-800 px-1 rounded">/api/v1/*</code> requerem autenticacao via Bearer token.
            </p>
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
              <pre className="text-xs text-zinc-300 font-mono">
{`curl -H "Authorization: Bearer ctx_your_api_key_here" \\
     https://cortex-fc.vercel.app/api/v1/players`}
              </pre>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-800/30 rounded-lg p-3">
              <span className="text-amber-400 font-bold">!</span>
              <p>
                API keys sao geradas no dashboard em{" "}
                <Link href="/settings" className="text-emerald-400 hover:underline">
                  Configuracoes
                </Link>{" "}
                ou via <code className="text-zinc-300">POST /api/v1/keys</code>.
                Requer tier <strong className="text-zinc-300">club_professional</strong> ou superior.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 text-zinc-500 font-medium">Tier</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">Req/min (default)</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">Custom Rate</th>
                    <th className="text-center py-2 text-zinc-500 font-medium">ORACLE/min</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-300">Club Professional</td>
                    <td className="py-2 text-center text-zinc-400 font-mono">60</td>
                    <td className="py-2 text-center text-zinc-400">Configuravel</td>
                    <td className="py-2 text-center text-zinc-400 font-mono">10</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-zinc-300">Holding Multi-Club</td>
                    <td className="py-2 text-center text-zinc-400 font-mono">120</td>
                    <td className="py-2 text-center text-zinc-400">Configuravel</td>
                    <td className="py-2 text-center text-zinc-400 font-mono">20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div>
          <h2 className="text-lg font-bold text-zinc-200 mb-4">Endpoints</h2>
          <div className="space-y-4">
            {ENDPOINTS.map((ep) => {
              const Icon = ep.icon
              return (
                <Card key={ep.path} className="bg-zinc-900/80 border-zinc-800">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold font-mono ${METHOD_COLORS[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm text-zinc-200 font-mono">{ep.path}</code>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{ep.description}</p>
                    <div className="space-y-2">
                      <div className="rounded bg-zinc-950 border border-zinc-800 p-3">
                        <p className="text-[10px] text-zinc-600 uppercase font-medium mb-1">Parametros</p>
                        <code className="text-[11px] text-zinc-400 font-mono">{ep.params}</code>
                      </div>
                      <div className="rounded bg-zinc-950 border border-zinc-800 p-3">
                        <p className="text-[10px] text-zinc-600 uppercase font-medium mb-1">Response</p>
                        <code className="text-[11px] text-emerald-400 font-mono">{ep.response}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Webhook Events */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              Webhook Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { event: "analysis_complete", desc: "Disparado quando uma analise neural e concluida" },
                { event: "report_generated", desc: "Disparado quando um relatorio PDF e gerado" },
                { event: "scouting_target_added", desc: "Disparado quando um novo alvo de scouting e adicionado" },
                { event: "agent_run_complete", desc: "Disparado quando qualquer agente IA finaliza execucao" },
              ].map((ev) => (
                <div key={ev.event} className="flex items-start gap-3 p-3 rounded bg-zinc-800/30">
                  <code className="text-[11px] text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    {ev.event}
                  </code>
                  <span className="text-xs text-zinc-400">{ev.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-zinc-950 border border-zinc-800 p-4">
              <p className="text-[10px] text-zinc-600 uppercase font-medium mb-2">Webhook Payload</p>
              <pre className="text-[11px] text-zinc-400 font-mono">
{`{
  "event": "analysis_complete",
  "timestamp": "2026-03-15T12:00:00Z",
  "data": { ... },
  "signature": "sha256=..." // HMAC-SHA256 com seu webhook secret
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-600">
            CORTEX FC API v1.0.0 — Neural Football Analytics
          </p>
          <Link href="/dashboard" className="text-xs text-emerald-500 hover:text-emerald-400 mt-1 inline-block">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
