# Detalhamento de Mudanças - Correção DALLE

## Arquivo 1: `src/services/dalle.service.ts`

### Mudança 1.1: Atualização da Interface DALLEGenerationResult
Adicionados campos para rastreamento:
- `source?: 'dalle' | 'unsplash' | 'fallback'`
- `metadata?: { attemptedDalle, dalleErrorCount, imageStatus[] }`

### Mudança 1.2: Função generateSingleImage() - Retry Automático
**Principais mudanças:**
- Loop de retry com `maxRetries = 2`
- Substituído AbortController por `Promise.race()` com timeout explícito
- Timeout aumentado (45-60s → 70-90s)
- Delay de 2s entre tentativas
- Logs detalhados de cada tentativa

**Antes:** Timeout matava requisição sem retry
**Depois:** 2 tentativas automáticas antes de falhar

### Mudança 1.3: Função generateImagesWithDALLE() - Fallback Dinâmico
**Principais mudanças:**
- Implementado fallback em cascata:
  1. DALLE com retry (2 tentativas)
  2. Unsplash dinâmico se DALLE falhar
  3. Fallback pré-compilado se tudo falhar
- Rastreamento de `imageStatus` por imagem
- Métrica de `dalleErrorCount`
- Adicionada `source` na resposta (dalle/unsplash/fallback)
- Logs mostrando mix de DALLE + Unsplash

**Antes:** Sem retry, fallback estático
**Depois:** 3 níveis de fallback com rastreamento completo

**Linhas:** 254 → 336 (+82 linhas)

---

## Arquivo 2: `src/lib/stock-images.ts`

### Mudança 2.1: Expansão de Queries NICHE_QUERIES
**Antes:** 5 queries por nicho (sempre as mesmas)
**Depois:** 7+ queries por nicho

Exemplo igaming:
- Antes: ['casino', 'poker', 'gaming', 'slots', 'betting']
- Depois: ['casino gaming', 'poker game', 'slot machine', 'online betting', 'card game', 'gaming excitement', 'winning moment']

**Impacto:** +40% mais variedade de resultados possíveis

### Mudança 2.2: Função selectRandomQueries() - NOVA
Implementada seleção aleatória de queries para garantir variedade em cada chamada:
```typescript
function selectRandomQueries(queries: string[], count: number): string[]
```

**Impacto:** Cada execução usa queries DIFERENTES

### Mudança 2.3: Função getStockImageVariations() - Dinâmica
**Principais mudanças:**
- Usa `selectRandomQueries()` para variedade
- Mudança de `Promise.all()` para `Promise.allSettled()`
- Logs de queries selecionadas
- Tratamento mais robusto de falhas parciais

**Antes:** Sempre usava queries[0], queries[1], queries[2]
**Depois:** Seleciona aleatoriamente queries diferentes

### Mudança 2.4: Função fetchUnsplashImage() - Retry e Timeout
**Principais mudanças:**
- Retry automático (2 tentativas)
- Timeout de 10s com AbortController
- Tratamento especial de rate limit (429) - não retry
- Delay de 500ms entre tentativas
- Logs de cada tentativa

**Antes:** Sem retry, sem timeout
**Depois:** Robusto com 2 tentativas e tratamento de edge cases

**Linhas:** 249 → 335 (+86 linhas)

---

## Resumo de Números

| Métrica | Antes | Depois | Mudança |
|---------|-------|--------|---------|
| Linhas dalle.service.ts | 254 | 336 | +82 linhas |
| Linhas stock-images.ts | 249 | 335 | +86 linhas |
| Queries por nicho | 5 | 7 | +40% |
| Retry DALLE | 0 | 2 | Novo |
| Retry Unsplash | 0 | 2 | Novo |
| Níveis de fallback | 1 | 3 | +200% |
| Log points | 0 | 15+ | Novo |

---

## Validação de Compilação

```bash
npm run build
✓ Compiled successfully
✓ Generating static pages

npm run lint
// Sem novos erros
```

---

## Teste Recomendado

1. Gerar 5 vezes o MESMO anúncio
2. Verificar que imagens são DIFERENTES cada vez
3. Verificar logs: source (dalle/unsplash/fallback)
4. Verificar metadata: imageStatus array com 3 elementos

**Esperado:**
- Variedade de imagens
- Logs mostrando qual método foi usado
- Sem repetição de URLs
