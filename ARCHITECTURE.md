# 🏗️ Arquitetura - Validação Facebook + Refund

## Fluxo Geral da Requisição

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
│  Usuário cola URL do anúncio Facebook                           │
│  POST /api/spy-engine { adUrl, brandProfile }                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDAÇÃO DE URL                              │
│  validateFacebookAdUrl(adUrl)                                   │
│  ├─ Valida se é string                                          │
│  ├─ Parse URL (verifica malformação)                            │
│  ├─ Whitelist de domínios (facebook.com, ads.facebook.com, ...) │
│  ├─ Detecta typosquatting (malicious-facebook.com)             │
│  └─ Rejeita parâmetros suspeitos (redirect, phishing, etc)     │
│                                                                  │
│  Retorna:                                                        │
│  ├─ { valid: true } ─────────────┐                              │
│  └─ { valid: false, error: "..." } ──┐                          │
└────────────────────────┬─────────────┴──────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼ (✅ VÁLIDA)             ▼ (❌ INVÁLIDA)
    ┌──────────────────┐    ┌──────────────────────┐
    │ Processa Request │    │ Retorna 400 Error    │
    │ - Billing check  │    │ - Mensagem clara     │
    │ - Apify call     │    │ - Domínios aceitos   │
    │ - OpenAI call    │    │ - Sem descontar $     │
    │ - DALL-E call    │    └──────────────────────┘
    └────────┬─────────┘
             │
    ┌────────┴────────────────────────────────────┐
    │                                             │
    ▼ (✅ SUCESSO)                 ▼ (❌ FALHA)
┌──────────────────┐     ┌────────────────────────┐
│ Retorna 200 OK   │     │ REFUND AUTOMÁTICO      │
│ - 3 variações    │     │ ┌──────────────────────┤
│ - 3 imagens      │     │ │ refundCredits()      │
│ - Crédito -1     │     │ │ ├─ Busca user em DB  │
│                  │     │ │ ├─ Registra em logs  │
└──────────────────┘     │ │ ├─ Atualiza saldo    │
                         │ │ └─ Retorna fallback  │
                         │ └──────────────────────┤
                         │ Tipo de Falha:         │
                         │ ├─ APIFY_FAILURE       │
                         │ ├─ OPENAI_FAILURE      │
                         │ └─ DALLE_FAILURE       │
                         └────────────────────────┘
```

---

## Arquitetura de Funções

```
validation-refund.ts
├── 1. validateFacebookAdUrl(adUrl)
│   ├─ Input: string (URL)
│   ├─ Output: { valid: boolean, error?: string }
│   └─ Ubicação: route.ts linha ~130
│
├── 2. refundCredits(options)
│   ├─ Input: { userId, amount, reason, failureDetails }
│   ├─ Output: { success: boolean, newBalance?, error? }
│   └─ Ubicação: route.ts linha ~240, ~479, ~367
│
├── 3. refundOnApifyFailure(userId, errorMessage)
│   ├─ Calls: refundCredits(..., 'APIFY_FAILURE')
│   └─ Ubicación: route.ts linha ~240
│
├── 4. refundOnOpenAIFailure(userId, errorMessage)
│   ├─ Calls: refundCredits(..., 'OPENAI_FAILURE')
│   └─ Ubicación: route.ts linha ~479
│
└── 5. refundOnDALLEFailure(userId, errorMessage)
    ├─ Calls: refundCredits(..., 'DALLE_FAILURE')
    └─ Ubicación: route.ts dentro generateImageSafely
```

---

## Fluxo de Validação Detalhado

```
Input: adUrl = "https://instagram.com/ads"

Step 1: Verificar tipo
  → typeof adUrl === 'string' ? ✅ SIM

Step 2: Trim espaços
  → adUrl = adUrl.trim()

Step 3: Parse URL
  try { new URL(adUrl) }
  → ✅ Success (URL válida)

Step 4: Extrair hostname
  → hostname = "instagram.com"

Step 5: Whitelist check
  validDomains = ['facebook.com', 'ads.facebook.com', ...]
  → hostname.endsWith('.facebook.com') ? ❌ NÃO

Step 6: Validação falha
  → return { valid: false, error: "Domínio inválido..." }

Output: { valid: false, error: "..." }
Status: 400 Bad Request
```

---

## Fluxo de Refund Detalhado

```
Input: { userId: "user_123", amount: 1, reason: 'APIFY_FAILURE' }

Step 1: Validar entrada
  → userId exists && typeof === 'string' ? ✅
  → amount > 0 ? ✅

Step 2: Conectar Supabase
  → supabase = createClient()

Step 3: Buscar usuário
  SELECT * FROM spybot_subscriptions
  WHERE user_id = 'user_123'
  → Found: { credits: 4, plan: 'gratis' } ✅

Step 4: Calcular novo saldo
  → newBalance = 4 + 1 = 5

Step 5: Registrar em logs
  INSERT INTO supabase_logs {
    user_id: 'user_123',
    event_type: 'CREDIT_REFUND',
    reason: 'APIFY_FAILURE',
    amount: 1,
    previous_balance: 4,
    new_balance: 5,
    timestamp: now()
  }
  → ✅ Logged

Step 6: Atualizar créditos
  UPDATE spybot_subscriptions
  SET credits = 5
  WHERE user_id = 'user_123'
  → ✅ Updated

Output: { success: true, newBalance: 5 }
```

---

## Estrutura de Dados

```
spybot_subscriptions (Existente)
├─ id (BIGSERIAL PRIMARY KEY)
├─ user_id (TEXT UNIQUE) ──┐
├─ plan (VARCHAR) ──┐      │
└─ credits (INTEGER) ──┐   │
                      │   │
                      │   │
supabase_logs (NOVA) │   │
├─ id (BIGSERIAL PRIMARY KEY)
├─ user_id (TEXT) ◄──┴──┘ FK
├─ event_type (VARCHAR) = 'CREDIT_REFUND'
├─ reason (VARCHAR) = 'APIFY_FAILURE' | 'OPENAI_FAILURE' | 'DALLE_FAILURE'
├─ amount (INTEGER)
├─ previous_balance (INTEGER)
├─ new_balance (INTEGER)
├─ failure_details (TEXT)
└─ timestamp (TIMESTAMP DEFAULT NOW())

Índices:
├─ PRIMARY KEY (id)
├─ INDEX (user_id) ────────── Para buscas por usuário
├─ INDEX (event_type) ─────── Para filtrar refunds
└─ INDEX (timestamp) ──────── Para buscas por data
```

---

## Integração no route.ts

```typescript
export async function POST(req: Request) {
    ┌─ LINHA ~1: Imports
    │  import { validateFacebookAdUrl, ... } from './validation-refund'
    │
    ├─ LINHA ~125: POST handler começa
    │  const { adUrl, brandProfile } = await req.json()
    │
    ├─ LINHA ~130: VALIDAÇÃO URL ⭐
    │  const urlValidation = validateFacebookAdUrl(adUrl)
    │  if (!urlValidation.valid) {
    │    return NextResponse.json({ error: ... }, { status: 400 })
    │  }
    │
    ├─ LINHA ~240: APIFY CALL + CATCH + REFUND ⭐
    │  try {
    │    const response = await fetchWithRetry(...)
    │  } catch (scraperError) {
    │    if (user) await refundOnApifyFailure(user.id, ...)
    │  }
    │
    ├─ LINHA ~303: OPENAI CALL
    │  ...
    │
    ├─ LINHA ~358: DALLE CALL + CATCH + REFUND ⭐
    │  try {
    │    const response = await openai.images.generate(...)
    │  } catch (imgErr) {
    │    if (user && imageNumber === 1) await refundOnDALLEFailure(...)
    │  }
    │
    ├─ LINHA ~479: OPENAI CATCH + REFUND ⭐
    │  } catch (openaiError) {
    │    if (user && !usingByok) await refundOnOpenAIFailure(...)
    │  }
    │
    └─ LINHA ~500: RETURN response
}
```

---

## Estados de Resposta

```
Request POST /api/spy-engine
│
├─ URL INVÁLIDA
│  ├─ Status: 400 Bad Request
│  ├─ Body: { error: "URL inválida", details: "..." }
│  └─ Credits: Não deduz (erro de validação)
│
├─ URL VÁLIDA → APIFY FALHA
│  ├─ Status: 200 OK (fallback)
│  ├─ Body: { success: true, originalAd: mockData, generatedVariations: mockData }
│  ├─ Refund: +1 crédito automático
│  └─ Log: supabase_logs com reason='APIFY_FAILURE'
│
├─ URL VÁLIDA → OPENAI FALHA
│  ├─ Status: 200 OK (graceful degradation)
│  ├─ Body: { success: true, originalAd: {...}, generatedVariations: { "variante1": "(ERRO)..." } }
│  ├─ Refund: +1 crédito automático (se !usingByok)
│  └─ Log: supabase_logs com reason='OPENAI_FAILURE'
│
├─ URL VÁLIDA → DALLE FALHA
│  ├─ Status: 200 OK (fallback images)
│  ├─ Body: { success: true, ..., generatedImages: [unsplash, unsplash, unsplash] }
│  ├─ Refund: +1 crédito automático
│  └─ Log: supabase_logs com reason='DALLE_FAILURE'
│
└─ URL VÁLIDA → TUDO SUCESSO ✅
   ├─ Status: 200 OK
   ├─ Body: { success: true, originalAd: {...}, generatedVariations: {...}, generatedImages: {...} }
   ├─ Credits: -1 (debitado normalmente)
   └─ Log: supabase_logs (não CREDIT_REFUND)
```

---

## Fluxo de Erro End-to-End

```
User Input: URL = "https://instagram.com/ads"
                            │
                            ▼
                    ┌──────────────────┐
                    │  POST /api/spy   │
                    │  (validate URL)  │
                    └────────┬─────────┘
                             │
                    ┌────────▼──────────┐
                    │ validateFacebook  │
                    │ AdUrl()           │
                    │ hostname check    │
                    │ → instagram.com   │
                    │ → Not in list     │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────────┐
                    │ return {              │
                    │   valid: false,       │
                    │   error: "Domínio..." │
                    │ }                     │
                    └────────┬──────────────┘
                             │
                    ┌────────▼──────────────┐
                    │ NextResponse.json({   │
                    │   error: "...",       │
                    │   details: "...",     │
                    │   acceptedDomains: []│
                    │ }, { status: 400 })   │
                    └────────┬──────────────┘
                             │
                    ┌────────▼──────────────┐
                    │ Frontend Error Page   │
                    │ Shows:                │
                    │ - Erro message        │
                    │ - Domínios aceitos    │
                    │ - No credit deducted  │
                    └───────────────────────┘
```

---

## Sequência de Chamadas de API

```
1. Frontend
   POST /api/spy-engine
   { adUrl, brandProfile }
       │
       ▼
2. Backend (route.ts)
   POST handler (line 119)
       │
       ├─ parseJSON
       │
       ├─ validateFacebookAdUrl() ◄─── [validation-refund.ts]
       │   return { valid: true|false }
       │
       ├─ (if valid)
       │   ├─ GET /auth/getUser (Supabase)
       │   ├─ SELECT spybot_subscriptions (Supabase)
       │   ├─ POST /v2/acts/.../run-sync (Apify)
       │   ├─ POST /v1/chat/completions (OpenAI)
       │   ├─ POST /v1/images/generations (DALL-E)
       │   └─ INSERT spybot_generations (Supabase)
       │
       └─ (on error)
           └─ refundCredits() ◄────── [validation-refund.ts]
               ├─ SELECT spybot_subscriptions
               ├─ INSERT supabase_logs
               └─ UPDATE spybot_subscriptions
       │
       ▼
3. Frontend
   Response { success, originalAd, generatedVariations, generatedImages, logs }
```

---

## Dependências e Integrações

```
validation-refund.ts
├─ Depends on:
│  ├─ @/utils/supabase/server (createClient)
│  ├─ ./logger (logger, STAGES)
│  └─ (no external packages)
│
├─ Used in:
│  ├─ route.ts (validação + refund)
│  ├─ validation-refund.test.ts (testes)
│  └─ (não é usado em outros lugares)
│
└─ Modifies:
   ├─ spybot_subscriptions (credits)
   └─ supabase_logs (insert refund records)
```

---

## Segurança - Defense in Depth

```
┌─────────────────────────────────────┐
│  Layer 1: INPUT VALIDATION          │
│  • Type check (string only)         │
│  • URL parse (malformed rejection)  │
│  • Whitelist (facebook.com only)    │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Layer 2: THREAT DETECTION          │
│  • Typosquatting (malicious-*)      │
│  • Suspicious params (redirect=)    │
│  • URL length limits                │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Layer 3: AUDITORIA                 │
│  • All requests logged              │
│  • All refunds tracked              │
│  • Timestamp on all records         │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Layer 4: ACCESS CONTROL            │
│  • RLS on spybot_subscriptions      │
│  • RLS on supabase_logs             │
│  • User-scoped queries              │
└─────────────────────────────────────┘
```

---

## Performance Considerations

```
Operation              Time (ms)   Notes
─────────────────────────────────────────
validateFacebookAdUrl  1-2        No DB call
refundCredits          50-100     Includes 2 DB queries
Apify extraction       10000-30000 External API
OpenAI call            5000-15000 External API
DALL-E generation      8000-20000 External API
─────────────────────────────────────────
Total (with refund)    ~51ms      Overhead
```

---

## Deployment Architecture

```
┌──────────────────┐
│   Vercel/Host    │
├──────────────────┤
│  Next.js Server  │
│  ├─ route.ts     │
│  └─ validation-  │
│      refund.ts   │
└────────┬─────────┘
         │
    ┌────┴─────┬───────────┬──────────┐
    │           │           │          │
    ▼           ▼           ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌───────┐
│Supabase│ │  Apify │ │ OpenAI   │ │DALL-E │
│  Auth  │ │   API  │ │   API    │ │ API   │
└────────┘ └────────┘ └──────────┘ └───────┘
    │
    └─────────────────┬────────────────┐
                      │                │
              ┌───────▼────────┐ ┌─────▼──────┐
              │spybot_subscr...│ │supabase_log│
              │  (credits)     │ │  (refunds) │
              └────────────────┘ └────────────┘
```

---

Este é o diagrama visual completo da arquitetura e fluxos de dados do sistema de validação e refund.
