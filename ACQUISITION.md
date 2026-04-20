# AdClone — Dossiê de Aquisição

> Documento destinado a compradores em potencial via MicroAcquire, Flippa, Acquire.com ou venda direta.

---

## 🎯 Resumo Executivo

**AdClone** é uma plataforma SaaS brasileira de inteligência publicitária que permite a gestores de tráfego, infoprodutores e e-commerces **espionar, analisar e clonar criativos vencedores** de campanhas do Facebook Ads em minutos, utilizando IA generativa.

- **Categoria:** MarTech / AdTech / SaaS B2C-B2B
- **Modelo:** Assinatura recorrente (Stripe) — Free → Trial → Pro
- **Mercado-alvo:** ~300 mil gestores de tráfego no Brasil + mercado LATAM
- **Concorrentes diretos (US):** AdSpy, BigSpy, Minea, PowerAdSpy (faturam US$ 3-10M/ano cada)
- **Diferencial local:** interface 100% em PT-BR, integração nativa com IA generativa para clonagem imediata

---

## 📦 O que está incluído na venda

### Código-fonte completo
- Aplicação Next.js 16 + React 19 + TypeScript 5
- ~30 rotas API serverless
- 15+ componentes React reutilizáveis
- 93 testes unitários (Vitest) + suíte E2E (Playwright)
- 7 migrations SQL Supabase
- CI/CD GitHub Actions configurado

### Infraestrutura em produção
- Projeto Vercel linkado e deployado
- Banco Supabase Postgres em produção
- Cron job diário ativo (relatório de uso por email)
- Webhooks Stripe configurados
- Env vars documentadas em `.env.example`

### Integrações prontas e funcionando
- **OpenAI** (GPT-4o) — geração de copy
- **DALL-E 3** — geração de imagens publicitárias
- **Apify** — scraping Meta Ads Library
- **Stripe** — billing e webhooks
- **Resend** — emails transacionais
- **Supabase** — auth, storage, postgres

### Documentação técnica
- `README.md` — onboarding de dev
- `ARCHITECTURE.md` — arquitetura do sistema
- `docs/deployment/` — guias de deploy por provider
- `docs/testing/` — guias de teste

---

## 💡 Funcionalidades principais

| Área | Funcionalidade |
|------|----------------|
| **Coleta** | Scraping automatizado de anúncios públicos da Meta Ads Library |
| **Análise** | Detecção de nicho, extração de copy, filtros avançados |
| **Geração** | Clone com variações de copy (GPT) e imagens (DALL-E) |
| **Gestão** | Dashboard, histórico, KPIs, admin panel |
| **Billing** | Sistema de créditos + planos assinatura (Stripe) |
| **Automação** | Cron diário de relatório de uso via email |

---

## 🔢 Métricas e estado atual

**⚠️ Pré-revenue.** Venda como asset ou "ready-to-launch" com produto tecnicamente completo e validado em produção.

- Ambiente de produção: **ativo e estável**
- Tests passando: **93/93 unit**
- Build status: **passando**
- Deploy automatizado: **sim** (Vercel)
- Domínio custom: ainda não configurado (`.vercel.app`)
- Base de usuários ativa: inicial (validação do produtor)

---

## 💰 Modelo de receita potencial

| Plano | Preço sugerido/mês | Créditos | Público-alvo |
|-------|--------------------|----------|--------------|
| Free | R$ 0 | 5 clones/mês | Teste |
| Trial | R$ 47 | 50 clones/mês | Início |
| Pro | R$ 197 | 300 clones/mês | Agência/gestor |
| Agency | R$ 497 | 1000+ clones/mês | Time de tráfego |

**Benchmark de mercado:** ferramentas similares (AdSpy, Minea) cobram US$ 79-199/mês — há espaço de arbitragem em PT-BR.

---

## 🧭 Roadmap sugerido (60-90 dias pós-aquisição)

### Quick wins (30 dias)
1. Configurar domínio próprio (`.com.br` ou `.com`)
2. Landing page com depoimentos reais + vídeo demo
3. Lançamento em 3-5 grupos/comunidades de tráfego pago
4. Trial gratuito de 7 dias para primeiros 100 usuários
5. SEO básico (blog posts sobre "como espionar anúncios")

### Consolidação (60 dias)
6. Integração com TikTok Ads Library
7. Analytics avançado (qual criativo converte mais)
8. Integração direta com Meta Marketing API (lançar campanha pelo app)
9. Afiliados/parcerias com infoprodutores grandes

### Escala (90+ dias)
10. Expansão LATAM (espanhol)
11. API pública para agências integrarem no workflow delas
12. White-label para agências revenderem

---

## 🧱 Stack e qualidade técnica

**Stack moderno (2026):**
- Next.js 16 (App Router) — framework líder de mercado
- React 19 — última versão estável
- TypeScript 5 — type safety completa
- Tailwind CSS v4 — design system moderno
- Supabase — backend-as-a-service escalável

**Qualidade do código:**
- Lint + typecheck + tests no CI
- Separação clara de responsabilidades (services, lib, components)
- Rate limiting próprio implementado
- RLS no Supabase para isolamento de dados entre clientes
- Validação de refund/créditos no backend (anti-fraude)

**Pronto para escalar:**
- Arquitetura serverless (escala horizontal automática na Vercel)
- Regiões configuráveis (atualmente `sfo1`)
- Função de batch scraping com 300s de timeout

---

## 💵 Custos operacionais estimados

| Serviço | Custo mensal (~100 usuários ativos) |
|---------|------------------------------------|
| Vercel Pro | US$ 20 |
| Supabase Pro | US$ 25 |
| OpenAI API | US$ 50-200 (variável por uso) |
| DALL-E 3 | US$ 50-150 (US$ 0.04/imagem) |
| Apify | US$ 49 (plano starter) |
| Stripe | 2.9% + R$ 0.30/transação |
| Resend | US$ 0 (até 3k/mês grátis) |
| **Total fixo estimado** | **US$ 194 + variável por uso** |

Margem esperada: **~70% a partir de ~50 assinantes Pro (R$ 10k MRR).**

---

## 🛒 Modalidades de aquisição sugeridas

1. **Asset sale** — transferência de código + contas + domínio
2. **Equity partnership** — comprador assume operação + vendedor mantém % pela construção
3. **Joint venture** — split de receita por período definido

---

## 📬 Contato

Interessados em adquirir ou discutir parceria: entre em contato via email do proprietário listado no perfil do GitHub.

---

*Documento preparado em abril de 2026. Informações sujeitas a atualização.*
