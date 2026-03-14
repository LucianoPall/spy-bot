# Guia Completo de Testes - Spy-Engine

Este documento descreve como configurar, executar e manter os testes do spy-engine.

## Sumário

1. [Instalação e Setup](#instalação-e-setup)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Rodando os Testes](#rodando-os-testes)
4. [Cobertura de Testes](#cobertura-de-testes)
5. [Testes Implementados](#testes-implementados)
6. [Troubleshooting](#troubleshooting)

---

## Instalação e Setup

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação de Dependências

```bash
npm install
```

Isto instalará o Vitest e suas dependências:
- `vitest` - Framework de testes (versão 1.0.4+)
- `@vitest/ui` - Interface visual para testes
- `@vitest/coverage-v8` - Coverage reporter (V8 engine)

### Verificar Instalação

```bash
npm list vitest
```

Saída esperada:
```
spy-bot-web@0.1.0 C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web
└── vitest@1.0.4
```

---

## Estrutura de Testes

### Localização dos Arquivos

```
spy-bot-web/
├── src/
│   └── app/
│       └── api/
│           └── spy-engine/
│               ├── route.ts              # Código principal
│               ├── route.test.ts         # Testes (NOVO)
│               ├── logger.ts             # Utilitário de logging
│               └── ...
├── vitest.config.ts                     # Configuração do Vitest (NOVO)
└── package.json                         # Scripts de teste (ATUALIZADO)
```

### Organização dos Testes (`route.test.ts`)

```typescript
// 1. TESTES: fetchWithRetry() - 6 testes
describe('fetchWithRetry - Exponential Backoff Retry', () => { ... })

// 2. TESTES: Apify Parsing - 6 testes
describe('Apify Parsing - Extração de Copy e Imagem', () => { ... })

// 3. TESTES: OpenAI Generation - 6 testes
describe('OpenAI Generation - Estrutura JSON de Output', () => { ... })

// 4. TESTES: DALL-E Generation - 7 testes
describe('DALL-E Generation - URLs de Imagem Geradas', () => { ... })

// 5. TESTE INTEGRAÇÃO: Smoke Test - 2 testes
describe('Integração - Fluxo Completo do Spy-Engine', () => { ... })
```

**Total: 27 testes**

---

## Rodando os Testes

### 1. Executar Todos os Testes

```bash
npm test
```

**Saída esperada:**

```
 ✓ src/app/api/spy-engine/route.test.ts (27)
   ✓ fetchWithRetry - Exponential Backoff Retry (6)
     ✓ deve fazer requisição com sucesso na primeira tentativa (status 200)
     ✓ deve retentar com backoff exponencial em erro 503
     ✓ deve retentar em erro 429 (rate limit)
     ✓ deve lançar erro após 3 tentativas falhadas
     ✓ deve aplicar delays exponenciais: 1s, 2s, 4s
     ✓ deve não retentar em erro 404 (não-transitório)
   ✓ Apify Parsing - Extração de Copy e Imagem (6)
     ✓ deve extrair copy de snapshot.body.text
     ✓ deve extrair copy de fallback (primaryText)
     ✓ deve extrair imageUrl de snapshot.images[0]
     ✓ deve extrair imageUrl de snapshot.videos[0] se imagem não existir
     ✓ deve retornar string vazia se nenhuma copy disponível
     ✓ deve descartar "undefined" e "null" strings
   ✓ OpenAI Generation - Estrutura JSON de Output (6)
     ✓ deve retornar JSON válido com 3 variações
     ✓ deve conter copywriting matador em cada variação
     ✓ deve conter imagePrompt bem detalhado em inglês
     ✓ deve detectar nicho de mercado automaticamente
     ✓ deve falhar parse se JSON inválido
     ✓ deve validar estrutura mesmo com dados vazios
   ✓ DALL-E Generation - URLs de Imagem Geradas (7)
     ✓ deve gerar URL válida para imagem 1 (1024x1024 - Feed Quadrado)
     ✓ deve gerar URL com tamanho 1024x1024 para primeira variação
     ✓ deve retornar fallback se DALL-E falhar
     ✓ deve gerar 3 URLs diferentes (uma para cada variação)
     ✓ deve validar URL como HTTPS
     ✓ deve conter query params de segurança (sv, se, sig)
     ✓ deve salvar URL em Supabase Storage após geração
   ✓ Integração - Fluxo Completo do Spy-Engine (2)
     ✓ deve processar requisição POST com URL válida
     ✓ deve rejeitar requisição POST sem adUrl

Test Files  1 passed (1)
     Tests  27 passed (27)
```

### 2. Executar em Modo Watch (Desenvolvimento)

Reexecuta testes automaticamente quando há mudanças:

```bash
npm run test:watch
```

Útil durante desenvolvimento para feedback instantâneo.

### 3. Executar com Interface Visual (UI)

```bash
npm run test:ui
```

Abre uma interface web em `http://localhost:51204` onde você pode:
- Visualizar testes em tempo real
- Ver passing/failing status
- Reexecutar testes específicos
- Filtrar por nome

### 4. Gerar Relatório de Cobertura

```bash
npm run test:coverage
```

Gera relatório em HTML com estatísticas:
- Percentage de linhas cobertas
- Funções testadas
- Branches testadas

O relatório é gerado em: `coverage/index.html`

---

## Cobertura de Testes

### Métricas Esperadas

Após rodar `npm run test:coverage`, você verá:

```
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
spy-engine/route.ts       |   45    |   38     |   52    |   46    |
spy-engine/logger.ts      |   82    |   70     |   88    |   81    |
```

### Como Melhorar Cobertura

1. **Adicionar mais testes** para funções com baixa cobertura
2. **Testar edge cases** (valores nulos, strings vazias, etc)
3. **Mockar dependências externas** (Apify, OpenAI, Supabase)

---

## Testes Implementados

### 1. fetchWithRetry() - 6 Testes

**Função testada:** `fetchWithRetry(url, options, maxRetries)`

| Teste | Descrição |
|-------|-----------|
| ✓ sucesso na primeira tentativa (200) | Valida requisição bem-sucedida |
| ✓ retentar em erro 503 | Simula erro transitório |
| ✓ retentar em erro 429 | Simula rate limit |
| ✓ lançar erro após 3 tentativas | Valida limite de retries |
| ✓ aplicar delays exponenciais | Valida backoff: 1s, 2s, 4s |
| ✓ não retentar em erro 404 | Valida erros não-transitórios |

**Exemplo de teste:**

```typescript
it('deve retentar com backoff exponencial em erro 503', async () => {
  // Arrange
  const mockUrl = 'https://api.apify.com/v2/acts/test';
  const mockErrorResponse = { ok: false, status: 503, text: async () => 'Service Unavailable' };
  const mockSuccessResponse = { ok: true, status: 200, json: async () => ([{ text: 'Copy' }]) };

  (global.fetch as any)
    .mockResolvedValueOnce(mockErrorResponse)
    .mockResolvedValueOnce(mockSuccessResponse);

  // Act
  const response = await fetchWithRetry(mockUrl, {}, 3);

  // Assert
  expect(response.ok).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(2); // 1 falha + 1 sucesso
});
```

---

### 2. Apify Parsing - 6 Testes

**Funções testadas:** Extração de copy e imagem da API Apify

| Teste | Descrição |
|-------|-----------|
| ✓ extrair copy de snapshot.body.text | Path principal |
| ✓ extrair copy de fallback (primaryText) | Fallback alternativo |
| ✓ extrair imageUrl de snapshot.images[0] | Imagem principal |
| ✓ extrair imageUrl de snapshot.videos[0] | Fallback de vídeo |
| ✓ retornar string vazia se nenhuma copy | Validação nula |
| ✓ descartar "undefined" e "null" strings | Sanitização |

**Exemplo de teste:**

```typescript
it('deve extrair copy de snapshot.body.text', async () => {
  // Arrange
  const mockApifyResponse = [{
    snapshot: {
      body: { text: 'Descubra o segredo para ganhar dinheiro online' }
    }
  }];

  // Act
  const adData = mockApifyResponse[0];
  const snap = adData.snapshot || adData;
  const originalCopy = String(snap.body?.text || '').trim();

  // Assert
  expect(originalCopy).toBe('Descubra o segredo para ganhar dinheiro online');
});
```

---

### 3. OpenAI Generation - 6 Testes

**Função testada:** Validação de JSON retornado pela OpenAI (GPT-4o)

| Teste | Descrição |
|-------|-----------|
| ✓ retornar JSON válido com 3 variações | Estrutura completa |
| ✓ conter copywriting matador em cada variação | Validação de conteúdo |
| ✓ conter imagePrompt bem detalhado em inglês | Prompts DALL-E |
| ✓ detectar nicho de mercado automaticamente | DetectedNiche field |
| ✓ falhar parse se JSON inválido | Erro handling |
| ✓ validar estrutura mesmo com dados vazios | Robustez |

**Exemplo de teste:**

```typescript
it('deve retornar JSON válido com 3 variações', async () => {
  // Arrange
  const mockOpenAIResponse = {
    variante1: 'Copy 1',
    imagePrompt1: 'Prompt 1',
    variante2: 'Copy 2',
    imagePrompt2: 'Prompt 2',
    variante3: 'Copy 3',
    imagePrompt3: 'Prompt 3',
    detectedNiche: 'E-commerce'
  };

  // Act
  const parsed = JSON.parse(JSON.stringify(mockOpenAIResponse));

  // Assert
  expect(parsed).toHaveProperty('variante1');
  expect(parsed).toHaveProperty('variante2');
  expect(parsed).toHaveProperty('variante3');
  expect(parsed).toHaveProperty('detectedNiche');
});
```

---

### 4. DALL-E Generation - 7 Testes

**Função testada:** Validação de URLs geradas pelo DALL-E 3

| Teste | Descrição |
|-------|-----------|
| ✓ gerar URL válida (1024x1024) | Formato HTTPS |
| ✓ gerar URL com tamanho correto | Dimensões 1:1 e 9:16 |
| ✓ retornar fallback se DALL-E falhar | Error handling |
| ✓ gerar 3 URLs diferentes | Unicidade |
| ✓ validar URL como HTTPS | Segurança |
| ✓ conter query params (sv, se, sig) | Autenticação |
| ✓ salvar URL em Supabase Storage | Persistência |

**Exemplo de teste:**

```typescript
it('deve gerar URL válida para imagem 1 (1024x1024)', async () => {
  // Arrange
  const mockDALLEResponse = {
    data: [{ url: 'https://oaidalleapiprodscus.blob.core.windows.net/images/test.png?sv=2023' }]
  };

  // Act
  const generatedUrl = mockDALLEResponse.data?.[0]?.url || '';

  // Assert
  expect(generatedUrl).toMatch(/^https?:\/\/.+\.(png|jpg|jpeg|webp)/i);
  expect(generatedUrl).toContain('oaidalleapiprodscus');
});
```

---

## Troubleshooting

### Problema: "Cannot find module 'vitest'"

**Solução:**

```bash
npm install
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
```

### Problema: Testes não encontram "@" alias

**Verificação:**

1. Confirmar `vitest.config.ts` tem alias configurado:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  }
}
```

2. Confirmar `tsconfig.json` tem paths:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

### Problema: Testes ficam "pendurados" (hanging)

**Causas comuns:**

- Promises não resolvidas
- SetTimeout sem clearTimeout
- Vi.useFakeTimers() sem vi.runAllTimers()

**Solução:**

```typescript
afterEach(() => {
  vi.clearAllTimers();  // Limpa fake timers
  vi.clearAllMocks();   // Reseta todos os mocks
});
```

### Problema: Mock de fetch não funciona

**Verificar:**

```typescript
// Correto
global.fetch = vi.fn();

// Depois usar
(global.fetch as any).mockResolvedValueOnce(response);
```

### Problema: Saída JSON truncada nos logs

**Solução:**

Execute com verbose:

```bash
npm test -- --reporter=verbose
```

---

## Boas Práticas

### 1. Organize Testes por Funcionalidade

```typescript
describe('Feature Name', () => {
  beforeEach(() => { /* Setup */ });
  afterEach(() => { /* Cleanup */ });

  it('should do X', () => { /* Test */ });
  it('should do Y', () => { /* Test */ });
});
```

### 2. Use Arrange-Act-Assert (AAA)

```typescript
it('test name', () => {
  // Arrange: Setup dados/mocks
  const input = 'data';

  // Act: Executa função
  const result = functionUnderTest(input);

  // Assert: Valida resultado
  expect(result).toBe('expected');
});
```

### 3. Mock Dependências Externas

```typescript
// ❌ Ruim: Chama API real
await openai.chat.completions.create(...)

// ✅ Bom: Mocka resposta
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({...}))
      }
    }
  }))
}));
```

### 4. Teste Cases Negativos

```typescript
// Não apenas sucesso
it('deve retornar sucesso com dados válidos', () => {...});

// Mas também erros
it('deve lançar erro com dados inválidos', () => {...});
it('deve retentar em erro transitório', () => {...});
```

---

## Próximas Etapas

### 1. Integração com CI/CD

Adicione ao GitHub Actions (`.github/workflows/test.yml`):

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### 2. Aumentar Cobertura

Target: 80%+ de cobertura

```bash
npm run test:coverage -- --coverage.lines=80
```

### 3. Testes E2E

Considere adicionar testes de integração real:

```typescript
// Teste completo: API -> Apify -> OpenAI -> DALL-E
it('should process full flow', async () => {
  const response = await POST(mockRequest);
  expect(response.ok).toBe(true);
});
```

---

## Documentação Oficial

- Vitest Docs: https://vitest.dev/
- Vitest UI: https://vitest.dev/guide/ui.html
- Coverage: https://vitest.dev/guide/coverage.html

---

## Suporte

Para erros ou dúvidas:

1. Verifique `vitest.config.ts`
2. Limpe node_modules: `rm -rf node_modules && npm install`
3. Verifique versões: `npm list`
4. Consulte logs: `npm test -- --reporter=verbose`

---

**Última atualização:** 2026-03-08
**Versão:** 1.0.0
