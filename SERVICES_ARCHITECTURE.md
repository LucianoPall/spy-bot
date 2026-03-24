# 🏗️ Services Architecture — Fase 2.2 Completa

**Data:** 23/03/2026
**Status:** ✅ 5 Services Criados
**Próximo:** Refatorar route.ts para usar os services

---

## 📦 Os 5 Services Criados

### 1. **apify.service.ts**
Extração de dados do Facebook via Apify

**Funções:**
- `extractAdWithApify(adUrl, apifyToken)` → `ApifyExtractionResult`
- `isApifyExtractionValid(result)` → `boolean`

**Responsabilidades:**
- Construir payload Apify
- Chamar API com timeout (60s)
- Parsear resposta (copy + imagem)
- Tratar erros

**Exemplo:**
```typescript
const result = await extractAdWithApify(
  'https://facebook.com/ads/...',
  process.env.APIFY_API_TOKEN!
);

if (result.isError) {
  console.error(result.errorMessage);
} else {
  console.log(result.originalCopy, result.adImageUrl);
}
```

---

### 2. **openai.service.ts**
Geração de variações de copy com GPT-4o

**Funções:**
- `generateCopyVariations(client, copy, niche, context)` → `OpenAIGenerationResult`
- `isOpenAIGenerationValid(result)` → `boolean`

**Responsabilidades:**
- Construir prompts contextualizados
- Chamar GPT-4o com JSON mode
- Parsear resposta estruturada
- Gerar 3 variações + análise estratégica

**Exemplo:**
```typescript
const result = await generateCopyVariations(
  openaiClient,
  'Emagreça 10kg em 30 dias',
  'Emagrecimento',
  contextPrompt
);

console.log(result.variations.variante1);
console.log(result.strategicAnalysis.hook);
```

---

### 3. **dalle.service.ts**
Geração de 3 imagens com DALL-E

**Funções:**
- `generateImagesWithDALLE(client, niche, copy)` → `DALLEGenerationResult`
- `isDALLEGenerationValid(result)` → `boolean`

**Responsabilidades:**
- Gerar prompts customizados por nicho
- Chamar DALL-E em paralelo (3 imagens)
- Validar URLs (sem duplicatas)
- Fallback para stock images se erro

**Exemplo:**
```typescript
const result = await generateImagesWithDALLE(
  openaiClient,
  'Emagrecimento',
  variantCopy
);

console.log(result.images.image1); // Square
console.log(result.images.image2); // Square
console.log(result.images.image3); // Vertical (1024x1792)
```

---

### 4. **billing.service.ts**
Gerenciamento de créditos e planos

**Funções:**
- `loadUserBilling(supabase, userId, email, isAdmin)` → `UserBilling`
- `validateBillingAccess(billing, hasBYOK)` → `BillingCheckResult`
- `deductCredit(supabase, userId, plan, credits)` → `boolean`
- `formatBillingInfo(billing)` → `object`

**Responsabilidades:**
- Carregar/criar subscription padrão
- Validar se usuário pode usar serviço
- Deduzir créditos após sucesso
- Lidar com admin bypass

**Exemplo:**
```typescript
const billing = await loadUserBilling(
  supabase, user.id, user.email, isAdmin
);

const access = validateBillingAccess(billing, hasOpenAIKey);
if (!access.allowed) {
  return NextResponse.json({ error: access.reason }, { status: 403 });
}

// Depois de sucesso:
await deductCredit(supabase, user.id, billing.plan, billing.credits);
```

---

### 5. **storage.service.ts**
Upload de imagens para Supabase Storage

**Funções:**
- `uploadImageToSupabase(url, supabase, userId, number)` → `UploadResult`
- `isUploadValid(result)` → `boolean`
- `formatUploadResults(image1, image2, image3)` → `object`

**Responsabilidades:**
- Fazer download da imagem (com retry)
- Upload para Supabase Storage
- Gerar URL pública
- Fallback para URL original se erro

**Exemplo:**
```typescript
const result1 = await uploadImageToSupabase(
  dalleUrl,
  supabase,
  userId,
  1
);

console.log(result1.url);     // URL pública Supabase
console.log(result1.provider); // 'supabase' | 'dalle' | 'unsplash'
```

---

## 🔗 Como Usar nos Services

### Imports Limpos

```typescript
import {
  extractAdWithApify,
  generateCopyVariations,
  generateImagesWithDALLE,
  loadUserBilling,
  uploadImageToSupabase
} from '@/services';
```

### Pipeline Completo (Conceitual)

```typescript
// 1. Billing
const billing = await loadUserBilling(supabase, userId, email, isAdmin);
if (!validateBillingAccess(billing, hasBYOK).allowed) {
  return error403;
}

// 2. Apify
const apifyResult = await extractAdWithApify(adUrl, apifyToken);
if (apifyResult.isError) {
  // Fallback com mock data
  apifyResult = getMockAdData(adUrl, niche);
}

// 3. OpenAI
const openaiResult = await generateCopyVariations(
  openaiClient,
  apifyResult.originalCopy,
  niche,
  contextPrompt
);

// 4. DALL-E
const dalleResult = await generateImagesWithDALLE(
  openaiClient,
  niche,
  openaiResult.variations.variante1
);

// 5. Storage
const uploadResults = await Promise.all([
  uploadImageToSupabase(dalleResult.images.image1, supabase, userId, 1),
  uploadImageToSupabase(dalleResult.images.image2, supabase, userId, 2),
  uploadImageToSupabase(dalleResult.images.image3, supabase, userId, 3)
]);

// 6. Billing (deduct after success)
await deductCredit(supabase, userId, billing.plan, billing.credits);
```

---

## 📊 Benefícios da Arquitetura

| Antes | Depois |
|-------|--------|
| 1.539 linhas em `route.ts` | 5 arquivos com ~100-150 linhas cada |
| Lógica embutida | Services reutilizáveis |
| Difícil testar | Cada service testável isoladamente |
| Alta complexidade | Responsabilidades claras |
| Acoplamento forte | Baixo acoplamento |

---

## 🧪 Testabilidade

Cada service pode ser testado isoladamente:

```typescript
// Teste do Apify Service (sem chamar OpenAI/DALL-E)
describe('apify.service', () => {
  it('deve extrair copy e imagem', async () => {
    const result = await extractAdWithApify(
      mockAdUrl,
      mockToken
    );
    expect(result.isError).toBe(false);
    expect(result.originalCopy).toBeTruthy();
  });
});
```

---

## 🔐 Error Handling Consistente

Todos os services seguem padrão:

```typescript
return {
  data: actual_result,
  isError: false
};

// ou

return {
  data: fallback_result,
  isError: true,
  errorMessage: 'description'
};
```

---

## 📝 Próximo Passo

**Fase 2.3:** Refatorar `route.ts` para usar estes services

Esperado: `route.ts` passa de **1.539 → <300 linhas**

Será apenas:
1. Validação de entrada
2. Rate limiting check
3. Chamar services em sequência
4. Formatar resposta
5. Error handling principal

---

## 📍 Localização dos Services

```
src/
├── services/
│   ├── index.ts                 ← Barrel exports
│   ├── apify.service.ts         ← Extração
│   ├── openai.service.ts        ← Copy generation
│   ├── dalle.service.ts         ← Image generation
│   ├── billing.service.ts       ← Créditos
│   └── storage.service.ts       ← Upload
├── lib/
├── app/
│   └── api/
│       └── spy-engine/
│           └── route.ts         ← Será refatorado
```

---

**Status:** 5 services prontos, aguardando integração em route.ts 🚀
