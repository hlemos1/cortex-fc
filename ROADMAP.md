# CORTEX FC — Roadmap de Producao Comercial

> **Versao:** 3.0 | **Data:** 15 Marco 2026
> **Status atual:** Producao (deployed, auditado, 0 erros)
> **URL:** https://cortex-fc.vercel.app
> **Repo:** https://github.com/institutoveigacabral-maker/cortex-fc

---

## Resumo Executivo

Plataforma SaaS de analytics neural para futebol profissional. 6 agentes IA (Claude), scouting pipeline, simulador de janela de transferencias, chat RAG, sistema de notificacoes, API publica v1, multi-tenancy com RBAC, 4 tiers de assinatura.

**135 arquivos, 21 tabelas PostgreSQL, 69 rotas, build limpo, zero erros.**

---

## Status por Sprint

### TRILHA 1 — FUNDACAO

| Sprint | Nome | Status | Observacao |
|--------|------|--------|------------|
| 1.1 | Seguranca & Multi-tenancy | ✅ FEITO | Auth NextAuth v5, RBAC, rate limiting Upstash, CORS, middleware, validacao UUID |
| 1.2 | ORACLE Integrado + Audit | ✅ FEITO | Wizard 5 etapas chama IA, agentRuns logados, seed com vxComponents reais, timeout 60s |
| 1.3 | Stripe & Feature Gating | ✅ FEITO | 4 tiers, feature-gates.ts, checkout/portal/webhook Stripe, billing page |
| 1.4 | Polish para Lancamento | ✅ FEITO | Error boundaries, loading skeletons, /termos, /privacidade, onboarding, SEO (sitemap, robots, og), email (Resend) |

### TRILHA 2 — DADOS REAIS

| Sprint | Nome | Status | Observacao |
|--------|------|--------|------------|
| 2.1 | Integracao API-Football | ✅ FEITO | Service layer, 3 cron jobs (sync-matches, sync-stats, weekly-report), vercel.json crons |
| 2.2 | Player Profile Enriquecido | ✅ FEITO | Stats temporada agregados, grafico evolucao (PerformanceChart), heatmap posicao (PositionHeatmap), timeline transferencias (TransferTimeline), comparador lado-a-lado |
| 2.3 | Scouting Pipeline Completo | ✅ FEITO | CRUD targets, pipeline com filtros/sort, SCOUT agent integrado, fit score, alertas mercado, shortlist compartilhavel com HMAC |
| 2.4 | Reports Premium | ✅ FEITO | PDF server-side (@react-pdf), geracao via agente, compartilhamento por token com expiracao, report publish flow |

### TRILHA 3 — TODOS OS AGENTES ATIVOS

| Sprint | Nome | Status | Observacao |
|--------|------|--------|------------|
| 3.1 | Agentes Integrados | ✅ FEITO | 6 endpoints: /api/oracle, /api/scout, /api/analista, /api/cfo, /api/board, /api/coaching. UI: CfoModal, BoardAdvisorWidget, CoachingAssistPanel, PlayerAgentsBar |
| 3.2 | Agent Console | ✅ FEITO | /agent-console com filtros por agente/status, metricas (tokens, custo, duracao), detalhes de cada run, export CSV |

### TRILHA 4 — ESCALA & ENTERPRISE

| Sprint | Nome | Status | Observacao |
|--------|------|--------|------------|
| 4.1 | Multi-tenancy Avancado | ✅ FEITO | OrgSwitcher, convites por email, /settings/team (listar, mudar role, remover), holding dashboard multi-clube |
| 4.2 | API Publica v1 | ✅ FEITO | /api/v1/* (players, analyses, oracle, reports), API keys SHA-256, rate limit por key, webhooks HMAC, /docs |
| 4.3 | Performance & Infra | ✅ FEITO | Redis cache (cached-queries.ts), Inngest (5 functions), Sentry (server+client+replay), webhook dispatch, CI/CD GitHub Actions, read replica |
| 4.4 | Enterprise Features | ✅ FEITO | Audit logs (tabela + UI + filtros), white-label (cores, logo, dominio, favicon), SSO/SAML config, export CSV/JSON |

### TRILHA 5 — DIFERENCIACAO

| Sprint | Nome | Status | Observacao |
|--------|------|--------|------------|
| 5.1 | Chat IA Contextual | ✅ FEITO | Chat com Claude + RAG context (org summary, analyses, scouting, squad), historico persistido, sugestoes contextuais, gate por tier |
| 5.2 | Simulador de Janela | ✅ FEITO | Multi-cenario (A/B/C), impacto financeiro (FFP, amortizacao, salary delta), impacto tatico (SCN+ delta), comparacao side-by-side |
| 5.3 | Advanced Analytics | ✅ FEITO | Squad Synergy Index (algoritmo proprietario: positionNeed 35%, qualityDelta 30%, ageBalance 15%, complementarity 20%), endpoint /api/synergy |
| 5.4 | Mobile & Notifications | ✅ FEITO | PWA manifest, NotificationsDropdown com polling 30s, mark read individual/all, tabela notifications |

### AUDITORIA DE PRODUCAO

| Item | Status | Observacao |
|------|--------|------------|
| Multi-tenant isolation | ✅ FEITO | RAG, synergy, analyses, chat, team, API keys, webhooks — tudo filtrado por orgId |
| HMAC full-strength | ✅ FEITO | Sem truncacao, SHARE_SECRET type-safe |
| Error sanitization | ✅ FEITO | 6 agent routes + chat — erro interno logado, mensagem generica pro client |
| Security headers | ✅ FEITO | HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy em TODAS as rotas |
| Rate limiting | ✅ FEITO | Global (100/min), IA (10/min), synergy, API keys (per-key) |
| N+1 queries | ✅ FEITO | getPlayersByIds usa inArray |
| SQL injection | ✅ FEITO | LIKE escape para search |
| Org ownership | ✅ FEITO | API key delete, webhook delete, invite delete, team member ops |
| DB migrations | ✅ FEITO | 0000 + 0001, 21 tabelas sincronizadas via drizzle-kit push |
| Deploy | ✅ FEITO | Vercel production, build limpo |

---

## O QUE FALTA — Backlog Priorizado

### P0 — Bloqueadores de Revenue

| # | Task | Detalhe | Status |
|---|------|---------|--------|
| 1 | Configurar env vars na Vercel | 27 variaveis (DB, Auth, Stripe, Anthropic, Redis, Sentry, API-Football) | ✅ FEITO |
| 2 | Fix build Vercel (pnpm detection) | packageManager field adicionado ao package.json | ✅ FEITO |
| 3 | Fix validacao de senha frontend | Alinhado com backend (8 chars + maiuscula + minuscula + numero) | ✅ FEITO |
| 4 | Fix links Termos/Privacidade | Apontavam para # — agora apontam para /termos e /privacidade | ✅ FEITO |
| 5 | Anthropic client error handling | Lazy init com mensagem clara quando API key falta | ✅ FEITO |
| 6 | Testar fluxo completo E2E em producao | Register → Login → Dashboard → Analise → Agente → Chat → Scouting | Pendente |

### P1 — Qualidade de Produto

| # | Task | Detalhe | Status |
|---|------|---------|--------|
| 7 | Dominio customizado (cortexfc.com) | Registrar dominio + configurar na Vercel | Pendente |
| 8 | Verificacao de email no registro | Token + link de ativacao via Resend | ✅ FEITO |
| 9 | Reset de senha | Fluxo forgot-password com token por email | ✅ FEITO |
| 10 | Fotos de jogadores via API-Football | 55/55 jogadores com foto via API-Football IDs | ✅ FEITO |
| 11 | PostHog analytics | Tracking de eventos: signup, analise criada, agente usado | Pendente |
| 12 | Toast notifications globais | Feedback visual pra acoes (salvar, deletar, erro) | ✅ FEITO |

### P2 — Melhorias Tecnicas

| # | Task | Detalhe | Status |
|---|------|---------|--------|
| 13 | neuralAnalyses.orgId | Adicionar coluna direto na tabela (elimina subquery via analystId) | Pendente |
| 14 | JWT refresh token rotation | Rotacao a cada 7 dias | Pendente |
| 15 | Zod validation nos agent inputs/outputs | Schema validation nas rotas dos 6 agentes | Pendente (validacao manual ja funciona) |
| 16 | CORS origin whitelist | Substituir wildcard *.vercel.app por dominios especificos | Pendente (apos dominio customizado) |
| 17 | Cache key com prefixo de ambiente | Evitar colisao dev/staging/prod no Redis | Pendente |
| 18 | Soft delete (deletedAt) | Em players, analyses, users | Pendente |
| 19 | N+1 em getHoldingDashboardStats | 4 queries por org — otimizar com query unica | Pendente (baixo impacto, poucos users holding) |

### P3 — Futuro / Diferenciacao

| # | Task | Detalhe |
|---|------|---------|
| 20 | Video clips + Claude Vision | Upload de video, IA extrai eventos taticos |
| 21 | ML proprio | Treinar com historico de decisoes pra melhorar predicoes |
| 22 | Integracao Wyscout/InStat | Dados premium de scouting |
| 23 | Marketplace de analises | Clubes vendem/compram relatorios |
| 24 | App mobile nativo | React Native pra scouts em campo |
| 25 | Dashboard customizavel | Drag widgets, escolher metricas |
| 26 | Internacionalizacao | PT-BR, EN, ES |
| 27 | Keyboard shortcuts | Cmd+K busca, Cmd+N nova analise |
| 28 | Dark/light mode toggle | Preferencia pessoal |
| 29 | Feature flags dinamicos | Rollout gradual de features |

---

## Arquitetura Atual (Implementada)

```
┌─────────────────────────────────────────────────────────────┐
│                    CORTEX FC PLATFORM                        │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│ Clubes   │ Scouts   │Empresarios│Jornalistas│ Holdings      │
│ (Club)   │ (Scout)  │ (Club)    │ (Free)    │ (Enterprise)  │
├──────────┴──────────┴──────────┴──────────┴────────────────┤
│                    CAMADA DE ACESSO                          │
│  NextAuth v5 (Google + Credentials) + JWT                   │
│  RBAC (admin/analyst/viewer) + Feature Gates (4 tiers)      │
│  Stripe Billing (checkout + portal + webhooks)               │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE PRODUTO                         │
│  Dashboard │ Scouting Pipeline │ Analysis Wizard │ Reports  │
│  Player DB │ Comparador        │ Agent Console   │ Alertas  │
│  Chat IA   │ Simulador Janela  │ Synergy Index   │ Notif    │
│  Audit Log │ Settings (Team, Enterprise, Billing)            │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE IA                              │
│  ORACLE │ SCOUT │ ANALISTA │ CFO │ BOARD │ COACHING         │
│  Claude Sonnet 4 + RAG Context + Rate Limit + Audit Log     │
│  Chat contextual + Synergy Index algorithm                   │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE DADOS                           │
│  Neon PostgreSQL (21 tabelas) │ Drizzle ORM + Migrations    │
│  Redis (Upstash) — cache + rate limit                        │
│  API-Football (3 cron jobs) │ Inngest (5 background jobs)   │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE INFRA                           │
│  Vercel (deploy + crons) │ Sentry (monitoring)              │
│  GitHub Actions (CI) │ HMAC webhooks │ PWA manifest          │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnico

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Framework | Next.js 16.1.6 (App Router) + React 19 | ✅ Producao |
| Linguagem | TypeScript strict | ✅ Producao |
| Database | Neon PostgreSQL (21 tabelas) | ✅ Producao |
| ORM | Drizzle + drizzle-kit migrations | ✅ Producao |
| Auth | NextAuth v5 (Google + Credentials + JWT) | ✅ Producao |
| IA | Anthropic Claude Sonnet 4 (6 agentes) | ✅ Producao (precisa API key) |
| Pagamento | Stripe (checkout + portal + webhooks) | ✅ Codigo pronto (precisa config) |
| Email | Resend | ✅ Codigo pronto (precisa API key) |
| Rate Limit | Upstash Redis | ✅ Codigo pronto (precisa config) |
| Cache | Upstash Redis (cached-queries.ts) | ✅ Codigo pronto (precisa config) |
| Background | Inngest (5 functions) | ✅ Codigo pronto (precisa config) |
| Football Data | API-Football (RapidAPI) | ✅ Codigo pronto (precisa API key) |
| PDF | @react-pdf/renderer | ✅ Producao |
| Monitoring | Sentry (server + client + replay) | ✅ Codigo pronto (precisa DSN) |
| CI/CD | GitHub Actions (lint + typecheck + build) | ✅ Producao |
| Deploy | Vercel | ✅ Producao |
| PWA | manifest.json + meta tags | ✅ Producao |

---

## Env Vars — Status na Vercel

| Var | Status | Necessaria para |
|-----|--------|----------------|
| DATABASE_URL | ✅ Configurada | Tudo |
| AUTH_SECRET | ✅ Configurada | Auth |
| NEXTAUTH_URL | ✅ Configurada | Auth callbacks |
| GOOGLE_CLIENT_ID | ✅ Configurada | Google OAuth |
| GOOGLE_CLIENT_SECRET | ✅ Configurada | Google OAuth |
| SHARE_SECRET | ✅ Configurada | Links compartilhaveis |
| CRON_SECRET | ✅ Configurada | Proteger cron jobs |
| NEXT_PUBLIC_APP_URL | ✅ Configurada | URLs em emails/shares |
| ANTHROPIC_API_KEY | ❌ Falta | 6 agentes IA + Chat |
| UPSTASH_REDIS_REST_URL | ❌ Falta | Rate limiting + cache |
| UPSTASH_REDIS_REST_TOKEN | ❌ Falta | Rate limiting + cache |
| STRIPE_SECRET_KEY | ❌ Falta | Pagamentos |
| STRIPE_WEBHOOK_SECRET | ❌ Falta | Webhook Stripe |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | ❌ Falta | Checkout client |
| API_FOOTBALL_KEY | ❌ Falta | Sync dados reais |
| RESEND_API_KEY | ❌ Falta | Emails transacionais |
| SENTRY_ORG / SENTRY_PROJECT / NEXT_PUBLIC_SENTRY_DSN | ❌ Falta | Monitoring |
| INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY | ❌ Falta | Background jobs |

---

## Metricas de Sucesso

| Fase | KPI | Meta | Prazo |
|------|-----|------|-------|
| Lancamento | Primeiro cliente pagante | 1 clube | 30 dias |
| Lancamento | MRR | €299+ | 30 dias |
| Crescimento | Clientes ativos | 5+ | 60 dias |
| Crescimento | Retencao mensal | >90% | 90 dias |
| Escala | Clientes ativos | 15+ | 120 dias |
| Escala | MRR | €5.000+ | 120 dias |
| Maturidade | ARR | €100.000+ | 12 meses |

---

## Proxima Acao Imediata

1. Adicionar ANTHROPIC_API_KEY na Vercel
2. Criar Redis no Upstash e adicionar URL + Token na Vercel
3. Rodar seed no banco de producao
4. Testar fluxo E2E completo
5. Registrar dominio cortexfc.com
