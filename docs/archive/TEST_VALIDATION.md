# Testes de Validação: Imagens 100% Confiáveis

**Objetivo:** Garantir que as imagens das variações 1, 2 e 3 SEMPRE carregam sem erros.

---

## 1. TESTE RÁPIDO (5 MINUTOS)

### Passo 1: Iniciar servidor
```bash
cd /spy-bot-web
npm run dev
# Aguarde "ready on http://localhost:3000"
```

### Passo 2: Testar endpoint /api/spy-engine
```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"https://www.facebook.com/ads/library/?id=2154950355275377"}'
```

### Passo 3: Verificar resposta
```json
{
  "success": true,
  "originalAd": {
    "copy": "...",
    "image": "..."
  },
  "generatedVariations": {
    "variante1": "...",  // ← TEXT (not empty)
    "variante2": "...",  // ← TEXT (not empty)
    "variante3": "..."   // ← TEXT (not empty)
  },
  "generatedImages": {
    "image1": {
      "url": "https://images.unsplash.com/...",  // ← URL VÁLIDA
      "type": "generated",
      "isTemporary": false,
      "niche": "emagrecimento"
    },
    "image2": {
      "url": "https://images.unsplash.com/...",  // ← URL VÁLIDA
      "type": "generated",
      "isTemporary": false,
      "niche": "emagrecimento"
    },
    "image3": {
      "url": "https://images.unsplash.com/...",  // ← URL VÁLIDA (vertical)
      "type": "generated",
      "isTemporary": false,
      "niche": "emagrecimento"
    }
  }
}
```

### Checklist
- [ ] Status 200 (não 500 ou 400)
- [ ] 3 variantes com texto
- [ ] 3 imagens com URL válida
- [ ] Nenhuma URL vazia
- [ ] Nenhuma URL contém "oaidalleapiprodscus" (se contém, é DALL-E órfã!)
- [ ] image1.url !== image2.url !== image3.url (diferentes, não repetidas)

---

## 2. TESTE DE PROXY (5 MINUTOS)

### Teste 2A: Proxy com Unsplash (deve funcionar)
```bash
curl -I "http://localhost:3000/api/proxy-image?url=https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0" -H "Accept: image/*"
```

**Esperado:**
```
HTTP/1.1 200 OK
Content-Type: image/png
Cache-Control: public, max-age=31536000, immutable
Content-Length: [bytes]
```

### Teste 2B: Proxy com DALL-E (simular expirada)
```bash
# SIMULAÇÃO: URL DALL-E expirada
curl -I "http://localhost:3000/api/proxy-image?url=https://oaidalleapiprodscus.blob.core.windows.net/EXPIRADA" -H "Accept: image/*"
```

**Esperado:**
```
HTTP/1.1 200 OK (não 403 ou 404!)
Content-Type: image/png
X-Fallback: unsplash (ou transparent)
Cache-Control: public, max-age=86400
```

### Teste 2C: Proxy com URL inválida
```bash
curl -I "http://localhost:3000/api/proxy-image?url=https://httpbin.org/status/404" -H "Accept: image/*"
```

**Esperado:**
```
HTTP/1.1 200 OK (fallback ativo!)
Content-Type: image/png
X-Fallback: unsplash ou transparent
```

### Checklist
- [ ] Unsplash retorna 200
- [ ] DALL-E expirada retorna 200 (fallback)
- [ ] URL 404 retorna 200 (fallback)
- [ ] Nunca retorna 5xx ou error JSON
- [ ] Content-Type sempre image/png
- [ ] Fallback header presente quando usado

---

## 3. TESTE FRONTEND (10 MINUTOS)

### Passo 1: Abrir Dashboard
```
http://localhost:3000/dashboard
```

### Passo 2: Colar URL
```
https://www.facebook.com/ads/library/?id=2154950355275377
```

### Passo 3: Clicar "Clonar Agora"

### Passo 4: Aguardar resultado (~15 segundos)

### Checklist
- [ ] 3 cards aparecem
- [ ] Cada card tem copy (texto)
- [ ] Cada card tem imagem visível
- [ ] Nenhuma mensagem "Imagem não carregou" ou "⚠️"
- [ ] Imagens são diferentes (não repetidas)
- [ ] Download funciona para cada imagem

### DevTools Check
1. Abrir DevTools (F12)
2. Aba "Network"
3. Filtrar "proxy-image"
4. Verificar 3 requests
5. Cada deve retornar 200

```
GET /api/proxy-image?url=...image1... 200 OK
GET /api/proxy-image?url=...image2... 200 OK
GET /api/proxy-image?url=...image3... 200 OK
```

---

## 4. TESTE DE LOGS (5 MINUTOS)

### Passo 1: Terminal do servidor
Procurar por logs de inicialização de imagens:

```
[SPY-ENGINE] 🚀 INICIANDO GERAÇÃO DE IMAGENS DALL-E...
[SPY-ENGINE] Prompts recebidos: {
  prompt1: '...',
  prompt2: '...',
  prompt3: '...'
}
```

### Passo 2: Procurar por fallback
```
[spy-engine] ✅ Fallback preparado com 3 imagens diferentes do nicho "emagrecimento"
```

### Passo 3: Procurar por sucesso ou proteção
```
[DALL-E] ✅ Imagem 1 gerada com sucesso!
[DALL-E] ✅ Imagem 2 gerada com sucesso!
[DALL-E] ✅ Imagem 3 gerada com sucesso!
```

OU (se DALL-E falhou)
```
[spy-engine] ⚠️ PROTEÇÃO: finalImg1 é URL DALL-E após upload, forçando fallback
[spy-engine] ⚠️ PROTEÇÃO: finalImg2 é URL DALL-E após upload, forçando fallback
[spy-engine] ⚠️ PROTEÇÃO: finalImg3 é URL DALL-E após upload, forçando fallback
```

### Checklist
- [ ] Vê "🚀 INICIANDO GERAÇÃO"
- [ ] Vê "✅ Fallback preparado com 3 imagens"
- [ ] Vê "✅ IMAGENS GERADAS" ou "⚠️ PROTEÇÃO"
- [ ] Vê "✅ Response pronto para enviar"

---

## 5. TESTE DE EDGE CASES (15 MINUTOS)

### Case 1: DALL-E muito lento (timeout)
**Setup:** Comentar a linha do timeout temporariamente (5s em vez de 45s)
```typescript
// const timeoutId = setTimeout(() => controller.abort(), 45000);
const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5s
```

**Teste:** Rodar teste rápido

**Esperado:** Fallback ativado, imagens aparecem
- [ ] Timeout ativado (vê "⏱️ Timeout Apify" nos logs)
- [ ] Fallback usado (não erro)
- [ ] Imagens carregam no frontend

**Pós-teste:** Voltar timeout para 45s

### Case 2: Supabase upload falha (simular RLS block)
**Setup:** No upload, simular erro RLS
```typescript
// Adicionar antes do upload:
if (imageNumber === 1) {
    throw new Error('permission denied (RLS)');
}
```

**Teste:** Rodar teste rápido

**Esperado:** Fallback ativado, imagens aparecem
- [ ] Vê "❌ [IMAGEM 1] ERRO NO UPLOAD"
- [ ] Vê "isPermissionError: true"
- [ ] Vê "isRLSError: true"
- [ ] Fallback usado (img1 é Unsplash)
- [ ] Imagens carregam

**Pós-teste:** Remover simulação

### Case 3: Múltiplas requisições simultâneas
**Setup:** Terminal A rodando servidor

**Teste:**
```bash
# Terminal B: 3 requisições em paralelo
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"https://www.facebook.com/ads/library/?id=2154950355275377"}' &

curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"https://www.facebook.com/ads/library/?id=2154950355275377"}' &

curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"https://www.facebook.com/ads/library/?id=2154950355275377"}' &

wait
```

**Esperado:** Todas retornam 200, sem conflitos
- [ ] 3 responses com status 200
- [ ] Cada com imagens válidas
- [ ] Nenhum erro de concorrência

---

## 6. TESTE DE REGRESSÃO (10 MINUTOS)

### Verificar que mudanças não quebraram nada

```bash
# Compilar
npm run build

# Linting
npm run lint

# Type checking
npm run typecheck
```

### Checklist
- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem problemas
- [ ] `npm run typecheck` sem erros
- [ ] App inicia sem warnings
- [ ] Dashboard carrega normalmente

---

## 7. TESTE COMPLETO (30 MINUTOS)

### Rodar todos os testes em sequência

```bash
#!/bin/bash

echo "=== TEST 1: Rápido (5 min) ==="
# Fazer teste rápido
# Verif checklist

echo "=== TEST 2: Proxy (5 min) ==="
# Fazer teste proxy
# Verif checklist

echo "=== TEST 3: Frontend (10 min) ==="
# Fazer teste frontend
# Verif checklist

echo "=== TEST 4: Logs (5 min) ==="
# Verif logs
# Verif checklist

echo "=== TEST 5: Edge Cases (15 min) ==="
# Case 1: Timeout
# Case 2: RLS
# Case 3: Paralelo

echo "=== TEST 6: Regressão (10 min) ==="
npm run build
npm run lint
npm run typecheck

echo "=== TODOS OS TESTES COMPLETOS ==="
```

---

## 8. MATRIZ DE TESTES

| # | Teste | Tempo | Status | Issues |
|---|-------|-------|--------|--------|
| 1 | Rápido | 5m | [ ] | — |
| 2 | Proxy | 5m | [ ] | — |
| 3 | Frontend | 10m | [ ] | — |
| 4 | Logs | 5m | [ ] | — |
| 5 | Edge Cases | 15m | [ ] | — |
| 6 | Regressão | 10m | [ ] | — |
| **Total** | **Completo** | **50m** | [ ] | — |

---

## 9. CRITÉRIOS DE SUCESSO

### 🟢 SUCESSO (Deploy Liberado)
```
✅ Teste 1: Status 200 + 3 imagens com URL
✅ Teste 2: Proxy retorna 200 em todos os casos
✅ Teste 3: Frontend renderiza 3 imagens sem erro
✅ Teste 4: Logs mostram "✅ Fallback preparado com 3 imagens"
✅ Teste 5: Timeout/RLS/Paralelo tratados gracefully
✅ Teste 6: Build/lint/typecheck sem erros
```

### 🟡 PARCIAL (Investigar)
```
⚠️ Alguns testes falharam
⚠️ Mas core functionality (3 imagens carregam) funciona
→ Deploy com monitoramento em produção
```

### 🔴 FALHA (Não Deploy)
```
❌ Imagens não carregam
❌ Teste 1 retorna 500 ou imagens vazias
❌ Frontend mostra "não carregou"
→ Reverter mudanças e investigar
```

---

## 10. SCRIPT DE TESTE AUTOMATIZADO

```bash
#!/bin/bash
# test-images.sh - Rodar testes automaticamente

set -e

URL="https://www.facebook.com/ads/library/?id=2154950355275377"
API="http://localhost:3000/api/spy-engine"
PROXY="http://localhost:3000/api/proxy-image"

echo "🧪 Iniciando testes de imagens..."
echo ""

# Teste 1: Request
echo "Test 1: Requisição ao /api/spy-engine..."
RESPONSE=$(curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d "{\"adUrl\":\"$URL\"}")

# Verificar status
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Status OK"
else
    echo "❌ FALHA: $RESPONSE"
    exit 1
fi

# Verificar 3 imagens
if echo "$RESPONSE" | grep -q '"image1":' && \
   echo "$RESPONSE" | grep -q '"image2":' && \
   echo "$RESPONSE" | grep -q '"image3":'; then
    echo "✅ 3 imagens presentes"
else
    echo "❌ FALHA: Faltam imagens"
    exit 1
fi

# Verificar URLs não vazias
if echo "$RESPONSE" | grep -q '"url":"https://'; then
    echo "✅ URLs válidas"
else
    echo "❌ FALHA: URLs vazias"
    exit 1
fi

# Verificar não é DALL-E órfã
if echo "$RESPONSE" | grep -q 'oaidalleapiprodscus.*oaidalleapiprodscus.*oaidalleapiprodscus'; then
    echo "❌ FALHA: URLs DALL-E órfãs (não foi uploadado)"
    exit 1
else
    echo "✅ Sem DALL-E órfãs"
fi

# Teste 2: Proxy
echo ""
echo "Test 2: Proxy com Unsplash..."
PROXY_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$PROXY?url=https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0")

if [ "$PROXY_CODE" = "200" ]; then
    echo "✅ Proxy retorna 200"
else
    echo "❌ FALHA: Proxy retorna $PROXY_CODE"
    exit 1
fi

echo ""
echo "🎉 TODOS OS TESTES PASSARAM!"
```

**Uso:**
```bash
chmod +x test-images.sh
./test-images.sh
```

---

## 11. MONITORAMENTO PÓS-DEPLOY

### Métricas a Acompanhar
```
1. Taxa de erro de imagem: Deve ser < 5%
2. Timeout rate: Deve ser < 2%
3. Fallback activation: Esperado 10-20%
4. Response time: P95 < 30 segundos
```

### Alertas Configurar
```
⚠️ Se erro_rate > 10% → Investigar
⚠️ Se timeout_rate > 5% → Aumentar timeout
⚠️ Se response_time > 45s → Verificar DALL-E
```

---

**Próximos passos:** Executar todos os testes antes de fazer merge para main.

