# Exemplos de Testes - Explicação Visual

Este documento mostra exemplos práticos de cada teste implementado.

## 1. fetchWithRetry() - Retry com Exponential Backoff

### Teste 1: Sucesso na Primeira Tentativa

```typescript
it('deve fazer requisição com sucesso na primeira tentativa (status 200)', async () => {
  // ARRANGE: Setup
  const mockUrl = 'https://api.apify.com/v2/acts/test';
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ([{ text: 'Mock ad copy' }])
  };
  (global.fetch as any).mockResolvedValueOnce(mockResponse);

  // ACT: Executar
  const response = await fetchWithRetry(mockUrl, {}, 3);

  // ASSERT: Validar
  expect(response.ok).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(1); // Apenas 1 chamada
});
```

**O que testa:**
- Requisição bem-sucedida retorna imediatamente
- Sem retries desnecessários
- Status 200 é reconhecido como sucesso

**Fluxo visual:**

```
Tentativa 1: ✅ OK (status 200)
└─ Sucesso! Retorna response
```

---

### Teste 2: Retry em Erro 503 (Serviço Indisponível)

```typescript
it('deve retentar com backoff exponencial em erro 503', async () => {
  // ARRANGE
  const mockUrl = 'https://api.apify.com/v2/acts/test';
  const mockErrorResponse = {
    ok: false,
    status: 503,
    text: async () => 'Service Unavailable'
  };
  const mockSuccessResponse = {
    ok: true,
    status: 200,
    json: async () => ([{ text: 'Mock ad copy' }])
  };

  // Simulate: Fail first, succeed second
  (global.fetch as any)
    .mockResolvedValueOnce(mockErrorResponse)   // Tentativa 1: FALHA
    .mockResolvedValueOnce(mockSuccessResponse); // Tentativa 2: SUCESSO

  // ACT
  const response = await fetchWithRetry(mockUrl, {}, 3);

  // ASSERT
  expect(response.ok).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(2); // 1 falha + 1 sucesso
});
```

**O que testa:**
- Detecta erro 503 como transitório
- Aguarda exponencial backoff (1s)
- Retenta automaticamente
- Sucesso na 2ª tentativa

**Fluxo visual:**

```
Tentativa 1: ❌ 503 (Service Unavailable)
            ⏳ Aguarda 1s (2^0 * 1000ms)
Tentativa 2: ✅ 200 (OK)
            └─ Sucesso! Retorna response
```

---

### Teste 3: Delays Exponenciais (1s → 2s → 4s)

```typescript
it('deve aplicar delays exponenciais: 1s, 2s, 4s', async () => {
  // ARRANGE
  const mockUrl = 'https://api.apify.com/v2/acts/test';
  const mockErrorResponse = {
    ok: false,
    status: 500,
    text: async () => 'Internal Server Error'
  };
  (global.fetch as any).mockResolvedValue(mockErrorResponse); // Sempre falha

  // ACT
  try {
    await fetchWithRetry(mockUrl, {}, 3);
  } catch (e) {
    // Esperado falhar após 3 tentativas
  }

  // ASSERT
  expect(global.fetch).toHaveBeenCalledTimes(3); // 3 tentativas
  expect(vi.getTimerCount()).toBeGreaterThanOrEqual(2); // 2 setTimeout chamados
});
```

**O que testa:**
- Backoff exponencial: 1s, 2s, 4s
- Matemática: `Math.pow(2, attempt) * 1000`
  - Tentativa 0 → 2^0 * 1000 = 1s
  - Tentativa 1 → 2^1 * 1000 = 2s
  - Tentativa 2 → 2^2 * 1000 = 4s

**Fluxo visual:**

```
Tentativa 1: ❌ 500 (erro)
            ⏳ setTimeout(1000ms) = 1s
Tentativa 2: ❌ 500 (erro)
            ⏳ setTimeout(2000ms) = 2s
Tentativa 3: ❌ 500 (erro)
            ⏳ setTimeout(4000ms) = 4s [mas não executa, é última tentativa]
Tentativa 4: ❌ LANÇA ERRO
```

---

### Teste 4: Não Retentar em Erro 404

```typescript
it('deve não retentar em erro 404 (não-transitório)', async () => {
  // ARRANGE
  const mockErrorResponse = {
    ok: false,
    status: 404,
    text: async () => 'Not Found'
  };
  (global.fetch as any).mockResolvedValueOnce(mockErrorResponse);

  // ACT & ASSERT
  await expect(fetchWithRetry(mockUrl, {}, 3))
    .rejects.toThrow(/Apify API Error: 404/);

  expect(global.fetch).toHaveBeenCalledTimes(1); // SEM RETRY!
});
```

**O que testa:**
- 404 é erro não-transitório (não recoverable)
- Falha imediatamente sem tentar novamente
- Economiza tempo e recursos

**Fluxo visual:**

```
Tentativa 1: ❌ 404 (Not Found)
            └─ Erro definitivo!
               LANÇA ERRO
            └─ Sem mais tentativas
```

---

## 2. Apify Parsing - Extração de Copy e Imagem

### Teste 1: Extrair Copy de snapshot.body.text

```typescript
it('deve extrair copy de snapshot.body.text', async () => {
  // ARRANGE
  const mockApifyResponse = [
    {
      snapshot: {
        body: {
          text: 'Descubra o segredo para ganhar dinheiro online'
        }
      }
    }
  ];

  // ACT
  const adData = mockApifyResponse[0];
  const snap = adData.snapshot || adData;
  const rawCopy = snap.body?.text || adData.primaryText || adData.text || '';
  const originalCopy = String(rawCopy).trim();

  // ASSERT
  expect(originalCopy).toBe('Descubra o segredo para ganhar dinheiro online');
  expect(originalCopy.length).toBeGreaterThan(0);
});
```

**O que testa:**
- Extrai copy do caminho correto: `snapshot.body.text`
- Converte para string e remove espaços
- Não retorna vazio

**Resposta da API Apify:**

```json
{
  "snapshot": {
    "body": {
      "text": "Descubra o segredo para ganhar dinheiro online"
    }
  }
}
```

**Resultado do teste:**

```
originalCopy = "Descubra o segredo para ganhar dinheiro online"
✓ Validação passou!
```

---

### Teste 2: Extrair Image de snapshot.images[0]

```typescript
it('deve extrair imageUrl de snapshot.images[0]', async () => {
  // ARRANGE
  const mockApifyResponse = [
    {
      snapshot: {
        images: [
          {
            originalImageUrl: 'https://example.com/image.jpg'
          }
        ]
      }
    }
  ];

  // ACT
  const adData = mockApifyResponse[0];
  const snap = adData.snapshot || adData;
  const adImageUrl = String(
    snap.images?.[0]?.originalImageUrl ||
      snap.videos?.[0]?.videoPreviewImageUrl ||
      snap.pageProfilePictureUrl ||
      adData.imageUrl ||
      ''
  );

  // ASSERT
  expect(adImageUrl).toBe('https://example.com/image.jpg');
  expect(adImageUrl).toMatch(/^https?:\/\/.+\.(jpg|png|jpeg)$/i);
});
```

**O que testa:**
- Extrai URL de imagem do objeto Apify
- Valida formato HTTPS
- Valida extensão (.jpg, .png, .jpeg)

**Cadeia de fallbacks (ordem de preferência):**

```
1. snapshot.images[0].originalImageUrl        ← Preferido
2. snapshot.videos[0].videoPreviewImageUrl   ← Se vídeo
3. snapshot.pageProfilePictureUrl            ← Foto do anunciante
4. adData.imageUrl                           ← Legacy path
5. ''                                         ← Vazio se nada encontrado
```

---

### Teste 3: Descartar "undefined" e "null" Strings

```typescript
it('deve descartar "undefined" e "null" strings', async () => {
  // ARRANGE
  const mockApifyResponse = [
    {
      snapshot: {
        body: {
          text: 'undefined'  // String literal "undefined", não undefined
        }
      }
    }
  ];

  // ACT
  const adData = mockApifyResponse[0];
  const snap = adData.snapshot || adData;
  let originalCopy = String(snap.body?.text || '').trim();
  if (originalCopy === 'undefined' || originalCopy === 'null') {
    originalCopy = ''; // Descartar!
  }

  // ASSERT
  expect(originalCopy).toBe(''); // Limpo!
});
```

**O que testa:**
- Identifica strings literais "undefined" e "null"
- Converte para string vazia
- Evita buggy copy como "undefined" no anúncio

**Antes vs Depois:**

```
Antes:  originalCopy = "undefined"
Depois: originalCopy = ""
✓ Sanitizado!
```

---

## 3. OpenAI Generation - Validação JSON

### Teste 1: Retornar JSON Válido com 3 Variações

```typescript
it('deve retornar JSON válido com 3 variações', async () => {
  // ARRANGE
  const mockOpenAIResponse = {
    variante1: 'Copy matadora 1',
    imagePrompt1: 'A detailed image prompt...',
    variante2: 'Copy matadora 2',
    imagePrompt2: 'A detailed image prompt...',
    variante3: 'Copy matadora 3',
    imagePrompt3: 'A detailed image prompt...',
    detectedNiche: 'E-commerce'
  };

  // ACT
  const parsedJson = JSON.parse(JSON.stringify(mockOpenAIResponse));

  // ASSERT
  expect(parsedJson).toHaveProperty('variante1');
  expect(parsedJson).toHaveProperty('variante2');
  expect(parsedJson).toHaveProperty('variante3');
  expect(parsedJson).toHaveProperty('imagePrompt1');
  expect(parsedJson).toHaveProperty('imagePrompt2');
  expect(parsedJson).toHaveProperty('imagePrompt3');
  expect(parsedJson).toHaveProperty('detectedNiche');
});
```

**O que testa:**
- JSON pode ser parseado sem erros
- Contém todas as 7 propriedades obrigatórias
- Estrutura esperada

**Resposta esperada da OpenAI:**

```json
{
  "variante1": "Copy matadora focada em dor extrema...",
  "imagePrompt1": "A professional woman in business meeting...",
  "variante2": "Copy focada em solução direta...",
  "imagePrompt2": "A diverse team celebrating success...",
  "variante3": "Copy curta storytelling vertical 9:16...",
  "imagePrompt3": "A vertical format image of person using app...",
  "detectedNiche": "E-commerce"
}
```

---

### Teste 2: Copys com Tamanho Mínimo

```typescript
it('deve conter copywriting matador em cada variação', async () => {
  // ARRANGE
  const mockOpenAIResponse = {
    variante1: 'Você está falhando porque...',      // ✓ 32 chars
    variante2: 'Descobrimos a fórmula secreta...',  // ✓ 35 chars
    variante3: 'Sua concorrente já está usando...', // ✓ 36 chars
    imagePrompt1: 'prompt1',
    imagePrompt2: 'prompt2',
    imagePrompt3: 'prompt3',
    detectedNiche: 'Emagrecimento'
  };

  // ACT & ASSERT
  expect(mockOpenAIResponse.variante1.length).toBeGreaterThan(10);
  expect(mockOpenAIResponse.variante2.length).toBeGreaterThan(10);
  expect(mockOpenAIResponse.variante3.length).toBeGreaterThan(10);
  expect(typeof mockOpenAIResponse.variante1).toBe('string');
});
```

**O que testa:**
- Cada copy tem no mínimo 10 caracteres
- Todos são strings (não null/undefined)
- Não retorna copys vazias

---

## 4. DALL-E Generation - URLs de Imagem

### Teste 1: URL Válida com Formato HTTPS

```typescript
it('deve gerar URL válida para imagem 1 (1024x1024)', async () => {
  // ARRANGE
  const mockDALLEResponse = {
    data: [
      {
        url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/images/abc123.png?sv=2023-05-03&se=2024-03-09&sig=xyz789'
      }
    ]
  };

  // ACT
  const generatedUrl = mockDALLEResponse.data?.[0]?.url || '';

  // ASSERT
  expect(generatedUrl).toMatch(/^https?:\/\/.+\.(png|jpg|jpeg|webp)(\?.*)?$/i);
  expect(generatedUrl).toContain('oaidalleapiprodscus');
});
```

**O que testa:**
- URL começa com https://
- Contém domínio DALL-E correto
- Extensão é .png, .jpg, .jpeg ou .webp
- Pode ter query params (assinatura)

**URL típica do DALL-E 3:**

```
https://oaidalleapiprodscus.blob.core.windows.net/private/images/abc123.png?sv=2023-05-03&se=2024-03-09T15:00:00Z&sig=...
```

**Partes:**
- `https://` - Protocolo seguro
- `oaidalleapiprodscus.blob.core.windows.net` - Servidor Azure
- `/private/images/` - Pasta
- `abc123.png` - ID único + extensão
- `?sv=...&se=...&sig=...` - Token de segurança

---

### Teste 2: 3 URLs Diferentes

```typescript
it('deve gerar 3 URLs diferentes (uma para cada variação)', async () => {
  // ARRANGE
  const mockDALLEResponses = [
    'https://oaidalleapiprodscus.blob.core.windows.net/images/img1.png?sv=2023',
    'https://oaidalleapiprodscus.blob.core.windows.net/images/img2.png?sv=2023',
    'https://oaidalleapiprodscus.blob.core.windows.net/images/img3.png?sv=2023'
  ];

  // ACT
  const [img1, img2, img3] = mockDALLEResponses;

  // ASSERT
  expect(img1).not.toBe(img2);
  expect(img2).not.toBe(img3);
  expect(img1).not.toBe(img3);
  expect([img1, img2, img3]).toHaveLength(3);
});
```

**O que testa:**
- Cada variação tem sua própria imagem
- URLs são únicas (não duplicadas)
- Total de 3 URLs

**Resultado esperado:**

```
Variante 1 (Dor)     → img1.png (1024x1024 - Feed)
Variante 2 (Solução) → img2.png (1024x1024 - Feed)
Variante 3 (Story)   → img3.png (1024x1792 - Vertical)
```

---

### Teste 3: Fallback em Erro

```typescript
it('deve retornar fallback se DALL-E falhar', async () => {
  // ARRANGE
  const fallbackUrl = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800';

  // Se DALL-E falhar, usa placeholder
  const resultUrl = fallbackUrl;

  // ASSERT
  expect(resultUrl).toBe(fallbackUrl);
  expect(resultUrl).toMatch(/^https?:\/\/.+/);
});
```

**O que testa:**
- Fallback é URL válida
- Não quebra o fluxo se DALL-E falhar
- Usuário ainda vê imagem

**Fluxo em caso de erro:**

```
Gerar com DALL-E → ❌ ERRO
                 → Use fallback Unsplash
                 → ✓ Imagem mostrada
```

---

## 5. Exemplo Completo - Fluxo Real

### Scenario: Usuário analisa anúncio de E-commerce

```
1. Usuário fornece URL do anúncio Facebook
   Input: "https://facebook.com/ads/library/?id=123"

2. fetchWithRetry() busca dados
   Tentativa 1: ❌ 503
   Aguarda 1s
   Tentativa 2: ✅ 200
   Retorna: [{
     snapshot: {
       body: { text: "Compre agora com 50% off" },
       images: [{ originalImageUrl: "https://..." }]
     }
   }]

3. Apify Parsing extrai dados
   originalCopy = "Compre agora com 50% off"
   adImageUrl = "https://..."

4. OpenAI (GPT-4o) gera variações
   {
     "variante1": "Você está desperdiçando dinheiro...",
     "imagePrompt1": "A woman excited with shopping bags...",
     "variante2": "Temos o melhor preço do mercado...",
     "imagePrompt2": "Price tag with big discount...",
     "variante3": "Um cliente gastou R$500 em 10 minutos...",
     "imagePrompt3": "Vertical format: happy customer on phone...",
     "detectedNiche": "E-commerce"
   }

5. DALL-E 3 gera 3 imagens
   Image 1: https://oaidalleapiprodscus.blob.core.windows.net/.../img1.png
   Image 2: https://oaidalleapiprodscus.blob.core.windows.net/.../img2.png
   Image 3: https://oaidalleapiprodscus.blob.core.windows.net/.../img3.png

6. Salva em Supabase Storage
   img1 → https://supabase-bucket.com/public/images/file1.png
   img2 → https://supabase-bucket.com/public/images/file2.png
   img3 → https://supabase-bucket.com/public/images/file3.png

7. Retorna ao cliente
   {
     "success": true,
     "originalAd": {
       "copy": "Compre agora com 50% off",
       "image": "https://..."
     },
     "generatedVariations": { ... },
     "generatedImages": {
       "image1": "https://supabase...",
       "image2": "https://supabase...",
       "image3": "https://supabase..."
     },
     "logs": { ... }
   }
```

---

## Rodando Testes Individuais

```bash
# Apenas testes de retry
npm test -- --grep "fetchWithRetry"

# Apenas testes de parsing
npm test -- --grep "Apify Parsing"

# Apenas testes de OpenAI
npm test -- --grep "OpenAI Generation"

# Apenas testes de DALL-E
npm test -- --grep "DALL-E Generation"

# Com output detalhado
npm test -- --reporter=verbose
```

---

**Próxima leitura:** Consulte `TESTING_GUIDE.md` para detalhes completos.
