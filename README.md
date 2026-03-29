# Cortex FC

[![CI](https://github.com/hlemos1/cortex-fc/actions/workflows/ci.yml/badge.svg)](https://github.com/hlemos1/cortex-fc/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Anthropic](https://img.shields.io/badge/Powered_by-Anthropic_Claude-191919?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Production](https://img.shields.io/badge/Status-Production-brightgreen?style=flat-square)](https://cortex-fc.vercel.app)

> Football analytics platform powered by 7 specialized AI agents. Combines Anthropic Claude with proprietary statistical models (Vx & Rx indices) to deliver tactical analysis, player scouting, and financial modeling for football clubs.

🔗 **Live:** [cortex-fc.vercel.app](https://cortex-fc.vercel.app)

---

## 🤖 AI Agent Architecture

7 specialized agents work in concert, each with a distinct role:

| Agent | Role | Model |
|---|---|---|
| **Scout** | Player discovery & talent identification | Claude 3.5 Sonnet |
| **Analyst** | Tactical pattern recognition | Claude 3.5 Sonnet |
| **Financial** | Contract & transfer valuation | Claude 3.5 Sonnet |
| **Injury** | Health & availability prediction | Claude 3.5 Sonnet |
| **Scouting RAG** | Context retrieval from match data | Claude 3 Haiku |
| **Shield** | Defensive line optimization | Claude 3.5 Sonnet |
| **Recruiter** | Multi-tenant org matching | Claude 3.5 Sonnet |

All agents share a RAG (Retrieval-Augmented Generation) context layer built on proprietary Vx and Rx indices.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16, React 19, TypeScript |
| **Database** | Neon (PostgreSQL serverless) + Drizzle ORM |
| **AI** | Anthropic Claude SDK (7 agents) |
| **Auth** | NextAuth.js v5 + Google OAuth |
| **Background Jobs** | Inngest |
| **Payments** | Stripe |
| **Rate Limiting** | Upstash Redis |
| **Observability** | Sentry + Lighthouse CI |
| **Email** | Resend |
| **UI** | Tailwind CSS 4, Radix UI, Recharts, Framer Motion |
| **Testing** | Playwright (E2E) + Vitest |
| **CI/CD** | GitHub Actions |
| **Deploy** | Vercel |

---

## 🏗️ Architecture Highlights

```
cortex-fc/
├── src/
│   ├── agents/          # 7 AI agents (Claude SDK)
│   ├── app/             # Next.js App Router
│   ├── components/      # Radix UI + Tailwind components
│   ├── lib/             # Drizzle ORM, auth, payments
│   └── tests/           # Playwright E2E suite
├── drizzle/             # Database migrations
├── .github/workflows/   # CI/CD pipelines
└── CLAUDE.md            # AI agent context & instructions
```

**Key patterns:**
- Multi-tenancy with org-level isolation (RBAC)
- Edge-ready API routes via Cloudflare-compatible middleware
- Streaming AI responses for real-time UX
- Proprietary Vx (attack) and Rx (defense) rating indices

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/hlemos1/cortex-fc.git
cd cortex-fc

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Required environment variables

```env
DATABASE_URL=           # Neon PostgreSQL connection string
NEXTAUTH_SECRET=        # Auth secret
ANTHROPIC_API_KEY=      # Anthropic Claude API key
STRIPE_SECRET_KEY=      # Stripe payments
UPSTASH_REDIS_REST_URL= # Upstash Redis for rate limiting
SENTRY_DSN=             # Sentry error monitoring
INNGEST_SIGNING_KEY=    # Background job processing
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Lighthouse performance audit
pnpm lighthouse
```

---

## 📊 Production Metrics

- ✅ 7 AI agents in production
- ✅ Multi-tenant with RBAC
- ✅ Stripe subscription billing
- ✅ Sentry error monitoring
- ✅ Lighthouse CI performance gates
- ✅ GitHub Actions CI/CD pipeline

---

## 📄 License

MIT © [Henrique Lemos](https://github.com/hlemos1)
