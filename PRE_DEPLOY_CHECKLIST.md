# ✅ PRE-DEPLOY CHECKLIST - SPY-BOT-WEB

## 📋 Antes de Fazer Deploy

### Código
- [ ] npm run build passou (zero erros)
- [ ] npm test passou (89+ de 96)
- [ ] git push feito
- [ ] Sem console.log de debug no código
- [ ] Sem TODO/FIXME comments críticos
- [ ] TypeScript strict mode ativo

### Variáveis de Ambiente
- [ ] NEXT_PUBLIC_SUPABASE_URL configurada
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configurada
- [ ] SUPABASE_SERVICE_KEY configurada
- [ ] OPENAI_API_KEY configurada
- [ ] APIFY_API_TOKEN configurada
- [ ] STRIPE_SECRET_KEY configurada (live, não test!)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configurada
- [ ] STRIPE_WEBHOOK_SECRET configurada
- [ ] NEXT_PUBLIC_APP_URL apontando para domínio correto

### Supabase
- [ ] Projeto criado
- [ ] Tabela user_credits criada
- [ ] Tabela supabase_logs criada
- [ ] Storage bucket "generated-images" criado
- [ ] Policies configuradas (public SELECT)
- [ ] Indexes criados para performance

### Stripe
- [ ] Em Live Mode (não test!)
- [ ] Secret Key é sk_live_*
- [ ] Publishable Key é pk_live_*
- [ ] Webhook endpoint configurado
- [ ] Webhook signing secret gerado

### OpenAI
- [ ] API Key configurada
- [ ] Billing setup (payment method added)
- [ ] Usage limits configurados ($50-100/mês)
- [ ] Modelos disponíveis: gpt-4o, dalle-3

### Apify
- [ ] Conta criada
- [ ] API Token gerado
- [ ] Facebook Ads Scraper disponível
- [ ] Mínimo $50 de créditos

### Vercel
- [ ] Projeto criado em https://vercel.com
- [ ] Conectado ao GitHub
- [ ] Environment variables configuradas
- [ ] vercel.json adicionado ao git
- [ ] .vercelignore adicionado ao git
- [ ] Framework auto-detectado como Next.js

## 🚀 Deploy Steps

1. Abrir https://vercel.com/new
2. Selecionar repositório GitHub
3. Clicar "Import"
4. Configurar environment variables (todas as 9 acima)
5. Clicar "Deploy"
6. Aguardar ~3-5 min

## ✅ Pós-Deploy

- [ ] Health check: GET https://seu-site.vercel.app → 200
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Stripe webhook respondendo (https://api.stripe.com/logs)
- [ ] Sentry recebendo eventos (se integrado)

## 🔥 Teste Full Flow

1. Criar conta em seu site
2. Fazer login
3. Chamar /api/spy-engine com URL válida
4. Verificar resposta (3 copywritings + 3 imagens)
5. Verificar créditos debitados no Supabase
6. Verificar logs em supabase_logs

## 🆘 Se der erro

- Verificar Vercel logs: https://vercel.com/projects
- Verificar Supabase logs: https://app.supabase.com
- Verificar OpenAI logs: https://platform.openai.com/account/usage/overview
- Verificar Stripe logs: https://dashboard.stripe.com/logs

---

**Status:** Pronto para deploy!
