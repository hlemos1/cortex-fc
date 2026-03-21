# CLAUDE.md — CORTEX FC

> Regras globais em `~/.claude/CLAUDE.md`. Contexto do workspace em `../CLAUDE.md`.
> Este arquivo contem apenas regras especificas do Cortex FC.

---

## O QUE E

Plataforma SaaS de analytics neural para futebol profissional.
6 agentes IA (Claude), indices proprietarios (Vx/Rx), scouting pipeline, simulador de janela.

**URL producao:** https://cortex-fc.vercel.app
**Repo:** https://github.com/institutoveigacabral-maker/cortex-fc
**Status:** Producao. 135 arquivos, 21 tabelas, 69 rotas. Build limpo. Zero erros.

---

## STACK

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Banco | Neon (PostgreSQL serverless) + Drizzle ORM |
| IA | Anthropic Claude SDK (NAO Prisma, NAO OpenAI) |
| Auth | NextAuth.js v5 (beta) + Google OAuth |
| Background | Inngest |
| Pagamentos | Stripe (4 tiers: free, scout, club, holding) |
| Cache/Rate | Upstash Redis |
| Monitor | Sentry (server + client + replay) |
| Email | Resend |
| UI | Tailwind CSS 4, Radix UI, Recharts, Framer Motion |
| i18n | next-intl (PT-BR, EN) |
| PWA | Serwist |
| Testes | Vitest + Testing Library + jsdom |
| Deploy | Vercel + GitHub Actions CI |

---

## PADROES CRITICOS

### Agentes IA
- Todos herdam de `src/lib/agents/base-agent` — NUNCA criar agente sem herdar
- 6 agentes: oracle, analista, scout, board-advisor, cfo-modeler, coaching-assist
- Contexto RAG via `src/lib/rag-context.ts`
- Endpoints em `/api/oracle`, `/api/scout`, etc.
- Runs logados na tabela `agentRuns` com metricas (tokens, custo, duracao)

### Indices Proprietarios
- **Vx** = valor de mercado (calculado em `src/lib/cortex/`)
- **Rx** = rendimento
- Matriz de decisao: CONTRATAR, BLINDAR, MONITORAR, EMPRESTIMO, RECUSAR
- Squad Synergy Index: positionNeed 35%, qualityDelta 30%, ageBalance 15%, complementarity 20%

### Feature Gates
- Definidos em `src/lib/feature-gates.ts`
- Cada feature e gated por tier de assinatura
- NUNCA expor feature premium pra tier free

### Banco
- Drizzle ORM (NAO Prisma) — schema em `src/db/schema.ts`
- Queries reutilizaveis em `src/db/queries.ts`
- Cache via `src/lib/cache.ts` (Upstash Redis)
- Migrations: `pnpm drizzle-kit push`

### API Publica
- Versionada: `/api/v1/*`
- Auth por API key (SHA-256)
- Rate limit por key
- Webhooks com HMAC

---

## O QUE NAO MEXER SEM APROVACAO

- Schema do banco (`src/db/schema.ts`) — 21 tabelas, relacoes complexas
- Feature gates — afeta monetizacao
- Base agent — quebra todos os 6 agentes
- Middleware de auth/RBAC
- Cron jobs (sync-matches, sync-stats, weekly-report)
- Integracao Stripe (checkout, portal, webhook)

---

## ROADMAP

Ver `ROADMAP.md` para status completo das 5 trilhas (todas concluidas).
Proximo: comercializacao (newsletter, primeiro clube piloto).
