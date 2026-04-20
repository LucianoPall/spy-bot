# ⚙️ Stripe Setup para Production

## 1. Pegar Keys Live

1. Acesse https://dashboard.stripe.com/account/apikeys
2. Certifique que está em **Live Mode** (toggle no canto)
3. Copie:
   - **Secret Key**: `sk_live_...` → `STRIPE_SECRET_KEY`
   - **Publishable Key**: `pk_live_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## 2. Configurar Webhook

1. Vá para https://dashboard.stripe.com/webhooks
2. Clique **Add an endpoint**
3. URL: `https://seu-dominio.vercel.app/api/webhook/stripe`
4. Eventos para escutar:
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copie **Signing Secret**: `whsec_...` → `STRIPE_WEBHOOK_SECRET`

## 3. Testar Webhook Localmente

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## 4. Adicionar em Vercel

1. Vá para projeto no Vercel
2. Settings → Environment Variables
3. Adicione as 3 variáveis acima

## 5. Testar em Staging

1. Deploy em staging primeiro
2. Trigger teste: `stripe trigger payment_intent.succeeded`
3. Verificar logs: https://dashboard.stripe.com/logs

✅ Pronto!
