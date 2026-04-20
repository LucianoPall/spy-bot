# AdClone

**Espione, analise e clone criativos vencedores do Facebook Ads em minutos.**

AdClone é uma plataforma SaaS de inteligência publicitária que combina scraping da Meta Ads Library com IA generativa (GPT + DALL-E) para produzir variantes de copy e imagens prontas para rodar em campanhas pagas.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e)](https://supabase.com/)

---

## ✨ O que o AdClone entrega

| Recurso | Descrição |
|---------|-----------|
| 🔍 **Spy Engine** | Coleta de anúncios públicos da Meta Ads Library via Apify |
| 🤖 **Clone com IA** | Variantes de copy via OpenAI + imagens via DALL-E |
| 📊 **Dashboard** | KPIs, histórico de clones, análises por nicho |
| 👥 **Admin Panel** | Gestão de usuários, planos, créditos, MRR |
| 💳 **Billing Stripe** | Planos Free / Trial / Pro com webhook integrado |
| 📧 **Relatório Diário** | Email automático de uso via Resend (cron Vercel, 7h BRT) |
| 🔐 **Auth Supabase** | Login, signup, sessões, RLS completo |

---

## 🚀 Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Estilos:** Tailwind CSS v4
- **Backend:** API Routes serverless (Vercel)
- **Banco:** Supabase (Postgres + Auth + Storage)
- **IA:** OpenAI GPT-4o + DALL-E 3
- **Scraping:** Apify (Meta Ads Library actor)
- **Pagamentos:** Stripe
- **Emails:** Resend
- **Testes:** Vitest (unit, 93 testes) + Playwright (E2E)
- **Deploy:** Vercel (produção + preview automático por commit)

---

## 🏃 Rodar localmente

```bash
# 1. Clone e instale
npm install

# 2. Configure variáveis
cp .env.example .env.local
# Edite .env.local com suas chaves (Supabase, OpenAI, Apify, Stripe, Resend)

# 3. Rode
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testes

```bash
npm run lint        # ESLint
npm test            # Vitest (unit, 93 testes)
npm run e2e         # Playwright (E2E)
npx tsc --noEmit    # Typecheck
npm run build       # Build de produção
```

---

## 📁 Estrutura

```
src/
├── app/                    # App Router (páginas + rotas API)
│   ├── api/                # Endpoints serverless
│   │   ├── internal/       # Rotas de cron (protegidas por CRON_SECRET)
│   │   ├── spy-engine/     # Orquestração de análise + clone
│   │   └── webhook/stripe/ # Webhook de pagamentos
│   ├── dashboard/          # Área logada (KPIs, histórico, admin)
│   └── page.tsx            # Landing page
├── components/             # Componentes React reutilizáveis
├── services/               # Integrações externas (OpenAI, Apify, Stripe, Resend)
├── lib/                    # Utilitários (validação, rate limiting, niche detection)
└── utils/supabase/         # Clients Supabase (server/client/middleware)

supabase/migrations/        # 7 migrations SQL (generations, campaigns, RLS, rate limiting)
docs/                       # Arquitetura, deployment, testing
```

---

## 📚 Documentação

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — visão técnica do sistema
- [`docs/deployment/`](./docs/deployment/) — setup de deploy (Vercel, Supabase, Stripe, etc.)
- [`docs/testing/`](./docs/testing/) — guias de teste (unit + E2E)
- [`ACQUISITION.md`](./ACQUISITION.md) — informações para potenciais compradores

---

## 📄 Licença

Projeto proprietário. Todos os direitos reservados.
