# Cortex FC

Plataforma de analytics de futebol com agentes de IA. Utiliza inteligência artificial (Anthropic Claude) para análise tática, estatística e scouting de jogadores.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Drizzle ORM + Neon (PostgreSQL serverless)
- NextAuth.js (autenticação)
- Anthropic AI SDK (agentes IA)
- Tailwind CSS + Radix UI
- Recharts (gráficos)

## Como rodar

```bash
git clone https://github.com/institutoveigacabral-maker/cortex-fc.git
cd cortex-fc
npm install
npm run dev
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do PostgreSQL (Neon) |
| `AUTH_SECRET` | Secret do NextAuth.js |
| `ANTHROPIC_API_KEY` | Chave de API da Anthropic (Claude) |

## Estrutura

```
src/
├── app/          # App Router (páginas e API routes)
├── auth.ts       # Configuração de autenticação
├── components/   # Componentes React
├── db/           # Schema e conexão Drizzle
├── lib/          # Utilitários
└── types/        # Tipos TypeScript
```
