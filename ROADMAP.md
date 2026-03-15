# CORTEX FC — Roadmap de Producao Comercial

> **Versao:** 2.0 | **Data:** 15 Março 2026
> **Status atual:** MVP Demo (pre-revenue)
> **Objetivo:** Plataforma SaaS premium para o ecossistema futebol — clubes, empresarios, scouts, jornalistas, agencias

---

## Auditoria de Estado Atual

### O que existe e funciona

| Componente | Status | Observacao |
|------------|--------|------------|
| Landing page + pricing | ✅ Real | 887 linhas, funil completo, responsivo |
| Dashboard (6 paginas) | ✅ Real | Stats, scatter VxRx, alertas, tabela analises |
| Schema PostgreSQL (Neon) | ✅ Real | 10 tabelas, enums, indices, relacoes Drizzle |
| 6 Agentes IA (Claude) | ✅ Real | ORACLE, SCOUT, ANALISTA, CFO, BOARD, COACHING |
| Wizard de Analise 5 etapas | ✅ Real | Input manual funcional, salva no DB |
| 55 jogadores Premier League | ✅ Real | Seed com dados publicos 2024/25 |
| API Routes (5 endpoints) | ✅ Real | GET/POST com validacao |
| Tipos TypeScript | ✅ Real | 20+ interfaces, VxRx, Neural Layers, algoritmos |
| Graficos Recharts | ✅ Real | VxRx Scatter, Neural Radar, Decision Badge |
| Calculadoras Vx/Rx | ✅ Real | Formulas proprietarias com 14 componentes |

### O que esta quebrado ou incompleto

| Componente | Severidade | Problema |
|------------|------------|---------|
| Multi-tenancy | 🔴 CRITICO | getPlayers() retorna TODOS os jogadores. Sem filtro orgId em nenhuma query |
| Rate limit API IA | 🔴 CRITICO | /api/oracle sem throttle. Usuario pode spammar e estourar custo Claude |
| Seed data Vx/Rx | 🔴 CRITICO | vxComponents e rxComponents = {} (vazios). ORACLE nao tem dados para analisar |
| Auth real | 🔴 CRITICO | Google OAuth nao configurado. Register sem email verification |
| ORACLE no Wizard | 🟠 ALTO | Etapa 5 nunca chama IA. Botao "Gerar com IA" prometido mas nao existe |
| 4 agentes orphaned | 🟠 ALTO | SCOUT, ANALISTA, CFO, BOARD existem mas nenhuma rota os chama |
| Audit log | 🟠 ALTO | Tabela agentRuns existe mas nunca e populada |
| Pagination | 🟠 ALTO | Queries sem LIMIT. Com 10k jogadores, dashboard trava |
| Validacao de existencia | 🟡 MEDIO | POST analise aceita playerId/clubId inexistentes |
| Email verification | 🟡 MEDIO | Registro aceita email fake sem confirmacao |
| CORS headers | 🟡 MEDIO | API aberta para cross-origin sem protecao |
| Error boundaries | 🟡 MEDIO | Erro em child component = pagina inteira branca |
| SEO | 🟢 BAIXO | Sem og:image, structured data, sitemap.xml |
| Accessibility | 🟢 BAIXO | Charts sem aria-label, sem keyboard navigation |

---

## Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────┐
│                    CORTEX FC PLATFORM                        │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│ Clubes   │ Scouts   │Empresarios│Jornalistas│ Agencias      │
│ (Pro)    │ (Ind)    │ (Pro)     │ (Free+)   │ (Enterprise)  │
├──────────┴──────────┴──────────┴──────────┴────────────────┤
│                    CAMADA DE ACESSO                          │
│  NextAuth v5 + RBAC (admin/analyst/viewer/guest)            │
│  Stripe Billing + Feature Gating por Tier                   │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE PRODUTO                         │
│  Dashboard │ Scouting Pipeline │ Analysis Wizard │ Reports  │
│  Player DB │ Comparador        │ Agent Console   │ Alertas  │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE IA                              │
│  ORACLE │ SCOUT │ ANALISTA │ CFO │ BOARD │ COACHING         │
│  Claude Sonnet 4 + Caching + Rate Limit + Audit Log         │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE DADOS                           │
│  Neon PostgreSQL │ API-Football │ Transfermarkt scraper      │
│  Redis (Upstash) │ Vercel Blob  │ Background Jobs (Inngest) │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE INFRA                           │
│  Vercel │ Sentry │ PostHog │ GitHub Actions │ Neon Branching│
└─────────────────────────────────────────────────────────────┘
```

---

## Personas e Tiers

| Persona | Tier | Preco/mes | Limites | Features principais |
|---------|------|-----------|---------|---------------------|
| **Jornalista / Curioso** | Free | €0 | 3 analises/mes, read-only | Dashboard publico, consultar jogadores, ver analises compartilhadas |
| **Scout Individual** | Scout | €49 | 30 analises, 5 agentes, 1 usuario | Pipeline scouting, comparador, alertas basicos |
| **Clube Profissional** | Club | €299 | Ilimitado, 10 usuarios | Todos os agentes, reports PDF, API, alertas tempo real, dados ao vivo |
| **Holding / Agencia** | Enterprise | €899+ | Multi-clube, 50 usuarios | White-label, SSO, API dedicada, benchmarking, suporte prioritario |

---

## TRILHA 1 — FUNDACAO (Sprints 1-4, ~4 semanas)

> **Meta:** Produto fechado, seguro, monetizavel. Primeiro euro entra.

### Sprint 1.1 — Seguranca & Multi-tenancy (Semana 1)

**Objetivo:** Nenhum usuario ve dados de outro. Auth funciona de verdade.

| # | Task | Arquivo(s) | Prioridade |
|---|------|-----------|-----------|
| 1 | Filtrar TODAS as queries por orgId (getPlayers, getAnalyses, getDashboardStats, getAlertData) | src/db/queries.ts | P0 |
| 2 | Middleware: extrair orgId da session e injetar em context | middleware.ts | P0 |
| 3 | API routes: validar que playerId/clubId pertencem a org do usuario antes de operar | src/app/api/*/route.ts | P0 |
| 4 | Configurar Google OAuth (env vars GOOGLE_CLIENT_ID + SECRET) | .env.local, src/auth.ts | P0 |
| 5 | Email verification via Resend: gerar token, enviar link, ativar conta | src/app/api/register/route.ts, novo: src/app/api/verify-email/route.ts | P0 |
| 6 | Validacao de senha forte (min 12 chars, maiuscula, numero, especial) | src/app/api/register/route.ts | P0 |
| 7 | Rate limit global com Upstash: 100 req/min por IP, 10 req/min por endpoint IA | middleware.ts, pnpm add @upstash/ratelimit @upstash/redis | P0 |
| 8 | CORS headers explicitos no middleware | middleware.ts | P1 |
| 9 | Adicionar soft delete (deletedAt) nas tabelas players, neuralAnalyses, users | src/db/schema.ts, nova migration | P1 |
| 10 | RBAC: admin pode tudo, analyst cria/edita, viewer so le | src/lib/rbac.ts (novo), checar em cada API route | P1 |

**Entregavel:** Login real. Dados isolados por org. Rate limit ativo. Email verificado.

### Sprint 1.2 — ORACLE Integrado + Audit (Semana 2)

**Objetivo:** IA funciona de verdade no wizard. Cada chamada e logada.

| # | Task | Arquivo(s) | Prioridade |
|---|------|-----------|-----------|
| 11 | Botao "Gerar Analise com IA" na etapa 5 do wizard | src/app/(dashboard)/analysis/new/page.tsx | P0 |
| 12 | Chamar /api/oracle e preencher todos os campos (C1-C7, Vx, Rx, algoritmos, decisao) | src/app/api/oracle/route.ts | P0 |
| 13 | Loading state com progresso durante chamada IA (15-20s) | analysis/new/page.tsx | P0 |
| 14 | Usuario pode revisar/ajustar scores pos-IA antes de salvar | analysis/new/page.tsx | P0 |
| 15 | Salvar agentRun no DB apos cada chamada (tokens, duracao, sucesso/erro) | src/app/api/oracle/route.ts, src/db/queries.ts | P0 |
| 16 | Popular seed com vxComponents e rxComponents reais (usar calculadoras existentes) | src/db/seed.ts | P0 |
| 17 | Timeout de 60s na chamada Claude com abort controller | src/lib/agents/base-agent.ts | P1 |
| 18 | Retry logic: 1 retry com backoff exponencial em caso de erro 429/500 | src/lib/agents/base-agent.ts | P1 |
| 19 | Cache de analises identicas (mesmo player+club+season) por 24h no Redis | src/lib/agents/base-agent.ts | P2 |

**Entregavel:** Analista clica "Gerar com IA", espera 15s, Claude retorna analise completa. Audit log registra tudo.

### Sprint 1.3 — Stripe & Feature Gating (Semana 3)

**Objetivo:** Cobrar pelo produto. Features bloqueadas por tier.

| # | Task | Arquivo(s) | Prioridade |
|---|------|-----------|-----------|
| 20 | Instalar Stripe SDK (pnpm add stripe @stripe/stripe-js) | package.json | P0 |
| 21 | Criar 3 produtos/precos no Stripe Dashboard (Scout €49, Club €299, Enterprise €899) | Stripe Dashboard | P0 |
| 22 | POST /api/stripe/checkout — criar checkout session com orgId metadata | novo: src/app/api/stripe/checkout/route.ts | P0 |
| 23 | POST /api/webhooks/stripe — ouvir checkout.session.completed e subscription.updated | novo: src/app/api/webhooks/stripe/route.ts | P0 |
| 24 | Atualizar tier da org no DB quando pagamento confirmado | webhook handler | P0 |
| 25 | Feature gate middleware: checar tier antes de permitir acao (analises/mes, usuarios, agentes) | novo: src/lib/feature-gates.ts, verificar em API routes | P0 |
| 26 | Pagina /billing: plano atual, botao upgrade, portal Stripe para gerenciar | novo: src/app/(dashboard)/billing/page.tsx | P1 |
| 27 | Banner de "upgrade" quando usuario atinge limite do tier | componente global no layout | P1 |
| 28 | Trial de 14 dias para tier Club (automatico no registro) | auth callback, feature-gates.ts | P2 |

**Entregavel:** Cliente escolhe plano, paga, acessa features do tier. Upgrade/downgrade funciona.

### Sprint 1.4 — Polish para Lancamento (Semana 4)

**Objetivo:** Produto parece profissional. Pronto para primeiro cliente.

| # | Task | Arquivo(s) | Prioridade |
|---|------|-----------|-----------|
| 29 | Error boundaries em TODAS as rotas (error.tsx em cada segmento) | src/app/**/error.tsx | P0 |
| 30 | Loading skeletons em todas as paginas de dados | src/app/**/loading.tsx | P0 |
| 31 | Paginas legais: /termos e /privacidade | novo: src/app/termos/page.tsx, src/app/privacidade/page.tsx | P0 |
| 32 | Email transacional (Resend): boas-vindas, reset senha, alerta de analise | novo: src/lib/email.ts | P0 |
| 33 | Onboarding wizard: nome da org, logo upload, convite de colegas | novo: src/app/(dashboard)/onboarding/page.tsx | P1 |
| 34 | SEO: og:image, structured data JSON-LD, sitemap.xml, robots.txt | src/app/layout.tsx, novo: src/app/sitemap.ts | P1 |
| 35 | Dominio customizado (cortexfc.com ou cortex-fc.com) | Vercel + registrar | P1 |
| 36 | Vercel Analytics + PostHog | src/app/layout.tsx | P2 |
| 37 | Notificacao in-app (toast) para acoes do usuario | componente global | P2 |

**Entregavel:** Produto pronto para vender. Landing → Register → Pay → Dashboard → Analyze.

---

## TRILHA 2 — DADOS REAIS (Sprints 5-8, ~4 semanas)

> **Meta:** Sair de dados seed para dados ao vivo. Plataforma alimenta automaticamente.

### Sprint 2.1 — Integracao API-Football

| # | Task | Detalhe |
|---|------|---------|
| 38 | Integrar API-Football (RapidAPI) — criar service layer | src/services/api-football.ts |
| 39 | Cron job: importar resultados de partidas diariamente | Inngest ou Vercel Cron |
| 40 | Importar stats de jogadores (xG, xA, passes, tackles, rating) → playerMatchStats | src/services/sync-player-stats.ts |
| 41 | Importar transferencias → transfers table | src/services/sync-transfers.ts |
| 42 | Atualizar valores de mercado semanalmente | src/services/sync-market-values.ts |
| 43 | Dashboard com dados reais da temporada | Refatorar queries para usar playerMatchStats |
| 44 | Popular leagues + seasons no DB | migration + seed |
| 45 | Expandir de Premier League para Top 5 ligas (La Liga, Serie A, Bundesliga, Ligue 1) | Ampliar sync |

### Sprint 2.2 — Player Profile Enriquecido

| # | Task | Detalhe |
|---|------|---------|
| 46 | Pagina de jogador completa: bio, stats temporada, historico, graficos | src/app/(dashboard)/players/[id]/page.tsx |
| 47 | Grafico de evolucao: rating por jogo, tendencia de xG/xA | Recharts line chart |
| 48 | Heatmap de posicao em campo | novo componente SVG |
| 49 | Timeline de transferencias | componente visual |
| 50 | Comparacao lado-a-lado de 2 jogadores | src/app/(dashboard)/players/compare/page.tsx |
| 51 | Fotos de jogadores (import via API-Football ou Vercel Blob upload) | CDN/Blob |

### Sprint 2.3 — Scouting Pipeline Completo

| # | Task | Detalhe |
|---|------|---------|
| 52 | CRUD scouting targets: adicionar jogador ao pipeline, editar status, notas | API + UI |
| 53 | Pipeline kanban com drag-and-drop (watching → contacted → negotiating → closed/passed) | novo: src/components/scouting/KanbanBoard.tsx |
| 54 | SCOUT agent integrado: buscar alvos por perfil (posicao, idade, orcamento, liga) | POST /api/scout + UI |
| 55 | Fit Score calculado pelo SCOUT agent para cada alvo | exibir no card |
| 56 | Alertas de mercado: contrato expirando, valor mudou >10%, lesao | src/services/alerts.ts |
| 57 | Shortlist compartilhavel com link publico (token assinado) | /scouting/share/[token] |

### Sprint 2.4 — Reports Premium

| # | Task | Detalhe |
|---|------|---------|
| 58 | Geracao PDF server-side com @react-pdf/renderer | src/lib/pdf-generator.ts |
| 59 | 4 templates: Player Report, Squad Analysis, Scouting Report, Weekly Newsletter | src/components/reports/templates/ |
| 60 | ANALISTA agent integrado: gerar relatorio tatico pos-jogo | POST /api/analista + UI |
| 61 | Branding customizado no PDF (logo da org, cores) | template parametrizado |
| 62 | Agendamento: relatorio semanal automatico por email | Inngest + Resend cron |
| 63 | Compartilhamento por link publico com expiracao | /reports/view/[token] |

---

## TRILHA 3 — TODOS OS AGENTES ATIVOS (Sprints 9-10, ~2 semanas)

> **Meta:** 6 agentes IA funcionando com endpoints, UI e audit.

### Sprint 3.1 — Agentes Integrados

| # | Task | Agente | Endpoint | UI |
|---|------|--------|----------|-----|
| 64 | SCOUT agent com endpoint e pagina | SCOUT | POST /api/scout | Scouting page: form + resultados |
| 65 | ANALISTA agent com endpoint e pagina | ANALISTA | POST /api/analista | Reports page: gerar relatorio |
| 66 | CFO agent com endpoint e modal | CFO | POST /api/cfo | Player detail: "Simular Contratacao" |
| 67 | BOARD ADVISOR com endpoint e dashboard widget | BOARD | POST /api/board | Dashboard: "Briefing Executivo" |
| 68 | COACHING ASSIST com endpoint | COACHING | POST /api/coaching | Player detail: "Plano de Desenvolvimento" |

### Sprint 3.2 — Agent Console

| # | Task | Detalhe |
|---|------|---------|
| 69 | Pagina /agent-console: historico de todas as chamadas IA | src/app/(dashboard)/agent-console/page.tsx |
| 70 | Filtros: por agente, por data, por jogador, por sucesso/erro | UI com facets |
| 71 | Detalhes de cada run: input, output JSON, tokens, custo, duracao | Drawer/modal |
| 72 | Metricas: total de chamadas, custo acumulado, agente mais usado | Cards no topo |
| 73 | Export CSV dos agent runs | Botao download |

---

## TRILHA 4 — ESCALA & ENTERPRISE (Sprints 11-14, ~4 semanas)

> **Meta:** Atender multiplos clubes simultaneamente. Virar plataforma.

### Sprint 4.1 — Multi-tenancy Avancado

| # | Task | Detalhe |
|---|------|---------|
| 74 | Org switcher no header (para usuarios em multiplas orgs) | UI dropdown |
| 75 | Convite de membros por email (admin envia, usuario aceita) | /api/invites + email |
| 76 | Gerenciamento de equipe: listar usuarios, mudar role, desativar | /settings/team |
| 77 | Holding dashboard: visao agregada de multiplos clubes | novo modulo |
| 78 | Benchmarking entre clubes: comparar squads, SCN medio, investimento | graficos comparativos |

### Sprint 4.2 — API Publica v1

| # | Task | Detalhe |
|---|------|---------|
| 79 | API REST documentada (OpenAPI 3.0 / Swagger) | /api/v1/* com spec |
| 80 | API keys com rate limiting por tier | Dashboard de API keys |
| 81 | Endpoints: GET players, GET analyses, POST oracle, GET reports | 4 endpoints minimos |
| 82 | Webhooks para clientes: notificar quando analise concluida | /api/v1/webhooks |
| 83 | Documentacao interativa em /docs (Scalar ou Swagger UI) | pagina publica |

### Sprint 4.3 — Performance & Infra

| # | Task | Detalhe |
|---|------|---------|
| 84 | Redis cache (Upstash) para dashboard stats e queries pesadas | src/lib/cache.ts |
| 85 | Background jobs com Inngest: PDF gen, email, data sync, cache invalidation | src/inngest/ |
| 86 | CDN para assets (logos clubes, fotos jogadores, PDFs) | Vercel Blob + CDN |
| 87 | Sentry error monitoring em producao | src/app/layout.tsx + sentry.config |
| 88 | Database read replicas no Neon para queries pesadas | neon.tech config |
| 89 | GitHub Actions CI: lint, typecheck, build, test | .github/workflows/ci.yml |

### Sprint 4.4 — Enterprise Features

| # | Task | Detalhe |
|---|------|---------|
| 90 | SSO/SAML para clientes enterprise | NextAuth SAML provider |
| 91 | White-label: logo, cores, dominio customizado por org | Config em organizations table + CSS vars |
| 92 | Audit log completo: quem fez o que, quando, em qual entidade | src/db/schema.ts audit_logs table |
| 93 | Export de dados: CSV, Excel, JSON de qualquer tabela | Botoes de export globais |
| 94 | SLA e suporte prioritario: ticket system ou Intercom | Integracao 3rd party |

---

## TRILHA 5 — DIFERENCIACAO (Sprints 15-20, ~6 semanas)

> **Meta:** Features que ninguem mais tem. Moat competitivo.

### Sprint 5.1 — Chat IA Contextual

| # | Task | Detalhe |
|---|------|---------|
| 95 | Chat com Claude contextual: "Compare Saka com Palmer para nossa ala direita" | Interface chat no dashboard |
| 96 | RAG: contexto automatico com dados do DB do usuario (elenco, analises, orcamento) | src/lib/rag-context.ts |
| 97 | Historico de conversas persistido | Nova tabela + UI |
| 98 | Sugestoes de perguntas baseadas no contexto da org | UX inteligente |

### Sprint 5.2 — Simulador de Janela

| # | Task | Detalhe |
|---|------|---------|
| 99 | "E se contratarmos X e vendermos Y?" — simulador visual | Nova pagina interativa |
| 100 | Impacto financeiro: custo total, FFP, folha salarial | CFO agent alimenta |
| 101 | Impacto tatico: como muda o SCN+ medio, gaps preenchidos | Calculo local |
| 102 | Comparacao de cenarios: Cenario A vs B vs C | UI side-by-side |

### Sprint 5.3 — Video & Advanced Analytics

| # | Task | Detalhe |
|---|------|---------|
| 103 | Upload de video clips (Vercel Blob / S3) | Upload UI + storage |
| 104 | IA extrai eventos taticos de clips (frame analysis) | Claude Vision ou modelo dedicado |
| 105 | Modelo ML proprio: treinar com historico de decisoes para melhorar predicoes | Python + TensorFlow/PyTorch |
| 106 | Indice de sinergia de elenco: como novo jogador encaixa | Algoritmo proprietario |

### Sprint 5.4 — Mobile & Marketplace

| # | Task | Detalhe |
|---|------|---------|
| 107 | App mobile (React Native ou PWA) para scouts em campo | App nativo ou PWA |
| 108 | Integracao Wyscout/InStat (dados premium de scouting) | API integration |
| 109 | Marketplace de analises: clubes vendem/compram relatorios | Nova vertical |
| 110 | Notificacoes push: alerta de contrato, oportunidade de mercado | Push + email |

---

## Banco de Dados — Evolucao do Schema

### Tabelas que precisam ser adicionadas

```sql
-- Verificacao de email
email_verifications (id, user_id, token, expires_at, verified_at)

-- Convites de equipe
team_invites (id, org_id, email, role, token, invited_by, expires_at, accepted_at)

-- Assinaturas Stripe
subscriptions (id, org_id, stripe_customer_id, stripe_subscription_id, tier, status,
               current_period_start, current_period_end, cancel_at)

-- Audit log granular
audit_logs (id, org_id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at)

-- Chat IA
chat_conversations (id, org_id, user_id, title, created_at)
chat_messages (id, conversation_id, role, content, tokens_used, created_at)

-- API keys
api_keys (id, org_id, key_hash, name, permissions, rate_limit, last_used_at, created_at, revoked_at)

-- Notificacoes
notifications (id, org_id, user_id, type, title, body, read_at, created_at)

-- Feature flags
feature_flags (id, name, enabled_tiers, rollout_percentage, created_at)
```

### Tabelas existentes que precisam de alteracao

```sql
-- players: adicionar deletedAt
ALTER TABLE players ADD COLUMN deleted_at TIMESTAMP;

-- organizations: adicionar campos Stripe e config
ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN primary_color TEXT DEFAULT '#10b981';
ALTER TABLE organizations ADD COLUMN logo_url TEXT;

-- users: adicionar email_verified
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;

-- neural_analyses: adicionar orgId direto (desnormalizar para multi-tenancy rapido)
ALTER TABLE neural_analyses ADD COLUMN org_id UUID REFERENCES organizations(id);
```

---

## Stack Tecnico Completo

| Camada | Tecnologia | Custo | Fase |
|--------|-----------|-------|------|
| **Framework** | Next.js 16 (App Router) | Free | Atual |
| **Linguagem** | TypeScript strict | Free | Atual |
| **Database** | Neon PostgreSQL | Free → $19/mes | Atual |
| **ORM** | Drizzle | Free | Atual |
| **Auth** | NextAuth v5 | Free | Trilha 1 |
| **IA** | Anthropic Claude Sonnet 4 | ~$3/1M tokens | Atual |
| **Pagamento** | Stripe | 2.9% + €0.30/tx | Trilha 1 |
| **Email** | Resend | Free → $20/mes | Trilha 1 |
| **Rate Limit** | Upstash Redis | Free → $10/mes | Trilha 1 |
| **Background Jobs** | Inngest | Free → $25/mes | Trilha 2 |
| **Football Data** | API-Football (RapidAPI) | Free → $30/mes | Trilha 2 |
| **PDF** | @react-pdf/renderer | Free | Trilha 2 |
| **File Storage** | Vercel Blob | $0.02/GB | Trilha 2 |
| **Monitoring** | Sentry | Free → $26/mes | Trilha 4 |
| **Analytics** | PostHog | Free | Trilha 1 |
| **CDN** | Vercel Edge | Incluso | Atual |
| **CI/CD** | GitHub Actions | Free | Trilha 4 |

---

## Seguranca — Checklist Obrigatorio

### Antes de qualquer lancamento publico

- [ ] Multi-tenancy: TODA query filtra por orgId
- [ ] Rate limiting: global (100/min) + por endpoint IA (10/min)
- [ ] CORS: headers explicitos, origin whitelist
- [ ] Input validation: Zod em TODOS os endpoints POST/PUT
- [ ] SQL injection: Drizzle parametrizado (ja OK, manter)
- [ ] XSS: sanitizar HTML no reasoning e notas (implementar no POST analise)
- [ ] CSRF: NextAuth token (ja OK via cookies)
- [ ] Senhas: min 12 chars, complexidade, bcrypt cost 12
- [ ] Email verification: obrigatorio antes de acessar dashboard
- [ ] JWT rotation: refresh token a cada 7 dias
- [ ] Audit log: TODA acao destrutiva logada
- [ ] Secrets: NUNCA expor API keys no client (Anthropic, Stripe no server only)
- [ ] Webhook validation: verificar assinatura Stripe em /api/webhooks/stripe
- [ ] File upload: validar tipo, tamanho max 5MB, scan malware
- [ ] API keys: hash SHA-256, nunca armazenar em plaintext

---

## UX/UI — Melhorias Prioritarias

### Quick Wins (1-2h cada)

| # | Melhoria | Impacto |
|---|----------|---------|
| 1 | Empty states com ilustracao e CTA em todas as paginas | Reduz confusao de usuario novo |
| 2 | Toast notifications para feedback de acoes (salvar, deletar, erro) | Confirma que acao funcionou |
| 3 | Breadcrumb em todas as paginas internas | Navegacao mais clara |
| 4 | Skeleton loaders em vez de "Carregando..." | Percepcao de velocidade |
| 5 | Keyboard shortcuts (Cmd+K busca, Cmd+N nova analise) | Power users adoram |

### Melhorias de Fundo

| # | Melhoria | Impacto |
|---|----------|---------|
| 6 | Onboarding tutorial (3 etapas) no primeiro login | Reduz churn em 40% |
| 7 | Dashboard customizavel (drag widgets, escolher metricas) | Cada usuario ve o que importa |
| 8 | Dark/light mode toggle | Preferencia pessoal |
| 9 | Responsive mobile completo (sidebar → bottom nav) | Scouts em campo |
| 10 | Internacionalizacao (PT-BR, EN, ES) | Mercado global |

---

## Metricas de Sucesso

| Fase | KPI | Meta | Prazo |
|------|-----|------|-------|
| Trilha 1 | Primeiro cliente pagante | 1 clube | 30 dias |
| Trilha 1 | MRR | €299+ | 30 dias |
| Trilha 2 | Clientes ativos | 5+ | 60 dias |
| Trilha 2 | Retencao mensal | >90% | 90 dias |
| Trilha 2 | Analises geradas/cliente/mes | >20 | 90 dias |
| Trilha 3 | NPS | >40 | 90 dias |
| Trilha 4 | Clientes ativos | 15+ | 120 dias |
| Trilha 4 | MRR | €5.000+ | 120 dias |
| Trilha 5 | ARR | €100.000+ | 12 meses |

---

## Ordem de Execucao Recomendada

```
SEMANA 1  → Sprint 1.1 (Seguranca + Multi-tenancy)
SEMANA 2  → Sprint 1.2 (ORACLE integrado + Audit)
SEMANA 3  → Sprint 1.3 (Stripe + Feature Gating)
SEMANA 4  → Sprint 1.4 (Polish + Lancamento)
           ↓ PRIMEIRO CLIENTE PAGANTE ↓
SEMANA 5  → Sprint 2.1 (API-Football)
SEMANA 6  → Sprint 2.2 (Player Profile)
SEMANA 7  → Sprint 2.3 (Scouting Pipeline)
SEMANA 8  → Sprint 2.4 (Reports PDF)
           ↓ PRODUCT-MARKET FIT ↓
SEMANA 9  → Sprint 3.1 (Todos os Agentes)
SEMANA 10 → Sprint 3.2 (Agent Console)
SEMANA 11 → Sprint 4.1 (Multi-tenancy Avancado)
SEMANA 12 → Sprint 4.2 (API Publica)
SEMANA 13 → Sprint 4.3 (Performance)
SEMANA 14 → Sprint 4.4 (Enterprise)
           ↓ ESCALA ↓
SEMANA 15+ → Trilha 5 (Diferenciacao)
```

---

## Proxima Acao Imediata

**Sprint 1.1, Task 1:** Abrir `src/db/queries.ts` e adicionar filtro `orgId` em TODAS as queries.

Isto desbloqueia tudo.
