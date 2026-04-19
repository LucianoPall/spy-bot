# 🧪 Guia de Testes — Fase 1 Completa

Data: 23/03/2026
Status: Pronto para testes locais

---

## 📋 Checklist de Implementação

### ✅ Concluído (Sem ação necessária)

- [x] **1.1** — Auth em `/api/test-apis`, `/api/debug-image`, `/api/supabase-health`, `/api/image-health`
- [x] **1.2** — `NEXT_PUBLIC_ADMIN_EMAIL` → `ADMIN_EMAIL` (server-only)
- [x] **1.4** — Refund helpers conectados ao Apify/OpenAI catch blocks
- [x] **2.1** — `fetchWithRetry` movido para `@/lib/http-client.ts`

### ⏳ Requer Setup Manual

- [ ] **1.3** — Criar tabela `rate_limits` no Supabase

---

## 🚀 PASSO 1: Setup no Supabase (5 min)

### 1.1 Abrir Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto (aquele com URL `rrtsfhhutbneaxpuubra.supabase.co`)
3. No menu esquerdo, clique em **SQL Editor**

### 1.2 Executar Script de Rate Limiting

1. Clique em **New Query** (ou + icon)
2. Copie TODO o conteúdo de `RATE_LIMITING_SETUP.sql` (arquivo na raiz do projeto)
3. Cole na área de SQL
4. Clique em **Run** (ou Ctrl+Enter)

**Resultado esperado:**
```
✅ SUCCESS
```

Se houver erro do tipo `already exists`, é normal — significa a tabela já foi criada anteriormente.

### 1.3 Verificar Tabela Criada

No menu esquerdo > **Database** > **Tables**, você deve ver:
- `rate_limits` ← Nova tabela
- Com colunas: `id`, `user_id`, `route`, `window_start`, `count`, `created_at`

---

## 🔧 PASSO 2: Testar Localmente (10 min)

### 2.1 Rodar Testes Unitários

```bash
cd spy-bot-web
npm test -- --run
```

**Resultado esperado:**
```
PASS  src/app/api/spy-engine/route.test.ts
✓ 96 tests passed
```

Se falhar, verifique se há imports faltando ou mudanças na assinatura de funções.

### 2.2 Iniciar Server

```bash
npm run dev
```

Você deve ver:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
```

---

## 🧪 PASSO 3: Testar Proteção de Rotas (5 min)

### 3.1 Testar `/api/test-apis` — SEM Auth (deve falhar com 401)

Abra terminal/PowerShell e execute:

```bash
curl -X GET http://localhost:3000/api/test-apis
```

**Resultado esperado:**
```json
{
  "error": "Unauthorized - Authentication required"
}
```

HTTP Status: **401**

---

### 3.2 Testar `/api/debug-image` — SEM Auth (deve falhar com 401)

```bash
curl -X GET "http://localhost:3000/api/debug-image?url=https://example.com/image.jpg"
```

**Resultado esperado:**
```json
{
  "error": "Unauthorized - Authentication required"
}
```

HTTP Status: **401**

---

### 3.3 Testar `/api/supabase-health` — Admin Only (deve falhar com 401)

```bash
curl -X GET http://localhost:3000/api/supabase-health
```

**Resultado esperado:**
```json
{
  "error": "Unauthorized - Authentication required"
}
```

HTTP Status: **401**

---

### 3.4 Testar `/api/spy-engine` — Rate Limiting (novo!)

Você vai fazer 15 requisições rápido. As primeiras 10 devem passar, a 11ª deve retornar 429.

**Script bash:**

```bash
for i in {1..15}; do
  echo "Requisição $i:"
  curl -X POST http://localhost:3000/api/spy-engine \
    -H "Content-Type: application/json" \
    -d '{"adUrl":"https://facebook.com/ads/test"}' \
    -s | jq '.error // .success'
  sleep 0.1
done
```

**Resultado esperado:**
```
Requisição 1:
true
Requisição 2:
true
...
Requisição 10:
true
Requisição 11:
"Too Many Requests"  ← 429!
Requisição 12:
"Too Many Requests"
...
```

---

## ✅ PASSO 4: Teste de Refund Automático (Opcional)

Este teste requer forçar uma falha do Apify. Se quiser validar:

1. No arquivo `.env.local`, temporariamente mude:
   ```
   APIFY_API_TOKEN="invalid_token_for_testing"
   ```

2. Reinicie o dev server: `npm run dev`

3. Teste no localhost:3000:
   - Cole uma URL do Facebook
   - Apify vai falhar
   - Verifique no Supabase em `supabase_logs` → deve ter um entry com `reason: 'APIFY_FAILURE'`
   - Créditos do usuário devem ter sido reembolsados em `spybot_subscriptions`

4. Restaure o token real depois!

---

## 📊 Troubleshooting

### Erro: "Tabela rate_limits não existe"

**Solução:** Você pulou o Passo 1 (Supabase setup). Execute `RATE_LIMITING_SETUP.sql` no SQL Editor.

### Erro: "RLS policy not defined"

**Solução:** As políticas de RLS foram incluídas no script SQL. Re-execute o script completo.

### Testes falhando: "Cannot find module '@/lib/http-client'"

**Solução:** Rode `npm install` novamente. Limpe `.next/`:
```bash
rm -rf .next
npm run dev
```

### Rate limit retorna 200 mesmo após 10 requisições

**Solução:** Você precisa estar **autenticado** (logado). O DEV_MODE pode estar ativo. Verifique `.env.local`:
```
NEXT_PUBLIC_DEV_MODE="false"  ← Deve ser false para testar auth
```

---

## 🎯 Checklist Final

- [ ] Tabela `rate_limits` criada no Supabase
- [ ] `npm test -- --run` passa (96 tests)
- [ ] `/api/test-apis` retorna 401 sem auth
- [ ] `/api/debug-image` retorna 401 sem auth
- [ ] `/api/spy-engine` retorna 429 na 11ª requisição
- [ ] Dev server rodando sem erros

---

## 📞 Se Algo Quebrar

1. Verifique os logs do dev server (terminal)
2. Limpe cache: `rm -rf .next node_modules && npm install`
3. Reinicie: `npm run dev`
4. Se persistir, posso debugar no próximo round

---

**Próximo passo:** Após testes OK, vamos para **Fase 2.2 — Extrair 5 Services** ✨
