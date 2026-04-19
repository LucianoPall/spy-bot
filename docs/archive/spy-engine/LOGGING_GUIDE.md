# Guia Completo de Logging - Spy Bot Engine

## Visão Geral

O sistema de logging foi implementado para rastrear cada passo da extração, processamento e geração de conteúdo. Cada etapa é registrada com timestamps ISO, níveis de severidade e dados contextuais.

---

## Arquitetura do Logger

### Arquivo Principal
- **`logger.ts`** - Classe Logger com singleton exportado

### Métodos Disponíveis

```typescript
logger.info(stage, message, data?)         // Informação
logger.success(stage, message, data?)      // Sucesso
logger.warn(stage, message, data?)         // Aviso
logger.error(stage, message, error?)       // Erro
logger.startTimer(label)                   // Iniciar cronômetro
logger.endTimer(label, stage?)             // Finalizar cronômetro
logger.exportAsJSON()                      // Exportar todos os logs
logger.getSummary()                        // Resumo da requisição
logger.clear()                             // Limpar logs
```

### Stages Predefinidos

```typescript
STAGES = {
  START: 'START',                    // Início da requisição
  VALIDATION: 'VALIDATION',          // Validação de URL e chaves
  BILLING: 'BILLING',                // Verificação de créditos
  APIFY_CALL: 'APIFY_CALL',         // Chamada ao Apify iniciada
  APIFY_SUCCESS: 'APIFY_SUCCESS',   // Apify completou com sucesso
  APIFY_FAIL: 'APIFY_FAIL',         // Erro no Apify
  FALLBACK: 'FALLBACK',              // Usando dados fallback/mock
  OPENAI_CALL: 'OPENAI_CALL',       // Chamada ao GPT-4o iniciada
  OPENAI_SUCCESS: 'OPENAI_SUCCESS', // GPT-4o respondeu
  OPENAI_FAIL: 'OPENAI_FAIL',       // Erro no OpenAI
  DALLE_CALL: 'DALLE_CALL',         // Geração de imagens iniciada
  DALLE_SUCCESS: 'DALLE_SUCCESS',   // Imagens geradas com sucesso
  DALLE_FAIL: 'DALLE_FAIL',         // Erro no DALLE
  SUPABASE_INSERT: 'SUPABASE_INSERT', // Insert em banco iniciado
  SUPABASE_SUCCESS: 'SUPABASE_SUCCESS', // Insert completado
  SUPABASE_FAIL: 'SUPABASE_FAIL',   // Erro no Supabase
  STORAGE_UPLOAD: 'STORAGE_UPLOAD', // Upload iniciado
  STORAGE_SUCCESS: 'STORAGE_SUCCESS', // Upload completado
  STORAGE_FAIL: 'STORAGE_FAIL',     // Erro no upload
  BILLING_DEDUCT: 'BILLING_DEDUCT', // Crédito deduzido
  END: 'END',                        // Requisição concluída
  ERROR_CRITICAL: 'ERROR_CRITICAL'  // Erro crítico
}
```

---

## Fluxo de Logs na Requisição

### 1. Fase Inicial (START → VALIDATION)

```
[2026-03-08T14:32:45.123Z] [START] ℹ️ URL recebida
  └─ data: { url: "https://facebook.com/...", hasBrandProfile: true }

[2026-03-08T14:32:45.156Z] [VALIDATION] ✅ URL e chaves validadas
```

### 2. Fase de Billing (BILLING)

```
[2026-03-08T14:32:45.200Z] [BILLING] ℹ️ Iniciando verificação de créditos e plano
[2026-03-08T14:32:45.250Z] [BILLING] ℹ️ Usuário autenticado
  └─ data: { userId: "user_123" }

[2026-03-08T14:32:45.300Z] [BILLING] ✅ Plano carregado
  └─ data: { plan: "pro", credits: 50 }

[2026-03-08T14:32:45.350Z] [BILLING] ✅ Verificação de billing concluída
```

### 3. Fase Apify (APIFY_CALL → APIFY_SUCCESS ou APIFY_FAIL)

**Sucesso:**
```
[2026-03-08T14:32:45.400Z] [APIFY_CALL] ℹ️ Iniciando extração com Apify (tentativa 1-3)
  └─ data: { url: "https://facebook.com/ads..." }

[2026-03-08T14:33:10.500Z] [APIFY_SUCCESS] ✅ Dados extraídos com sucesso
  └─ data: { copyLength: 245, hasImage: true, imageSample: "https://..." }
  └─ duration: 25100ms
```

**Falha com Fallback:**
```
[2026-03-08T14:32:45.400Z] [APIFY_CALL] ℹ️ Iniciando extração com Apify
[2026-03-08T14:33:15.600Z] [APIFY_FAIL] ❌ Erro na chamada Apify
  └─ error: { message: "Apify API Error: 429 - Rate limit exceeded", code: "429" }

[2026-03-08T14:33:15.650Z] [FALLBACK] ⚠️ Ativando Fallback Mock
  └─ data: { niche: "Emagrecimento" }

[2026-03-08T14:33:15.700Z] [FALLBACK] ℹ️ Mock data carregado com sucesso
```

### 4. Fase OpenAI (OPENAI_CALL → OPENAI_SUCCESS ou OPENAI_FAIL)

```
[2026-03-08T14:33:16.000Z] [OPENAI_CALL] ℹ️ Iniciando chamada GPT-4o para reengenharia de copy
[2026-03-08T14:33:16.050Z] [OPENAI_CALL] ℹ️ Contexto de marca detectado
  └─ data: { brand: "Minha Clínica", niche: "Estética" }

[2026-03-08T14:33:45.200Z] [OPENAI_SUCCESS] ✅ GPT-4o respondeu com 3 variações
  └─ data: { usingByok: false }
  └─ duration: 29200ms
```

### 5. Fase DALLE (DALLE_CALL → DALLE_SUCCESS ou DALLE_FAIL)

```
[2026-03-08T14:33:45.300Z] [DALLE_CALL] ℹ️ Gerando imagem 1 (1024x1024)
  └─ data: { promptLength: 189 }

[2026-03-08T14:34:05.400Z] [DALLE_SUCCESS] ✅ Imagem 1 gerada com sucesso

[2026-03-08T14:34:05.500Z] [DALLE_CALL] ℹ️ Gerando imagem 2 (1024x1024)
[2026-03-08T14:34:25.600Z] [DALLE_SUCCESS] ✅ Imagem 2 gerada com sucesso

[2026-03-08T14:34:25.700Z] [DALLE_CALL] ℹ️ Gerando imagem 3 (1024x1792)
[2026-03-08T14:34:45.800Z] [DALLE_SUCCESS] ✅ Imagem 3 gerada com sucesso
  └─ duration: 60500ms
```

### 6. Fase Supabase (STORAGE_UPLOAD → SUPABASE_INSERT → END)

```
[2026-03-08T14:34:46.000Z] [STORAGE_UPLOAD] ℹ️ Iniciando upload de 3 imagens para Supabase Storage
[2026-03-08T14:34:52.100Z] [STORAGE_SUCCESS] ✅ Imagem 1 enviada para Storage
  └─ data: { fileName: "user_123/1708960492100-abc123.png" }

[2026-03-08T14:34:58.200Z] [STORAGE_SUCCESS] ✅ Imagem 2 enviada para Storage
[2026-03-08T14:35:04.300Z] [STORAGE_SUCCESS] ✅ Imagem 3 enviada para Storage

[2026-03-08T14:35:04.350Z] [SUPABASE_INSERT] ℹ️ Inserindo geração no banco de dados
[2026-03-08T14:35:05.400Z] [SUPABASE_SUCCESS] ✅ Clone salvo no histórico e Storage
  └─ data: { userId: "user_123", niche: "Estética" }

[2026-03-08T14:35:05.450Z] [BILLING_DEDUCT] ℹ️ Crédito deduzido da quota gratuita
  └─ data: { remainingCredits: 4 }

[2026-03-08T14:35:05.500Z] [END] ✅ Requisição completada com sucesso
  └─ summary: { totalLogs: 28, totalTime: "150300ms", errors: 0, warnings: 1, successes: 15, status: "SUCCESS" }
```

---

## Como Ler Logs no Navegador

### Método 1: DevTools Network

1. Abrir DevTools (`F12`)
2. Ir para aba **"Network"**
3. Fazer uma requisição POST para `/api/spy-engine`
4. Clicar na requisição POST
5. Ir para aba **"Response"**
6. Procurar a chave `"logs"` no JSON

### Método 2: Console (via JavaScript)

```javascript
// Após requisição completar
fetch('/api/spy-engine', { method: 'POST', body: JSON.stringify({...}) })
  .then(res => res.json())
  .then(data => {
    console.table(data.logs.logs);  // Tabela com todos os logs
    console.log(data.logs.summary); // Resumo da requisição
  });
```

### Método 3: Browser Console

```javascript
// Abrir DevTools (F12) → Console
// Colar o código abaixo:
console.table(lastResponse.logs.logs);
console.log('SUMMARY:', lastResponse.logs.summary);
```

---

## Estrutura de um Log Entry

```json
{
  "timestamp": "2026-03-08T14:32:45.123Z",
  "stage": "APIFY_CALL",
  "level": "INFO",
  "message": "Iniciando extração com Apify (tentativa 1-3)",
  "data": {
    "url": "https://facebook.com/ads/...",
    "copyLength": 245
  },
  "duration": 25100
}
```

### Campos

- **timestamp**: ISO 8601 com milissegundos
- **stage**: Stage do pipeline (APIFY_CALL, OPENAI_SUCCESS, etc)
- **level**: INFO, SUCCESS, WARN, ERROR
- **message**: Descrição humana da operação
- **data**: Objeto com contexto adicional (opcional)
- **duration**: Tempo em ms para operações com timer (opcional)

---

## Exemplo: Resumo da Requisição (Summary)

```json
{
  "summary": {
    "totalLogs": 28,
    "totalTime": "150300ms",
    "errors": 0,
    "warnings": 1,
    "successes": 15,
    "status": "SUCCESS"
  },
  "logs": [ ... ]
}
```

**Interpretação:**
- `totalLogs`: 28 eventos registrados
- `totalTime`: Requisição levou 150.3 segundos
- `errors`: 0 erros (sucesso)
- `warnings`: 1 aviso (algo anômalo mas recuperável)
- `successes`: 15 operações bem-sucedidas
- `status`: SUCCESS = sem erros críticos

---

## Casos de Uso - Diagnósticos

### Caso 1: "Apify retornou vazio"

```
Procurar na resposta:
- [APIFY_FAIL] ❌ Apify retornou lista vazia
- [FALLBACK] ⚠️ Ativando Fallback Mock
- [FALLBACK] ℹ️ Mock data carregado com sucesso

→ Significa que a URL do anúncio é inválida ou o Facebook bloqueou
```

### Caso 2: "OpenAI retornou erro"

```
Procurar:
- [OPENAI_FAIL] ❌ Erro na chamada OpenAI
- error.message: "You exceeded your current quota"

→ Significa que a chave OpenAI não tem créditos suficientes
```

### Caso 3: "Imagens com placeholder"

```
Procurar:
- [DALLE_FAIL] ❌ Erro ao gerar imagem 1
- [DALLE_FAIL] ❌ Erro ao gerar imagem 2
- [DALLE_FAIL] ❌ Erro ao gerar imagem 3

→ Significa que DALLE falhou (quota, rate limit, ou prompt inválido)
```

### Caso 4: "Créditos acabaram"

```
Log antes do erro:
- [BILLING] ❌ Créditos insuficientes, acesso negado
- Status: 403 (Forbidden)

→ Usuário precisa assinar plano PRO ou usar BYOK
```

---

## Boas Práticas de Leitura

### 1. Sempre Verificar o Summary Primeiro

```javascript
const summary = response.logs.summary;
console.log(`Status: ${summary.status}`);
console.log(`Tempo total: ${summary.totalTime}`);
console.log(`Erros: ${summary.errors}, Avisos: ${summary.warnings}`);
```

### 2. Filtrar Logs por Stage

```javascript
const apifyLogs = logs.filter(log => log.stage.includes('APIFY'));
const openaiLogs = logs.filter(log => log.stage.includes('OPENAI'));
const dalleLogs = logs.filter(log => log.stage.includes('DALLE'));
```

### 3. Procurar Erros Rapidamente

```javascript
const errors = logs.filter(log => log.level === 'ERROR');
console.table(errors);
```

### 4. Ver Timeline Completa

```javascript
logs.forEach(log => {
  console.log(`${log.timestamp} [${log.stage}] ${log.message}`);
});
```

---

## Campos de Dados Úteis por Stage

### APIFY_CALL
- `url`: URL extraída (primeiros 80 chars)

### APIFY_SUCCESS
- `copyLength`: Comprimento do copy extraído
- `hasImage`: True se imagem foi extraída
- `imageSample`: Primeiros 60 chars da URL da imagem

### OPENAI_SUCCESS
- `usingByok`: True se usando chave customizada do cliente

### DALLE_SUCCESS
- Nenhum dado adicional (sucesso implícito)

### STORAGE_SUCCESS
- `fileName`: Caminho do arquivo no Storage (ex: `user_123/1708960492100-abc123.png`)

### SUPABASE_SUCCESS
- `userId`: ID do usuário
- `niche`: Nicho detectado pela IA

### BILLING_DEDUCT
- `remainingCredits`: Créditos restantes após dedução

---

## Integração com Monitoramento Externo

Para enviar logs para um serviço de monitoramento (Sentry, LogRocket, etc):

```typescript
// Em route.ts, antes de return NextResponse
if (process.env.MONITORING_ENABLED === 'true') {
  const logsSummary = logger.exportAsJSON();
  await fetch(process.env.MONITORING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user?.id,
      timestamp: new Date().toISOString(),
      logs: logsSummary
    })
  });
}
```

---

## Troubleshooting

### Logs Não Aparecem na Response

1. Verificar se a requisição retornou HTTP 200/success
2. Logs aparecem em TODAS as respostas (sucesso, erro, etc)
3. Procurar a chave `"logs"` no JSON da resposta

### Timestamps Estão Iguais

- Normal! Logger usa `new Date().toISOString()` (resolução de milissegundos)
- Operações rápidas podem ter timestamps idênticos

### Falta Log de Uma Etapa

- Verificar se a etapa foi executada (pode ter sido skipped)
- Procurar logs de erro que expliquem why

---

## Próximos Passos

1. Monitorar logs em produção
2. Criar dashboard de analytics baseado nos logs
3. Implementar alertas automáticos para erros críticos
4. Usar logs para otimizar performance (duração das etapas)

---

**Versão:** 1.0
**Data:** 2026-03-08
**Autor:** Agent 5 - Logging + Monitoring + Error Handling
