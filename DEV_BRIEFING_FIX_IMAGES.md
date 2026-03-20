# 🚨 DEV BRIEFING: Fix Critical Issues - Clone Ad System

**Priority:** CRITICAL
**Deadline:** ASAP (2 hours)
**Status:** Ready for @dev (Dex)

---

## 📋 SUMMARY

Usuário clonando anúncio do Facebook Ads Library:
- URL: `https://www.facebook.com/ads/library/?id=1169317215276860`
- **Copy não carrega** ❌
- **Imagens originais não aparecem** ❌
- **Imagens geradas (DALL-E) não aparecem** ❌
- Muitos problemas reportados = Sistema não pronto para venda

**Root Cause Analysis Completo:**
Sistema tem fallbacks, mas está em modo "Safe Fallback" (usando imagens genéricas Unsplash).

---

## 🔍 RAÍZ DOS PROBLEMAS

### Problem 1: RLS Permission Denied (CRÍTICO - 90% probabilidade)

**Location:** Supabase Storage `spybot_images` bucket

**What's happening:**
- Linha 505-619 em `/src/app/api/spy-engine/route.ts`
- Tenta fazer upload de imagens para `spybot_images/` bucket
- RLS policy bloqueia (returns 403 Permission Denied)
- Fallback silencioso para imagem Unsplash genérica
- Usuário não vê imagem gerada, pensa que quebrou

**Evidence:**
- Status API: `cdn.supabase: "degraded"`
- No logs: `[STORAGE_FAIL] permission denied`

**Fix Required:**
1. ✅ Verificar bucket `spybot_images` está PUBLIC
2. ✅ Verificar RLS policies permitem authenticated users INSERT
3. ✅ Validar user_id está sendo passado corretamente
4. ✅ Testar upload com user autenticado

---

### Problem 2: Image Cache Issues

**Location:** `/src/components/HistoryCard.tsx` (linhas 96-221)

**What's happening:**
- 4-step image loading cascade (localStorage → api/get-image → api/proxy-image → direct)
- Fallback final: SVG placeholder cinza
- Se qualquer step falha, pula para próximo
- Se todos falham, usuário vê placeholder

**Needs:**
- ✅ Validar retry logic (timeout 15s)
- ✅ Verificar CORS headers em `/api/proxy-image`
- ✅ Validar cache headers (Cache-Control)
- ✅ Testar com URLs reais (DALL-E, Unsplash, Supabase)

---

### Problem 3: Apify Extraction Fallback

**Location:** `/src/app/api/spy-engine/route.ts` (linhas 193-287)

**What's happening:**
- Timeout curto 15 segundos
- Se Apify demora, ativa fallback automático
- Mock data é carregado mas é GENÉRICA, não específica do anúncio
- Usuário clona anúncio, vê copy genérica = parece quebrado

**Needs:**
- ✅ Validar detecção de nicho funciona
- ✅ Validar mock data está sendo retornado corretamente
- ✅ Testar Apify token é válido
- ✅ Testar URL do anúncio é acessível

---

### Problem 4: OpenAI Rate Limit / Invalid Key

**Location:** `/src/app/api/spy-engine/route.ts` (linhas 359-437)

**What's happening:**
- Se chave OpenAI expirada/sem créditos
- Sistema retorna erro mas UI não mostra bem
- Usuário não entende por que copy não gerou

**Needs:**
- ✅ Validar chave OpenAI em `.env.local` é válida
- ✅ Validar conta tem créditos ($5+)
- ✅ Testar chamada GPT-4o funciona
- ✅ Validar resposta JSON é parseável

---

## 🛠️ TASKS ESPECÍFICAS

### Task 1: Validar Supabase RLS (15 min)

**SQL a executar:**

```sql
-- 1. Verificar bucket está public
SELECT id, name, public FROM storage.buckets
WHERE name = 'spybot_images';
-- Esperado: public = true

-- 2. Listar policies
SELECT * FROM storage.policies
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'spybot_images');
-- Esperado: INSERT, SELECT, UPDATE, DELETE policies

-- 3. Testar INSERT direto (como usuário autenticado)
-- Usar Supabase dashboard → SQL Editor
```

**Ações:**
- [ ] Se `public = false` → UPDATE para `true`
- [ ] Se falta policies → Criar via Supabase UI
- [ ] Se policies estão restritivas → Expandir para authenticated users
- [ ] Validar `auth.uid()` está correto em WHERE clauses

---

### Task 2: Testar Chamadas Externas (20 min)

**Endpoint:** `http://localhost:3000/api/test-apis`

Se não existir, criar arquivo:

**File:** `/src/app/api/test-apis/route.ts`

```typescript
export async function GET(req: Request) {
  const results = {
    openai: { status: "testing...", error: null },
    apify: { status: "testing...", error: null },
    supabase: { status: "testing...", error: null }
  };

  // Test OpenAI
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.models.list();
    results.openai = { status: "ok", models: response.data.length };
  } catch (e: any) {
    results.openai = { status: "error", error: e.message };
  }

  // Test Apify
  try {
    const apifyToken = process.env.APIFY_API_TOKEN;
    const response = await fetch(
      `https://api.apify.com/v2/acts?token=${apifyToken}`
    );
    results.apify = { status: response.ok ? "ok" : `http_${response.status}`, error: null };
  } catch (e: any) {
    results.apify = { status: "error", error: e.message };
  }

  // Test Supabase
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('spybot_generations').select('count');
    results.supabase = { status: error ? "error" : "ok", error: error?.message };
  } catch (e: any) {
    results.supabase = { status: "error", error: e.message };
  }

  return NextResponse.json(results);
}
```

**Validate:**
- [ ] Teste: `curl http://localhost:3000/api/test-apis`
- [ ] Todos os serviços retornam "ok"
- [ ] Se algum falha, report no briefing

---

### Task 3: Testes de Ponta-a-Ponta (25 min)

**Executar manualmente:**

1. **Abra DevTools** (F12)
2. **Console tab:**

```javascript
// Test 1: Fazer chamada completa ao spy-engine
const response = await fetch('http://localhost:3000/api/spy-engine', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adUrl: 'https://www.facebook.com/ads/library/?id=1169317215276860',
    brandProfile: null
  })
});

const data = await response.json();
console.log('=== LOGS ===');
console.log(JSON.stringify(data.logs, null, 2));
console.log('=== RESULTADO ===');
console.log(data);

// Procurar por:
// - "APIFY_SUCCESS" ou "APIFY_FAIL"
// - "OPENAI_SUCCESS" ou "OPENAI_FAIL"
// - "DALLE_SUCCESS" ou "DALLE_FAIL"
// - "STORAGE_SUCCESS" ou "STORAGE_FAIL"
// - Erros de permission denied
```

3. **Validar resultado:**
   - [ ] `originalAd.copy` tem texto?
   - [ ] `originalAd.image` tem URL?
   - [ ] `generatedVariations.variante1/2/3` tem texto?
   - [ ] `generatedImages.image1/2/3` tem URLs?
   - [ ] Nenhum log mostra "permission denied"?

---

### Task 4: Corrigir Code Issues Encontrados (30 min)

**Baseado no resultado dos testes acima:**

- [ ] **Se RLS error:** Adicionar melhor logging + instruções de fix no README
- [ ] **Se Apify timeout:** Aumentar timeout de 15s para 20s, adicionar retry
- [ ] **Se OpenAI fail:** Adicionar check de quota antes, msg melhor para usuário
- [ ] **Se CORS blocked:** Verificar headers em proxy-image
- [ ] **Se DB insert fail:** Adicionar rollback graceful, não deixar dados órfãos

---

### Task 5: Documentação (10 min)

**Criar arquivo:** `/TROUBLESHOOTING_IMAGES.md`

Com:
- [ ] Como debugar problemas de imagem
- [ ] Checklist de verificação RLS
- [ ] Como testar Apify/OpenAI/Supabase
- [ ] Erros comuns e soluções
- [ ] Links para documentação oficial

---

## ✅ ACCEPTANCE CRITERIA

Sistema é considerado **PRONTO PARA VENDA** quando:

1. ✅ RLS Supabase validado e funcionando
2. ✅ Apify consegue extrair copy/imagem (ou mock data é usado)
3. ✅ OpenAI gera 3 variações corretamente
4. ✅ DALL-E gera 3 imagens (ou fallback Unsplash é usado)
5. ✅ Imagens são salvadas no Supabase Storage
6. ✅ Histórico carrega imagens sem placeholder cinza
7. ✅ E2E test completo executado com sucesso
8. ✅ Logs detalhados documentados
9. ✅ Troubleshooting guide criado
10. ✅ Zero console errors em produção (dev mode)

---

## 📦 ENTREGÁVEIS

- [ ] Arquivo: `/TROUBLESHOOTING_IMAGES.md` (guia completo)
- [ ] Arquivo: `/src/app/api/test-apis/route.ts` (endpoint de teste)
- [ ] Logs de teste completo (screenshot ou output)
- [ ] Confirmação: "Sistema pronto para venda"

---

## 🔗 REFERÊNCIAS

**Arquivos principais:**
- `/src/app/api/spy-engine/route.ts` - API principal
- `/src/components/HistoryCard.tsx` - Renderização
- `/src/lib/mockAdData.ts` - Dados mock
- `/src/lib/supabase.ts` - Cliente Supabase

**Docs:**
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Apify: https://apify.com/docs
- OpenAI: https://platform.openai.com/docs

---

## 👥 CONTEXTO PARA @DEV

- Projeto: `spy-bot-web` (Next.js 16)
- Servidor local: `http://localhost:3000` (rodando)
- Dev Mode: Ativado
- Admin: `lucianopelegrini27@gmail.com`
- Problema: Múltiplas falhas que parecem uma, mas é tudo relacionado a RLS/fallback

**@dev, você está autorizado a:**
- Modificar configurações no Supabase (RLS, policies)
- Criar novos endpoints de teste
- Melhorar logging
- Adicionar validações
- Criar documentação

**Não faça:**
- Deploy para produção (só testes locais)
- Modificar estrutura de tabelas (apenas dados mock)
- Alterações quebradoras na API (manter compatibilidade)

---

**Status:** Aguardando @dev para começar
**Prioridade:** CRÍTICA
**Estimativa:** 2 horas
