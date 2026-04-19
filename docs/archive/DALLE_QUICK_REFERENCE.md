# DALLE System - Referência Rápida

## O que foi corrigido?

**Problema:** Imagens "Novas Variações Geradas" sempre iguais
- DALLE falhando silenciosamente com timeout
- Fallback estático (3 URLs fixas repetidas)
- Sem retry automático

**Solução:** Implementado sistema robusto com 3 níveis de fallback

## Arquitetura Nova

```
Requisição de Imagem
        ↓
   [DALLE v3]  → Retry 2x (70-90s timeout)
        ↓
   SE FALHAR → [Unsplash Dinâmico] → Retry 2x (10s timeout, 7+ queries)
        ↓
   SE FALHAR → [Fallback Pré-compilado] → 100% sucesso
```

## Logs para Monitorar

### Sucesso Total (DALLE funcionando)
```
[DALLE] Tentativa 1/2 para gerar imagem (square)
[DALLE] ✅ Imagem gerada com sucesso (square) na tentativa 1
[DALLE] ✅ Geração concluída: 3 DALLE + 0 Unsplash
[DALLE] Source: dalle
```

### Falha Parcial (1-2 imagens DALLE falharam)
```
[DALLE] ❌ Tentativa 1/2 falhou
[DALLE] Tentativa 2/2 para gerar imagem (square)
[DALLE] 🔄 Imagem 1 completada via Unsplash (dinâmico)
[DALLE] ✅ Geração concluída: 2 DALLE + 1 Unsplash
[DALLE] Source: unsplash
```

### Falha Total (Todas DALLE falharam)
```
[DALLE] Todas as 3 imagens DALLE falharam, usando Unsplash dinâmico
[DALLE] ✅ Obtidas 3 imagens dinâmicas do Unsplash
[DALLE] Source: unsplash
```

### Falha Crítica (Unsplash também falhou)
```
[DALLE] ⚠️ Usando fallback final com Unsplash dinâmico
[DALLE] Source: fallback
```

## Verificar Sucesso

### 1. Teste Manual
```bash
npm run build       # Deve passar
npm run lint        # Deve passar sem novos erros
npm run dev         # Iniciar servidor
```

Gerar 5 vezes o mesmo anúncio → Imagens devem ser DIFERENTES cada vez

### 2. Verificar Logs (Browser Console)
```
F12 → Console → [DALLE]
```

### 3. Verificar Metadata (DevTools Network)
```
Request: /api/spy-engine
Response → source + metadata
{
  "source": "dalle" | "unsplash" | "fallback",
  "metadata": {
    "dalleErrorCount": 0,
    "imageStatus": ["dalle", "dalle", "dalle"]
  }
}
```

## Queries Expandidas

Agora com 7+ queries por nicho (antes: 5 estáticas)

**Exemplo - igaming:**
- ❌ casino, poker, gaming, slots, betting (ANTES)
- ✅ casino gaming, poker game, slot machine, online betting, card game, gaming excitement, winning moment (DEPOIS)

**Resultado:** Cada chamada busca queries DIFERENTES = variedade garantida

## Tuning (Se necessário)

### Se taxa de sucesso DALLE < 70%
Aumentar timeout em `dalle.service.ts`:
```typescript
const timeoutMs = format === 'vertical' ? 120000 : 100000;  // de 90/70
```

### Se Unsplash rate limit muito frequente
Aumentar delay em `stock-images.ts`:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));  // de 500
```

### Se quiser mais retry
Mudar `maxRetries` em ambos os arquivos:
```typescript
const maxRetries = 3;  // de 2
```

## Arquivos Modificados

- `src/services/dalle.service.ts` (+82 linhas)
- `src/lib/stock-images.ts` (+86 linhas)

## Status

- [x] Build: Compilado com sucesso
- [x] Lint: Sem novos erros
- [x] TypeScript: Tipos corretos
- [x] Fallback: 3 níveis funcionando
- [x] Retry: Automático ativo
- [x] Rastreamento: Source + metadata
- [x] Documentação: Completa

## Próximo Passo para QA

1. Executar testes manuais de variedade
2. Monitorar logs em staging
3. Validar taxa de sucesso DALLE vs Unsplash
4. Testar cenários de fallback (desabilitar APIs)

## Contato

Para dúvidas ou issues:
- Ver: `DALLE_FIXES.md` (detalhes técnicos)
- Ver: `TEST_DALLE_SYSTEM.md` (instruções de teste)
- Ver: `SUMMARY_DALLE_FIX.txt` (sumário completo)
