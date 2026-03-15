# Cortex FC

Plataforma de analytics de futebol com agentes de IA.

![CI](https://github.com/institutoveigacabral-maker/cortex-fc/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Cortex FC** combina inteligencia artificial (Anthropic Claude) com dados estatisticos para oferecer analises taticas, scouting de jogadores e modelagem financeira para clubes de futebol. A plataforma opera com seis agentes de IA especializados que trabalham em conjunto para suportar decisoes de contratacao, blindagem e emprestimo.

Producao: [https://cortex-fc.vercel.app](https://cortex-fc.vercel.app)

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Banco de dados | Neon (PostgreSQL serverless) + Drizzle ORM |
| IA | Anthropic Claude SDK |
| Autenticacao | NextAuth.js v5 (beta) |
| Background jobs | Inngest |
| Pagamentos | Stripe |
| Rate limiting | Upstash Redis |
| Monitoramento | Sentry |
| Email | Resend |
| UI | Tailwind CSS 4, Radix UI, Recharts |
| Testes | Vitest, Testing Library |
| Deploy | Vercel |

---

## Funcionalidades

### Agentes de IA

A plataforma conta com seis agentes especializados, todos construidos sobre um `base-agent` comum:

- **Oracle** -- Agente central de consulta. Responde perguntas sobre jogadores e tatica usando contexto RAG.
- **Analista** -- Analise estatistica detalhada de desempenho individual e coletivo.
- **Scout** -- Identificacao e avaliacao de jogadores para contratacao, com alertas de scouting.
- **Board Advisor** -- Consultoria estrategica para diretoria, com matriz de decisao (CONTRATAR, BLINDAR, MONITORAR, EMPRESTIMO, RECUSAR).
- **CFO Modeler** -- Modelagem financeira de contratacoes e impacto salarial.
- **Coaching Assist** -- Suporte tatico para comissao tecnica.

### Analytics

- Calculo de indices proprietarios: **Vx** (valor de mercado) e **Rx** (rendimento).
- Scatter plot Vx vs Rx para comparacao visual de elencos.
- Radar neural por jogador com camadas de desempenho.
- Heatmap posicional e clusters (GK, CB, FB, MF, WG, ST).
- Estatisticas por temporada com graficos interativos.
- Sinergia de elenco (squad synergy).
- Timeline de transferencias.

### Plataforma

- Multi-organizacao com troca de contexto (org switcher).
- RBAC (controle de acesso baseado em roles).
- SSO por organizacao.
- Sistema de convites por email.
- Planos de assinatura via Stripe (free, scout_individual, club_professional, holding_multiclub).
- Feature gates por tier.
- Exportacao de relatorios em PDF.
- Audit logs.
- Notificacoes.
- Cron jobs para sincronizacao de partidas, estatisticas e relatorio semanal.
- API publica versionada (v1) com autenticacao por API key.

---

## Primeiros Passos

### Pre-requisitos

- Node.js 20+
- pnpm

### Instalacao

```bash
git clone https://github.com/institutoveigacabral-maker/cortex-fc.git
cd cortex-fc
pnpm install
```

### Variaveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
DATABASE_URL=             # Connection string Neon PostgreSQL
AUTH_SECRET=              # Secret do NextAuth.js
ANTHROPIC_API_KEY=        # Chave de API da Anthropic (Claude)
STRIPE_SECRET_KEY=        # Chave secreta Stripe
STRIPE_WEBHOOK_SECRET=    # Secret do webhook Stripe
UPSTASH_REDIS_REST_URL=   # URL do Redis (Upstash)
UPSTASH_REDIS_REST_TOKEN= # Token do Redis (Upstash)
RESEND_API_KEY=           # Chave de API do Resend (email)
SENTRY_DSN=               # DSN do Sentry (monitoramento)
INNGEST_EVENT_KEY=        # Event key do Inngest
INNGEST_SIGNING_KEY=      # Signing key do Inngest
```

### Banco de Dados

```bash
pnpm drizzle-kit push
pnpm drizzle-kit seed   # opcional: dados de exemplo
```

### Executar

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Referencia da API

### Rotas Internas (autenticacao por sessao)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET/POST | `/api/players` | CRUD de jogadores |
| GET/PUT/DELETE | `/api/players/[id]` | Jogador por ID |
| GET/POST | `/api/team` | CRUD de equipes |
| POST | `/api/analyses` | Criar analise de jogador |
| GET/DELETE | `/api/analyses/[id]` | Analise por ID |
| POST | `/api/oracle` | Consulta ao agente Oracle |
| POST | `/api/analista` | Consulta ao agente Analista |
| POST | `/api/scout` | Consulta ao agente Scout |
| POST | `/api/cfo` | Consulta ao agente CFO |
| POST | `/api/coaching` | Consulta ao agente Coaching |
| POST | `/api/board` | Consulta ao agente Board Advisor |
| POST | `/api/chat` | Chat geral com IA |
| POST | `/api/synergy` | Calculo de sinergia de elenco |
| GET | `/api/scouting` | Listar relatorios de scouting |
| POST | `/api/scouting` | Criar relatorio de scouting |
| POST | `/api/scouting/share` | Compartilhar relatorio |
| POST | `/api/scouting/alerts` | Configurar alertas |
| GET | `/api/export` | Exportar relatorio em PDF |
| GET | `/api/agent-runs` | Historico de execucoes de agentes |
| GET | `/api/audit-logs` | Logs de auditoria |
| GET | `/api/notifications` | Notificacoes do usuario |
| POST | `/api/invites` | Enviar convite por email |
| POST | `/api/orgs` | Criar organizacao |
| POST | `/api/orgs/switch` | Trocar organizacao ativa |
| POST | `/api/org/branding` | Configurar branding da org |
| POST | `/api/org/sso` | Configurar SSO |
| GET | `/api/health` | Health check |

### API Publica (v1) -- autenticacao por API key

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/v1/players` | Listar jogadores |
| POST | `/api/v1/analyses` | Criar analise |
| POST | `/api/v1/oracle` | Consulta ao Oracle |
| GET | `/api/v1/reports` | Listar relatorios |
| POST | `/api/v1/keys` | Gerenciar API keys |
| POST | `/api/v1/webhooks` | Gerenciar webhooks |

### Cron Jobs (Vercel Cron)

| Schedule | Rota | Descricao |
|----------|------|-----------|
| `0 6 * * *` | `/api/cron/sync-matches` | Sincronizar partidas |
| `0 7 * * *` | `/api/cron/sync-stats` | Sincronizar estatisticas |
| `0 9 * * 1` | `/api/cron/weekly-report` | Relatorio semanal |

---

## Testes

```bash
pnpm test              # executar testes
pnpm test:watch        # modo watch
pnpm test:coverage     # com cobertura (v8)
```

Testes usam Vitest com jsdom. Cobertura configurada para `src/lib/**` e `src/services/**`.

---

## Arquitetura

```
src/
├── app/
│   ├── (auth)/              # Paginas de login/registro
│   ├── (dashboard)/         # Dashboard principal
│   ├── api/                 # API routes (internal + v1)
│   ├── docs/                # Documentacao publica
│   ├── pricing/             # Pagina de precos
│   ├── scouting/            # Paginas de scouting
│   └── reports/             # Paginas de relatorios
├── auth.ts                  # Configuracao NextAuth.js
├── components/
│   ├── cortex/              # Componentes do dominio (PlayerCard, NeuralRadar, etc.)
│   └── ui/                  # Componentes base (Radix UI)
├── db/
│   ├── schema.ts            # Schema Drizzle (tabelas, enums, relations)
│   ├── queries.ts           # Queries reutilizaveis
│   ├── index.ts             # Conexao com Neon
│   └── seed.ts              # Dados de exemplo
├── inngest/
│   └── functions.ts         # Background jobs (cache invalidation, notificacoes)
├── lib/
│   ├── agents/              # Agentes de IA (oracle, analista, scout, board, cfo, coaching)
│   ├── cortex/              # Logica de dominio (Vx, Rx, decision-matrix, neural-layers)
│   ├── cache.ts             # Cache com Upstash Redis
│   ├── rate-limit.ts        # Rate limiting
│   ├── rbac.ts              # Controle de acesso
│   ├── stripe.ts            # Integracao Stripe
│   ├── pdf-generator.ts     # Geracao de PDF
│   ├── rag-context.ts       # Contexto RAG para agentes
│   ├── webhook-dispatch.ts  # Dispatch de webhooks
│   └── ...
├── services/                # Integracao com APIs externas (API-Football, etc.)
└── types/                   # Tipos TypeScript compartilhados
```

### Fluxo de Decisao

1. Dados de jogadores sao sincronizados via cron jobs (API-Football).
2. Agentes de IA analisam os dados usando contexto RAG.
3. O sistema calcula indices Vx (valor) e Rx (rendimento).
4. A matriz de decisao gera recomendacoes: CONTRATAR, BLINDAR, MONITORAR, EMPRESTIMO ou RECUSAR.
5. Relatorios sao gerados e podem ser exportados em PDF ou compartilhados.

---

## Deploy

### Vercel

O projeto esta configurado para deploy na Vercel com cron jobs automaticos.

```bash
vercel --prod
```

### Banco de Dados (Neon)

1. Crie um projeto no [Neon](https://neon.tech).
2. Copie a connection string para `DATABASE_URL`.
3. Execute as migrations:

```bash
pnpm drizzle-kit push
```

### Servicos Necessarios

- **Neon** -- PostgreSQL serverless
- **Upstash** -- Redis para cache e rate limiting
- **Stripe** -- Pagamentos e assinaturas
- **Inngest** -- Background jobs
- **Resend** -- Envio de emails transacionais
- **Sentry** -- Monitoramento de erros
- **Anthropic** -- API de IA (Claude)

---

## Contribuindo

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para instrucoes sobre branch naming, commits e pull requests.

---

## Licenca

Este projeto esta licenciado sob a [MIT License](LICENSE).
