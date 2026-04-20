# 🕷️ Apify Setup para Production

## 1. Criar Conta Apify

1. Vá para https://apify.com/
2. Sign up (free trial com 6000 credits)
3. Ir para Account → Integrations
4. Copie **API Token**: `apk_...` → `APIFY_API_TOKEN`

## 2. Usar Facebook Ads Scraper

Vamos usar o ator: **apify/facebook-ads-scraper**

### Parâmetros da chamada:

```javascript
{
  "url": "https://www.facebook.com/ads/library/?ad_type=all&country=BR",
  "countLimit": 10,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["FACEBOOK"]
  }
}
```

## 3. Custos

- 1 run = ~200 credits
- Trial: 6000 credits = 30 runs grátis
- Paid: $50/mês = ~1500 credits

**Plano recomendado:**
- $50/mês inicial
- Escalar se >1000 requisições/mês

## 4. Teste Rápido

```bash
curl https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run \
  -H "Authorization: Bearer apk_YOUR_TOKEN" \
  -d @- << 'JSON'
{
  "url": "https://www.facebook.com/ads/library/?ad_type=all&country=BR",
  "countLimit": 1
}
JSON
```

## 5. Monitoring

Dashboard: https://console.apify.com/

Métricas importantes:
- Success rate (deve ser >95%)
- Avg. runtime (deve ser <30s)
- Credits gastos

✅ Pronto!
