export default function DocsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Documentacao da API</h1>
        <p className="text-zinc-400 mt-1">
          Use a API do Cortex FC para integrar analytics futebolistico no seu sistema.
        </p>
      </div>

      {/* Authentication */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Autenticacao</h2>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <p className="text-sm text-zinc-300 mb-3">
            Todas as requisicoes devem incluir um header de autorizacao com sua chave API:
          </p>
          <code className="block bg-zinc-900 text-emerald-400 p-3 rounded text-sm font-mono">
            Authorization: Bearer ctx_sua_chave_aqui
          </code>
          <p className="text-xs text-zinc-500 mt-3">
            Crie chaves em Configuracoes &rarr; Chaves API. Cada chave tem escopos (read, write, admin).
          </p>
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Endpoints</h2>

        {/* Players */}
        <EndpointCard
          method="GET"
          path="/api/v1/players"
          description="Listar jogadores com filtros e paginacao"
          scope="read"
          params={["search (string)", "position (string)", "limit (int, default 20)", "cursor (string)"]}
        />

        {/* Oracle */}
        <EndpointCard
          method="POST"
          path="/api/v1/oracle"
          description="Executar agente Oracle — analise neural de jogador"
          scope="write"
          body={["playerId (uuid, obrigatorio)", "clubContextId (uuid, obrigatorio)", "playerName (string, obrigatorio)", "position (string, obrigatorio)", "model (string, opcional)"]}
        />

        {/* Reports */}
        <EndpointCard
          method="GET"
          path="/api/v1/reports"
          description="Listar relatorios gerados"
          scope="read"
          params={["id (uuid)", "limit (int)", "offset (int)"]}
        />

        {/* Webhooks */}
        <EndpointCard
          method="POST"
          path="/api/v1/webhooks"
          description="Registrar webhook para eventos"
          scope="admin"
          body={["url (string, obrigatorio)", "events (array: analysis_complete, report_generated, etc.)"]}
        />

        {/* Health */}
        <EndpointCard
          method="GET"
          path="/api/health"
          description="Status do sistema e dependencias"
          scope="publico"
          params={[]}
        />
      </section>

      {/* Rate Limits */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Rate Limits</h2>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <ul className="text-sm text-zinc-300 space-y-2">
            <li>&bull; API geral: 60 requisicoes/minuto por chave</li>
            <li>&bull; Agentes IA: 10 requisicoes/minuto por usuario</li>
            <li>&bull; Organizacao: 30 chamadas de agente/minuto</li>
          </ul>
          <p className="text-xs text-zinc-500 mt-3">
            Headers de resposta incluem X-RateLimit-Remaining e Retry-After.
          </p>
        </div>
      </section>

      {/* OpenAPI */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">OpenAPI Spec</h2>
        <p className="text-sm text-zinc-400">
          Acesse a especificacao completa em formato JSON:
        </p>
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-zinc-800 text-emerald-400 rounded-lg hover:bg-zinc-700 text-sm font-mono"
        >
          GET /api/docs
        </a>
      </section>
    </div>
  )
}

function EndpointCard({
  method,
  path,
  description,
  scope,
  params,
  body,
}: {
  method: string
  path: string
  description: string
  scope: string
  params?: string[]
  body?: string[]
}) {
  const methodColor = method === "GET" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${methodColor}`}>
          {method}
        </span>
        <code className="text-sm text-white font-mono">{path}</code>
        <span className="ml-auto text-xs text-zinc-500">Scope: {scope}</span>
      </div>
      <p className="text-sm text-zinc-400 mb-3">{description}</p>
      {params && params.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Parametros:</p>
          <ul className="text-xs text-zinc-400 space-y-1">
            {params.map((p) => <li key={p} className="font-mono">&bull; {p}</li>)}
          </ul>
        </div>
      )}
      {body && body.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-zinc-500 mb-1">Body (JSON):</p>
          <ul className="text-xs text-zinc-400 space-y-1">
            {body.map((b) => <li key={b} className="font-mono">&bull; {b}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
