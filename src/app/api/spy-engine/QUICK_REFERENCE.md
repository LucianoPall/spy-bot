# Quick Reference - Logger & Monitoring

## TL;DR - Início Rápido

### 1. Encontrar Logs na Resposta

**DevTools → Network → Requisição POST → Response → Procurar `"logs"`**

### 2. Entender o Summary

```json
{
  "status": "SUCCESS",           // ✅ Tudo OK
  "totalTime": "45300ms",        // Tempo total (45.3s)
  "errors": 0,                   // 0 erros
  "warnings": 2,                 // 2 avisos
  "successes": 15                // 15 etapas OK
}
```

**Status = FAILED?** Procure por logs com `level: "ERROR"`

### 3. Diagnóstico Rápido por Stage

| Stage | O que significa | Como diagnosticar |
|-------|-----------------|-------------------|
| `[START]` | Requisição iniciada | Sempre aparece 1x |
| `[VALIDATION]` ❌ | URL ou chaves inválidas | Se ver erro aqui, voltar e verificar inputs |
| `[BILLING]` ❌ | Sem créditos | Se erro, usuário precisa de plano ou BYOK |
| `[APIFY_FAIL]` ❌ | Facebook não respondeu | Verificar se URL é válida |
| `[FALLBACK]` ⚠️ | Usando dados padrão | Normal quando Apify falha |
| `[OPENAI_FAIL]` ❌ | Chave OpenAI sem créditos | Recarregar créditos OpenAI |
| `[DALLE_FAIL]` ❌ | Imagem não gerada | Usar placeholder (fallback automático) |
| `[SUPABASE_FAIL]` ⚠️ | Não salvou em BD | Ignorado, UI não é afetada |
| `[END]` ✅ | Requisição completada | Sucesso! |

---

## Filtros Úteis (Console JavaScript)

### Ver Apenas Erros

```javascript
const errors = data.logs.logs.filter(l => l.level === 'ERROR');
console.table(errors);
```

### Ver Duração de Cada Etapa

```javascript
data.logs.logs
  .filter(l => l.duration)
  .forEach(l => console.log(`${l.stage}: ${l.duration}ms`));
```

### Ver Apenas Apify

```javascript
const apifyLogs = data.logs.logs.filter(l => l.stage.includes('APIFY'));
console.table(apifyLogs);
```

### Ver Apenas OpenAI

```javascript
const openaiLogs = data.logs.logs.filter(l => l.stage.includes('OPENAI'));
console.table(openaiLogs);
```

### Ver Timeline

```javascript
data.logs.logs.forEach(l => {
  console.log(`${l.timestamp} [${l.stage}] ${l.message}`);
});
```

---

## Códigos de Erro Comuns

### Erro 400 - VALIDATION

```json
{
  "error": "URL do anúncio não fornecida.",
  "logs": { ... }
}
```

**Solução:** Verificar se URL está sendo enviada.

### Erro 403 - OUT_OF_CREDITS

```json
{
  "error": "Seus créditos grátis acabaram!",
  "code": "OUT_OF_CREDITS",
  "logs": { ... }
}
```

**Solução:** Assinar plano PRO ou usar BYOK.

### Erro 500 - ERROR_CRITICAL

```json
{
  "error": "Erro catastrófico no servidor.",
  "message": "...",
  "logs": { ... }
}
```

**Solução:** Verificar logs para entender o erro específico.

### Log: APIFY_FAIL com "Rate limit exceeded"

**Significado:** Apify foi bloqueado por muitas requisições.
**Solução:** Aguardar alguns segundos e tentar novamente.

### Log: OPENAI_FAIL com "You exceeded your current quota"

**Significado:** Chave OpenAI sem créditos.
**Solução:** Ir em [platform.openai.com](https://platform.openai.com) e adicionar créditos.

### Log: DALLE_FAIL com "Image could not be generated"

**Significado:** Prompt violou políticas ou DALLE está indisponível.
**Solução:** Usar placeholder automático (fallback).

---

## Dados Esperados em Cada Stage

### APIFY_SUCCESS

```json
{
  "data": {
    "copyLength": 245,           // Caracteres do copy
    "hasImage": true,            // Tem imagem?
    "imageSample": "https://..." // Primeiros 60 chars da URL
  }
}
```

### OPENAI_SUCCESS

```json
{
  "data": {
    "usingByok": false           // Usando chave customizada?
  },
  "duration": 29200              // Levou 29.2s
}
```

### DALLE_SUCCESS

```json
{
  "message": "Imagem 1 gerada com sucesso"
  // (sem dados adicionais, apenas sucesso implícito)
}
```

### SUPABASE_SUCCESS

```json
{
  "data": {
    "userId": "user_abc123",     // ID do usuário
    "niche": "Emagrecimento"     // Nicho detectado
  }
}
```

---

## Performance Esperada

| Etapa | Tempo Típico | Máximo |
|-------|-------------|---------|
| Apify (extração) | 15-30s | 60s |
| OpenAI (GPT-4o) | 10-20s | 40s |
| DALLE (3 imagens) | 15-20s | 30s |
| Supabase (upload+insert) | 5-10s | 30s |
| **TOTAL** | **45-80s** | **180s** |

**Se passar do máximo:** Aumentar `maxDuration` em `route.ts` (linha 12).

---

## Checklist de Diagnóstico

```
[ ] Requisição retorna HTTP 200?
    ❌ Não → Procurar por logs de erro

[ ] Tem logs na resposta?
    ❌ Não → Verificar route.ts (log.exportAsJSON() adicionado?)

[ ] Status = SUCCESS?
    ❌ Não → Ver qual stage falhou

[ ] Errors = 0?
    ❌ Não → Verificar qual erro em `logs.logs`

[ ] Apify extraiu conteúdo?
    ❌ Não → URL pode ser inválida ou Facebook bloqueou

[ ] OpenAI respondeu?
    ❌ Não → Chave sem créditos ou inválida

[ ] DALLE gerou imagens?
    ❌ Não → Usar fallback (automático)

[ ] Supabase salvou?
    ❌ Não → Pode ignorar (UI não afetada)

✅ Tudo verde? Implementação OK!
```

---

## Métodos Logger Disponíveis

```typescript
// No route.ts, sempre usar:
import { logger, STAGES } from './logger';

// Info - Informação genérica
logger.info(STAGES.START, 'Mensagem', { dado: 'valor' });

// Success - Operação bem-sucedida
logger.success(STAGES.APIFY_SUCCESS, 'Dados extraídos', { copyLength: 100 });

// Warn - Aviso (anômalo mas recuperável)
logger.warn(STAGES.FALLBACK, 'Usando mock data');

// Error - Erro (operação falhou)
logger.error(STAGES.APIFY_FAIL, 'Falha na requisição', errorObject);

// Timers
logger.startTimer('APIFY_EXTRACTION');
// ... código ...
logger.endTimer('APIFY_EXTRACTION', STAGES.APIFY_SUCCESS);

// Exportar
const jsonLogs = logger.exportAsJSON();
const summary = logger.getSummary();
logger.clear(); // Limpar para próxima requisição
```

---

## Configurações para Produção

### Variáveis de Ambiente Recomendadas

```bash
# .env.local ou .env.production

# Logging
LOG_LEVEL=info              # info, warn, error
EXPOSE_LOGS=true            # Enviar logs no response?
LOG_EXTERNAL=false          # Enviar para serviço externo?
LOG_EXTERNAL_URL=           # URL do serviço de logs

# Timeouts (em segundos)
APIFY_TIMEOUT=60
OPENAI_TIMEOUT=60
DALLE_TIMEOUT=60

# Monitoramento
SENTRY_DSN=                 # Se usar Sentry
DATADOG_ENABLED=false       # Se usar Datadog
```

### Integração com Sentry

```typescript
// route.ts - adicionar após configuração logger
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.captureMessage(JSON.stringify(logger.exportAsJSON()));
}
```

---

## Exemplos Reais de Debug

### "Por que a imagem está com placeholder?"

1. Procurar por `[DALLE_FAIL]` nos logs
2. Ver o `error.message`
3. Se "Image could not be generated" → prompt violou políticas
4. Se timeout → DALLE lento, tentar novamente
5. Se "quota exceeded" → créditos DALLE esgotados

### "Por que o copy não foi alterado?"

1. Procurar por `[OPENAI_SUCCESS]`
2. Verificar se `usingByok: true` ou `false`
3. Se `usingByok: true` → usar chave do cliente (pode estar sem créditos)
4. Se `usingByok: false` → usar chave do servidor (verificar env var)

### "Por que não salvou em histórico?"

1. Procurar por `[SUPABASE_SUCCESS]` ou `[SUPABASE_FAIL]`
2. Se falhou → é problema no BD, UI não é afetada
3. Usuário pode usar clone mesmo sem salvar
4. Tentar novamente mais tarde

### "Por que levou 180 segundos?"

1. Ver logs com `duration`
2. Encontrar etapa que levou mais tempo
3. Exemplo: Apify levou 60s = pode estar rate-limited
4. Solução: Aguardar e tentar novamente

---

## Exportar Logs para Análise

### JSON Completo (DevTools)

```javascript
// No console
const logsJson = JSON.stringify(data.logs, null, 2);
console.log(logsJson);
// Copiar e salvar em arquivo .json
```

### CSV para Excel

```javascript
// No console
const csv = data.logs.logs.map(l =>
  `"${l.timestamp}","${l.stage}","${l.level}","${l.message}"`
).join('\n');
console.log(csv);
// Copiar, colar no Excel, salvar como .csv
```

### Markdown para Documentação

```javascript
const md = data.logs.logs.map(l =>
  `| ${l.timestamp} | ${l.stage} | ${l.level} | ${l.message} |`
).join('\n');
console.log(md);
```

---

## Links Úteis

- **Docs Apify:** https://apify.com/docs
- **OpenAI API:** https://platform.openai.com/docs
- **DALLE-3:** https://platform.openai.com/docs/guides/images/generations
- **Supabase Docs:** https://supabase.com/docs
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## Próximas Melhorias

- [ ] Dashboard de analytics dos logs
- [ ] Alertas automáticos para erros
- [ ] Integração com Sentry/Datadog
- [ ] Histórico de performance por endpoint
- [ ] Relatório automático para usuários

---

**Versão:** 1.0 | **Data:** 2026-03-08 | **Mantido por:** Agent 5
