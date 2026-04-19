# Testes Unitários - Spy-Engine

Sumário rápido de como rodar os testes criados.

## Instalação Rápida

```bash
# 1. Instalar dependências
npm install

# 2. Rodar testes
npm test
```

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm test` | Executa todos os testes uma vez |
| `npm run test:watch` | Modo watch - reexecuta em mudanças |
| `npm run test:ui` | Interface gráfica interativa |
| `npm run test:coverage` | Gera relatório de cobertura (HTML) |

## Arquivos Criados

### Core

1. **`src/app/api/spy-engine/route.test.ts`** (27 testes)
   - Testa `fetchWithRetry()` com 3 tentativas
   - Testa parsing de Apify (copy + imagem)
   - Testa estrutura JSON da OpenAI
   - Testa geração de URLs DALL-E

2. **`vitest.config.ts`**
   - Configuração do Vitest (framework recomendado)

3. **`jest.config.js`**
   - Configuração alternativa (Jest) se preferir

### Documentação

4. **`TESTING_GUIDE.md`** (Detalhado)
   - Setup completo
   - Descrição de cada teste
   - Troubleshooting
   - Boas práticas

5. **`README_TESTS.md`** (Este arquivo)
   - Sumário rápido

### Package.json Atualizado

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:watch": "vitest --watch"
}
```

## Testes Implementados (27 total)

### 1. fetchWithRetry() - 6 testes

```javascript
✓ deve fazer requisição com sucesso na primeira tentativa (status 200)
✓ deve retentar com backoff exponencial em erro 503
✓ deve retentar em erro 429 (rate limit)
✓ deve lançar erro após 3 tentativas falhadas
✓ deve aplicar delays exponenciais: 1s, 2s, 4s
✓ deve não retentar em erro 404 (não-transitório)
```

### 2. Apify Parsing - 6 testes

```javascript
✓ deve extrair copy de snapshot.body.text
✓ deve extrair copy de fallback (primaryText)
✓ deve extrair imageUrl de snapshot.images[0]
✓ deve extrair imageUrl de snapshot.videos[0] se imagem não existir
✓ deve retornar string vazia se nenhuma copy disponível
✓ deve descartar "undefined" e "null" strings
```

### 3. OpenAI Generation - 6 testes

```javascript
✓ deve retornar JSON válido com 3 variações
✓ deve conter copywriting matador em cada variação
✓ deve conter imagePrompt bem detalhado em inglês
✓ deve detectar nicho de mercado automaticamente
✓ deve falhar parse se JSON inválido
✓ deve validar estrutura mesmo com dados vazios
```

### 4. DALL-E Generation - 7 testes

```javascript
✓ deve gerar URL válida para imagem 1 (1024x1024 - Feed Quadrado)
✓ deve gerar URL com tamanho 1024x1024 para primeira variação
✓ deve retornar fallback se DALL-E falhar
✓ deve gerar 3 URLs diferentes (uma para cada variação)
✓ deve validar URL como HTTPS
✓ deve conter query params de segurança (sv, se, sig)
✓ deve salvar URL em Supabase Storage após geração
```

### 5. Integração - 2 testes

```javascript
✓ deve processar requisição POST com URL válida
✓ deve rejeitar requisição POST sem adUrl
```

## Exemplo de Execução

```bash
$ npm test

 ✓ src/app/api/spy-engine/route.test.ts (27)

Test Files  1 passed (1)
     Tests  27 passed (27)
  Start at  14:35:22
  Duration  2.34s
```

## Mocks Implementados

O arquivo de teste mocka:

- **Fetch Global** - Simula requisições HTTP
- **OpenAI SDK** - Simula resposta do GPT-4o
- **Supabase** - Simula cliente database + storage
- **Fake Timers** - Simula delays de retry sem esperar 10s

## Próximas Etapas

1. **Instalar Vitest:**
   ```bash
   npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
   ```

2. **Rodar testes:**
   ```bash
   npm test
   ```

3. **Ver cobertura:**
   ```bash
   npm run test:coverage
   ```

4. **Modo development:**
   ```bash
   npm run test:watch
   ```

## Troubleshooting

### Erro: "Cannot find module 'vitest'"

```bash
npm install
```

### Testes "pendurados"

Verifique `afterEach`:

```typescript
afterEach(() => {
  vi.clearAllTimers();  // Importante!
  vi.clearAllMocks();
});
```

### Ver detalhes de erro

```bash
npm test -- --reporter=verbose
```

## Documentação Completa

Para detalhes completos, leia `TESTING_GUIDE.md`:

```bash
cat TESTING_GUIDE.md
```

---

**Status:** 27/27 testes implementados ✅

**Última atualização:** 2026-03-08
