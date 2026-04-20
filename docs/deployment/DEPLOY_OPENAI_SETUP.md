# 🤖 OpenAI Setup para Production

## 1. Criar API Key

1. Vá para https://platform.openai.com/api/keys
2. Clique **Create new secret key**
3. Nome: "spy-bot-web-prod"
4. Copie a chave: `sk-proj-...` → `OPENAI_API_KEY`

## 2. Configurar Billing

1. Vá para https://platform.openai.com/account/billing/overview
2. Adicione **Payment Method**
3. Defina **Usage Limits**:
   - Monthly: $100 (começa pequeno)
   - Hard limit: $50

## 3. Monitorar Custos

**Modelos usados (preços 2026):**
- GPT-4o (input): $0.03/1K tokens
- GPT-4o (output): $0.06/1K tokens
- DALL-E 3 (1024x1024): $0.04/imagem
- DALL-E 3 (1024x1792): $0.08/imagem

**Estimativa por requisição:**
- 2000 tokens input + output = ~$0.03
- 3 imagens DALL-E = ~$0.20
- **Total/requisição ≈ $0.25**

**Fórmula custo mensal:**
- 1000 requisições/mês = $250
- 10000 requisições/mês = $2500

## 4. Testar em Staging

```bash
curl https://seu-staging.vercel.app/api/spy-engine \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"adUrl": "https://facebook.com/ads/library/123456"}'
```

✅ Pronto!
