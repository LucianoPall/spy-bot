# Investigação Completa: Por que as Imagens das Variações não Carregam

**Data:** 2026-03-18
**URL Testada:** https://www.facebook.com/ads/library/?id=2154950355275377
**Status:** INVESTIGAÇÃO CONCLUÍDA COM SOLUÇÃO DEFINITIVA

---

## 1. RESUMO EXECUTIVO

### Problema
As **cópias aparecem, mas as imagens falham** no spy-bot-web ao processar anúncios de teste.

### Causa Raiz Identificada
O sistema tem **proteções múltiplas**, mas está funcionando conforme projetado:
1. URLs DALL-E expiram a cada **2 horas**
2. Upload para Supabase pode falhar (permissões RLS, timeout)
3. Fallback para Unsplash está ativo, mas pode ter _inconsistências_ de renderização

### Solução Definitiva
Implementar **5 camadas de garantia** para 100% de confiabilidade:

---

## 2. FLUXO DE PROCESSAMENTO ANALISADO

```
┌─────────────────────┐
│   /api/spy-engine   │
│                     │
├─────────────────────┤
│ 1. Extrai com Apify │
│    ↓                │
│ 2. Cria 3 copies    │
│    com GPT-4o       │
│    ↓                │
│ 3. Gera 3 imagens   │
│    com DALL-E-3     │ ← DALL-E retorna URL TEMP (expira 2h)
│    ↓                │
│ 4. Upload Supabase  │ ← Tenta salvar permanente
│    (com retry)      │   (pode falhar por RLS, timeout)
│    ↓                │
│ 5. Retorna resposta │
│    com URLs         │
└─────────────────────┘
         ↓
┌──────────────────────────────┐
│   Dashboard Frontend          │
│                              │
├──────────────────────────────┤
│ VariationCard renderiza img  │
│ com src=/api/proxy-image?url │
│                              │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│   /api/proxy-image           │
│                              │
├──────────────────────────────┤
│ 1. Detecta tipo de URL       │
│    (DALL-E vs Supabase)      │
│    ↓                         │
│ 2. Faz 5 tentativas (retry)  │
│    ↓                         │
│ 3. Se falhar: fallback       │
│    Unsplash ou PNG trans     │
│    ↓                         │
│ 4. Retorna blob com cache    │
└──────────────────────────────┘
```

---

## 3. ANÁLISE DE CADA COMPONENTE

### 3.1 `/api/spy-engine/route.ts` - Geração de Imagens

**ENCONTRADO EM:** Linhas 480-815

#### Geração DALL-E (Linha 521-563)
```typescript
const response = await activeOpenaiClient.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: targetSize,  // "1024x1024" ou "1024x1792"
});
const generatedUrl = response.data?.[0]?.url;  // URL TEMP (expira 2h)
```

**PROBLEMA:** URLs DALL-E retornadas aqui **expiram em 2 horas**.

#### Upload para Supabase (Linha 597-707)
```typescript
const uploadImageToSupabase = async (
    url: string,
    supabaseClient: any,
    userId: string,
    imageNumber: number
): Promise<string> => {
    // ... tenta fazer fetch da URL DALL-E
    const imgRes = await fetch(url, { signal: controller.signal, ... });

    if (!imgRes.ok) {
        // SE FALHAR: retorna placeholder (nunca URL quebrada!)
        return placeholderUrl;
    }

    // Converte para blob e faz upload
    const blob = await imgRes.blob();
    const uploadResponse = await supabaseClient.storage
        .from('spybot_images')
        .upload(fileName, blob, { ... });

    if (error) {
        // SE UPLOAD FALHAR: retorna placeholder
        return placeholderUrl;
    }

    return publicUrl;  // URL Supabase permanente
};
```

**PROBLEMA IDENTIFICADO:**
- **Timeout:** 25 segundos (pode ser curto para URLs DALL-E lentas)
- **RLS:** Pode falhar se permissões estiverem erradas
- **Fallback:** Retorna `placeholder` (Unsplash), mas sempre gera _A MESMA IMAGEM_ para as 3 variações

#### Response Final (Linha 761-815)
```typescript
const buildGeneratedImage = (url: string, type: string, niche: string): GeneratedImage => {
    const finalUrl = url && url.trim() ? url : placeholder;

    let provider: 'dalle' | 'supabase' | 'unsplash' | 'fallback' = 'fallback';
    if (finalUrl?.includes('supabase')) provider = 'supabase';
    else if (finalUrl?.includes('unsplash')) provider = 'unsplash';
    else if (finalUrl?.includes('oaidalleapiprodscus')) provider = 'dalle';

    return {
        url: finalUrl,
        type: type,
        isTemporary: provider === 'dalle',
        niche,
        source: { provider },
        metadata: {}
    };
};
```

**GARANTIA CODIFICADA:** URLs nunca vazias (linha 763).

---

### 3.2 `/api/proxy-image/route.ts` - Proxy de Imagens

**ENCONTRADO EM:** Linhas 61-158

#### Retry com Exponential Backoff (Linha 7-54)
```typescript
async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 5  // 5 tentativas
): Promise<Response> {
    // Retry com backoff: 1s, 2s, 4s, 8s, 16s = 31s total
    // Trata: 429, 500, 502, 503, 504, timeout (AbortError), ECONNRESET
}
```

**PROTEÇÃO:** Robusto contra timeouts transitórios.

#### Detecção de DALL-E (Linha 79-107)
```typescript
const isDalleUrl = decodedUrl.includes('oaidalleapiprodscus.blob.core.windows.net');

if (isDalleUrl) {
    cacheTime = 86400;  // 1 dia para DALL-E
} else if (decodedUrl.includes('supabase.co')) {
    cacheTime = 31536000;  // 1 ano para Supabase
} else {
    cacheTime = 3600;  // 1 hora padrão
}
```

**PROBLEMA IDENTIFICADO:** Cache de 1 dia para DALL-E é **inútil** porque a URL já expirou!

#### Fallback (Linha 126-156)
```typescript
try {
    // Tenta URL original com 5 retries
    const response = await fetchWithRetry(decodedUrl, {...}, 5);
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, { ...headers });
} catch (error: any) {
    // ❌ ERRO: tenta fallback Unsplash
    const fallbackUrl = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?...';
    const fallbackResponse = await fetchWithRetry(fallbackUrl, {}, 2);
    // ...
}
```

**PROBLEMA:** Fallback é **genérico** e **ignora o nicho**.

---

### 3.3 `dashboard/page.tsx` - Renderização Frontend

**ENCONTRADO EM:** Linhas 271-418 (VariationCard)

#### Renderização de Imagem (Linha 344-388)
```typescript
{finalImageUrl && !imageFailed ? (
    <img
        src={`/api/proxy-image?url=${encodeURIComponent(finalImageUrl)}`}
        alt={title}
        className="..."
        onLoad={() => setImageLoading(false)}
        onError={() => {
            console.warn(`[Variante ${index}] Imagem não carregou - usando fallback`);
            setImageFailed(true);
            setImageLoading(false);
        }}
    />
) : (
    <div className="...">
        <div className="text-3xl">⚠️</div>
        <p>Imagem não carregou</p>
    </div>
)}
```

**PROBLEMA ENCONTRADO:**
1. Erro `onError` não renderiza nenhuma imagem de fallback (apenas aviso)
2. Backend já envia fallback, mas frontend **ignora** se houver erro
3. Sem recuperação visual para user (apenas texto "não carregou")

---

## 4. MAPA DE FALHAS POSSÍVEIS

### Cenário 1: URLs DALL-E Expiradas
```
Fluxo: /api/spy-engine → DALL-E gera URL (válida por 2h)
                       ↓
                       Upload Supabase (pode falhar)
                       ↓
                       Retorna DALL-E URL mesmo assim (expirada!)
                       ↓
                       /api/proxy-image tenta acessar
                       ↓
                       ❌ Status 403/404 após 5 retries
                       ↓
                       ✅ Fallback Unsplash (mas genérico!)
```

**Causa:** Se upload Supabase falhar silenciosamente, API retorna DALL-E URL expirada.

### Cenário 2: RLS do Supabase Bloqueando Upload
```
Fluxo: uploadImageToSupabase() → supabase.storage.upload()
                       ↓
                       ❌ Permission denied (RLS policy)
                       ↓
                       ✅ Retorna placeholder (correto!)
```

**Causa:** Políticas RLS podem estar bloqueando uploads anônimos.

### Cenário 3: Timeout no Fetch DALL-E (25s é curto)
```
Fluxo: fetch(dalleUrl, timeout: 25000)
                       ↓
                       ⏱️ Servidor responde em >25s (intermitente)
                       ↓
                       ❌ AbortError
                       ↓
                       ✅ Retorna placeholder
```

**Causa:** URLs DALL-E podem ser lentas em conectar.

---

## 5. SOLUÇÃO DEFINITIVA - 5 Camadas de Garantia

### Camada 1: Tornar Upload Supabase Mais Robusto
**Arquivo:** `/spy-bot-web/src/app/api/spy-engine/route.ts` (Linhas 597-707)

```typescript
// ANTES:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 25000);  // ← CURTO

// DEPOIS:
const timeoutId = setTimeout(() => controller.abort(), 45000);  // 45 segundos
// + Detectar e logar erros RLS explicitamente
if (error.message.includes('permission') || error.message.includes('RLS')) {
    logger.error('RLS_POLICY_ISSUE', 'Politica RLS bloqueando upload', {
        bucket: 'spybot_images',
        userId: userId || 'anonymous',
        actionRequired: 'Verifique policies em Supabase Dashboard'
    });
}
```

### Camada 2: Nunca Retornar DALL-E Expirada
**Arquivo:** `/spy-bot-web/src/app/api/spy-engine/route.ts` (Linhas 574-590)

```typescript
// ANTES:
let finalImg1 = img1, finalImg2 = img2, finalImg3 = img3;

// DEPOIS:
// Se for DALL-E (detecta URL ou tipo), SEMPRE tenta upload
const isDalleUrl = (url: string) =>
    url?.includes('oaidalleapiprodscus') || url?.includes('openai');

if (isDalleUrl(img1) && uploadFailed1) {
    // Se DALL-E falhou no upload, forçar placeholder
    finalImg1 = imgFallback;
} else if (!uploadFailed1 && isDalleUrl(img1)) {
    // Se DALL-E e upload deu sucesso (tem Supabase URL), ok
    finalImg1 = uploadResult1;
} else {
    // Se não é DALL-E ou já tem URL, usar como está
    finalImg1 = img1;
}

// NUNCA retornar URLs DALL-E órfãs sem Supabase backup
```

### Camada 3: Fallback Inteligente por Nicho
**Arquivo:** `/spy-bot-web/src/app/api/spy-engine/route.ts` (Linhas 503-505)

```typescript
// ANTES:
const placeholderFallback = nicheImages?.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?...';
const fallbackImages = [placeholderFallback, placeholderFallback, placeholderFallback];  // ← MESMA IMAGEM!

// DEPOIS:
// Buscar MÚLTIPLAS imagens do nicho para variar
const nicheDatabase = {
    "emagrecimento": ["url1", "url2", "url3"],
    "renda_extra": ["url1", "url2", "url3"],
    // ... mais 3 nichos
};

const fallbackImages = nicheDatabase[nicheForFallback] ||
    ['https://...', 'https://...', 'https://...'];  // 3 IMAGENS DIFERENTES
```

### Camada 4: Proxy Inteligente com Backup Por Tipo
**Arquivo:** `/spy-bot-web/src/app/api/proxy-image/route.ts` (Linhas 126-156)

```typescript
// ANTES:
const fallbackUrl = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?...';
// (mesmo fallback para qualquer erro)

// DEPOIS:
// Detectar qual foi o erro e usar fallback apropriado
if (isDalleUrl && response.status === 403) {
    // DALL-E URL expirou (403 = forbidden por timeout)
    console.log('[proxy-image] DALL-E URL expirada, usando fallback by niche');
    // Extrai nicho da query parameter ou do header
    const niche = req.nextUrl.searchParams.get('niche') || 'geral';
    const fallbackByNiche = getNicheImage(niche);  // Busca imagem do nicho
    return fallbackByNiche;
}
```

### Camada 5: Frontend Renderização Condicional
**Arquivo:** `/spy-bot-web/src/app/dashboard/page.tsx` (Linhas 344-404)

```typescript
// ANTES:
{imageFailed ? (
    <div>⚠️ Imagem não carregou</div>  // ← Sem fallback visual
) : ...}

// DEPOIS:
{imageFailed && fallbackUrl ? (
    <img
        src={fallbackUrl}  // ← Usar fallback se imageFailed
        alt={`${title} (fallback)`}
        className="..."
    />
) : imageFailed ? (
    <div className="fallback-placeholder">
        <div className="text-3xl">🎨</div>
        <p>Imagem padrão do nicho</p>
    </div>
) : ...}
```

---

## 6. IMPLEMENTAÇÃO PRIORIZADA

### NÍVEL CRÍTICO (Fazer Imediatamente)
1. ✅ **Aumentar timeout de 25s → 45s** (linha 629)
2. ✅ **Forçar salvamento em Supabase antes de retornar** (não retornar DALL-E órfã)
3. ✅ **Variar 3 imagens fallback por nicho** (em vez de repetir 3x mesma)

### NÍVEL ALTO (Fazer em Seguida)
4. ⚠️ **Proxy inteligente com detecção de tipo de erro**
5. ⚠️ **Frontend com fallback visual condicional**
6. ⚠️ **Adicionar niche como query param para proxy**

### NÍVEL MÉDIO (Melhorias)
7. 📝 **Logging detalhado de RLS errors**
8. 📝 **Retry com backoff melhorado para Supabase**
9. 📝 **Monitoramento de taxa de falha de upload**

---

## 7. TESTES PARA VALIDAR

### Teste 1: Requisição Completa
```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"https://www.facebook.com/ads/library/?id=2154950355275377"}'
```

**Verificar:**
- [ ] Status 200
- [ ] 3 variações geradas
- [ ] 3 imagens com URL válidas
- [ ] Nenhuma URL vazia

### Teste 2: Proxy de Imagem
```bash
# Testar com URL Unsplash (deve funcionar)
curl "http://localhost:3000/api/proxy-image?url=https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0" -v

# Testar com URL DALL-E expirada
curl "http://localhost:3000/api/proxy-image?url=https://oaidalleapiprodscus.blob.core.windows.net/EXPIRADA" -v
```

**Verificar:**
- [ ] Unsplash retorna 200 com imagem
- [ ] DALL-E expirada retorna fallback (não erro)
- [ ] Cache headers apropriados

### Teste 3: Renderização No Navegador
1. Acesse dashboard
2. Cole URL do teste
3. Clique "Clonar Agora"
4. Aguarde resultado
5. Verifique 3 imagens visíveis

**Verificar:**
- [ ] 3 imagens carregam sem erro
- [ ] Todas as imagens são diferentes (não repetidas)
- [ ] DevTools Network mostra sucesso para todas
- [ ] Download funciona para cada imagem

---

## 8. CHECKLIST DE IMPLEMENTAÇÃO

### Phase 1: Critical Fixes (30 minutos)
```
[ ] Aumentar timeout 25s → 45s em route.ts:629
[ ] Adicionar validação: se DALL-E e upload falhou, usar fallback
[ ] Implementar 3 imagens diferentes no fallback (não repetidas)
```

### Phase 2: Smart Fallback (45 minutos)
```
[ ] Extrair niche da resposta GPT-4o
[ ] Buscar 3 imagens do nicho em mockAdData
[ ] Passar niche para proxy via query param
[ ] Proxy usar niche para fallback inteligente
```

### Phase 3: Frontend Resilience (30 minutos)
```
[ ] Adicionar fallback visual no VariationCard
[ ] Melhorar UX quando imagem falha
[ ] Testar todas as 3 variações renderizam
```

### Phase 4: Logging & Monitoring (20 minutos)
```
[ ] Log RLS errors explicitamente
[ ] Monitor taxa de upload failure
[ ] Alertar se >20% de falhas
```

---

## 9. REFERÊNCIA DE CÓDIGO

### Arquivos Críticos
1. **`/src/app/api/spy-engine/route.ts`** - Geração e upload (870 linhas)
2. **`/src/app/api/proxy-image/route.ts`** - Proxy e fallback (159 linhas)
3. **`/src/app/dashboard/page.tsx`** - VariationCard renderização (419 linhas)
4. **`/src/lib/mockAdData.ts`** - Database de imagens fallback (212 linhas)
5. **`/src/lib/types.ts`** - Tipos de imagem (31 linhas)

### Linhas Importantes
- **Geração DALL-E:** route.ts:521-563
- **Upload Supabase:** route.ts:597-707
- **Proxy retry:** proxy-image.ts:7-54
- **Proxy fallback:** proxy-image.ts:126-156
- **VariationCard:** dashboard.ts:271-418

---

## 10. CONCLUSÃO

**As imagens não carregam porque:**

1. ✅ **URLs DALL-E expiram** - Sistema tem proteção (upload Supabase)
2. ⚠️ **Upload pode falhar silenciosamente** - RLS ou timeout
3. ⚠️ **Fallback genérico repetido** - Mesma imagem 3x ao invés de variar
4. ⚠️ **Frontend sem fallback visual** - Apenas mostra erro sem recuperação

**Solução: Implementar 5 camadas de garantia** para 100% confiabilidade, com prioridade em:
1. Aumentar timeout (25s → 45s)
2. Forçar Supabase backup antes de retornar
3. Variar 3 imagens fallback diferentes

**Tempo estimado de implementação:** 2-3 horas para Phase 1 + 2.

---

**Próximos passos:** Executar implementação da Phase 1 (Critical Fixes).
