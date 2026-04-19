# Teste do Sistema DALLE Corrigido

## Instruções de Teste Manual

### Teste 1: Verificar Variedade de Imagens
1. Abra o dashboard
2. Gere variações para o MESMO anúncio 3 vezes (limpar cache se necessário)
3. Compare as "Novas Variações Geradas" (seção de imagens)
4. ✅ **Esperado:** Imagens DIFERENTES em cada execução
5. ❌ **Problema:** Se forem as mesmas imagens = fallback estático ativo

### Teste 2: Verificar Logs da Geração
1. Abra DevTools (F12)
2. Console → veja logs de `[DALLE]`
3. ✅ **Esperado:** Ver mensagens como:
   - `[DALLE] Tentativa 1/2 para gerar imagem (square)`
   - `[DALLE] ✅ Imagem gerada com sucesso via DALLE`
   - `[DALLE] ✅ Geração concluída: 3 DALLE + 0 Unsplash`
   - `[DALLE] Source: dalle`

4. **Se DALLE falhar (esperado em 10-15% das vezes):**
   - `[DALLE] ❌ Tentativa 1/2 falhou`
   - `[DALLE] Tentativa 2/2 para gerar imagem (square)`
   - `[DALLE] 🔄 Imagem 1 completada via Unsplash (dinâmico)`
   - `[DALLE] ✅ Geração concluída: 2 DALLE + 1 Unsplash`
   - `[DALLE] Source: unsplash`

### Teste 3: Verificar Metadata de Rastreamento
Na resposta da API `/api/spy-engine`, verificar:

```json
{
  "source": "dalle" | "unsplash" | "fallback",
  "metadata": {
    "attemptedDalle": true,
    "dalleErrorCount": 0,
    "imageStatus": ["dalle", "dalle", "dalle"]
  }
}
```

## Cenários de Teste

### Cenário 1: Sucesso Total (DALLE OK)
- Condição: API OpenAI respondendo normalmente
- ✅ Esperado: `imageStatus: ['dalle', 'dalle', 'dalle']`
- Logs: 3x "✅ Imagem gerada com sucesso via DALLE"

### Cenário 2: Falha Parcial (1-2 imagens falham)
- Condição: 1-2 chamadas DALLE com timeout
- ✅ Esperado: `imageStatus: ['dalle', 'unsplash', 'dalle']`
- Logs: Mix de DALLE + Unsplash
- **Verificar:** Imagens são diferentes (não reciclam URLs estáticas)

### Cenário 3: Falha Total (Todas as 3 falham)
- Condição: API OpenAI indisponível
- ✅ Esperado: `imageStatus: ['unsplash', 'unsplash', 'unsplash']`
- Logs: "Todas as 3 imagens DALLE falharam, usando Unsplash dinâmico"

### Cenário 4: Sem API Key Unsplash
- Condição: `UNSPLASH_ACCESS_KEY` não configurada
- ✅ Esperado: Usar fallback pré-configurado
- Logs: "[STOCK-IMAGES] Sem UNSPLASH_ACCESS_KEY, usando fallback local"
- **Verificar:** Imagens ainda funcionar (pré-compiladas)

## Verificações de Compilação ✅

```bash
# Verificar que tudo compilou
npm run build
# Output esperado: ✓ Compiled successfully

# Verificar lint (sem novos erros)
npm run lint
# Output esperado: Sem erros, apenas warnings já existentes
```

## Métricas a Monitorar

| Métrica | Esperado | Crítico |
|---------|----------|---------|
| Taxa DALLE Success | 85-95% | <70% |
| Taxa Fallback Unsplash | 5-15% | >20% |
| Taxa Fallback Pré-compilado | <1% | >5% |
| Tempo médio por imagem | 8-15s | >30s |
| Taxa de Variedade Unsplash | 40%+ | <20% |

## Troubleshooting

### Problema: Imagens ainda iguais
```
Causa: DALLE falhando 100% das vezes
Solução:
1. Verificar OPENAI_API_KEY está configurada
2. Verificar quota OpenAI não está esgotada
3. Verificar se IP está blocado por rate limit
4. Aumentar timeout de 90s para 120s em dalle.service.ts
```

### Problema: Unsplash retornando 429 (rate limit)
```
Causa: Muitas requisições simultâneas
Solução:
1. Delay entre requisições aumentou de 500ms para 1000ms
2. Implementar circuit breaker se persistir
3. Considerar cache de imagens
```

### Problema: Sem UNSPLASH_ACCESS_KEY
```
Verificar em .env:
UNSPLASH_ACCESS_KEY=xxxxx

Se não tiver:
1. Solicitar chave em https://unsplash.com/api
2. Fallback pré-compilado vai funcionar, mas sem variedade
```

## Success Criteria Implementado ✅

- [x] Retry automático DALLE (2 tentativas)
- [x] Timeout robusto (não mata abruptamente)
- [x] Unsplash dinâmico (7+ queries por nicho)
- [x] Rastreamento de source (dalle/unsplash/fallback)
- [x] Logs detalhados de cada tentativa
- [x] Variedade garantida (selectRandomQueries)
- [x] Graceful fallback em cascata
- [x] Compilação sem erros

## Próximas Validações Recomendadas

1. **Load Test:** 10+ requisições simultâneas
2. **Network Throttling:** Simular conexão lenta (3G)
3. **API Failure:** Desativar DALLE e verificar fallback
4. **Cache Behavior:** Verificar se imagens são cacheadas corretamente
5. **Database:** Verificar se metadata está sendo salva

