# Guia Completo: Validação de URL Facebook + Mecanismo de Refund

## 📋 Sumário

1. [Validação de URL Facebook](#validação-de-url-facebook)
2. [Mecanismo de Refund](#mecanismo-de-refund)
3. [Integração ao route.ts](#integração-ao-routets)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Testes e Casos de Teste](#testes-e-casos-de-teste)
6. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)

---

## Validação de URL Facebook

### Função: `validateFacebookAdUrl()`

Valida se uma URL pertence a domínios legítimos do Facebook.

```typescript
import { validateFacebookAdUrl } from './validation-refund';

const result = validateFacebookAdUrl('https://facebook.com/ads/library/123');
// { valid: true }

const result = validateFacebookAdUrl('https://malicious-facebook.com/');
// { valid: false, error: 'Domínio inválido...' }
```

### Domínios Aceitos

✅ **Válidos:**
- `facebook.com/ads/*`
- `ads.facebook.com/*`
- `business.facebook.com/*`
- `m.facebook.com/*`
- `www.facebook.com/*`

❌ **Inválidos:**
- `instagram.com/*`
- `tiktok.com/*`
- `malicious-facebook.com/*` (typosquatting)
- URLs malformadas sem protocolo

### Casos de Teste

```typescript
// ✅ CASOS VÁLIDOS
validateFacebookAdUrl('https://facebook.com/ads/library/123')
validateFacebookAdUrl('https://ads.facebook.com/manage/campaigns')
validateFacebookAdUrl('https://business.facebook.com/dashboard')
validateFacebookAdUrl('https://m.facebook.com/ads')
validateFacebookAdUrl('http://www.facebook.com/ads/library/123')
validateFacebookAdUrl('https://facebook.com/ads?param=value')

// ❌ CASOS INVÁLIDOS
validateFacebookAdUrl('') // Vazio
validateFacebookAdUrl(null) // Null
validateFacebookAdUrl('instagram.com/ads') // Domínio errado
validateFacebookAdUrl('malicious-facebook.com') // Typosquatting
validateFacebookAdUrl('facebook.com.evil.com') // Subdomain falso
validateFacebookAdUrl('not-a-url') // URL malformada
validateFacebookAdUrl('https://facebook.com/ads?redirect=http://evil.com') // Suspicious params
```

---

## Mecanismo de Refund

### Função: `refundCredits()`

Reembolsa créditos quando serviços falham criticamente.

```typescript
import { refundCredits } from './validation-refund';

const result = await refundCredits({
    userId: 'user_123',
    amount: 1,
    reason: 'APIFY_FAILURE',
    failureDetails: 'Apify falhou após 3 retries: timeout'
});

// Retorno:
// { success: true, newBalance: 6 }
// ou
// { success: false, error: 'Usuário não encontrado' }
```

### Razões de Refund

| Razão | Descrição | Créditos |
|-------|-----------|----------|
| `APIFY_FAILURE` | Apify falhou após 3 retries | 1 |
| `OPENAI_FAILURE` | OpenAI retornou erro crítico | 1 |
| `DALLE_FAILURE` | DALL-E indisponível ou erro | 1 |
| `MANUAL_REFUND` | Reembolso manual (admin) | N/A |

### Helpers Automáticos

```typescript
import {
    refundOnApifyFailure,
    refundOnOpenAIFailure,
    refundOnDALLEFailure
} from './validation-refund';

// Chamar em catch blocks:
try {
    await fetchWithRetry(url, options, 3);
} catch (error) {
    await refundOnApifyFailure(userId, error.message);
}

try {
    await openai.chat.completions.create({...});
} catch (error) {
    await refundOnOpenAIFailure(userId, error.message);
}

try {
    await openai.images.generate({...});
} catch (error) {
    await refundOnDALLEFailure(userId, error.message);
}
```

---

## Integração ao route.ts

### Passo 1: Importar as Funções

```typescript
// No topo de route.ts
import { validateFacebookAdUrl, refundOnApifyFailure, refundOnOpenAIFailure, refundOnDALLEFailure } from './validation-refund';
```

### Passo 2: Adicionar Validação (após linha ~125)

```typescript
const { adUrl, brandProfile } = await req.json();

if (!adUrl) {
    logger.error(STAGES.VALIDATION, 'URL do anúncio não fornecida');
    return NextResponse.json({ error: 'URL do anúncio não fornecida.' }, { status: 400 });
}

// ✅ NOVA VALIDAÇÃO
const urlValidation = validateFacebookAdUrl(adUrl);
if (!urlValidation.valid) {
    logger.error(STAGES.VALIDATION, 'URL inválida', { error: urlValidation.error });
    return NextResponse.json({
        error: 'URL inválida',
        details: urlValidation.error,
        acceptedDomains: [
            'facebook.com/ads/library/...',
            'ads.facebook.com/manage/...',
            'business.facebook.com/...',
            'm.facebook.com/...'
        ]
    }, { status: 400 });
}
```

### Passo 3: Adicionar Refund no Apify Catch (linha ~240)

```typescript
} catch (scraperError: any) {
    apifyErrorMessage = scraperError.message || String(scraperError);
    logger.endTimer('APIFY_EXTRACTION', STAGES.APIFY_FAIL);
    logger.error(STAGES.APIFY_FAIL, 'Erro na chamada Apify', scraperError);

    // ✅ REEMBOLSO AUTOMÁTICO
    if (user) {
        await refundOnApifyFailure(user.id, scraperError.message);
    }
}
```

### Passo 4: Adicionar Refund no OpenAI Catch (linha ~479)

```typescript
} catch (openaiError: any) {
    logger.error(STAGES.OPENAI_FAIL, 'Erro na chamada OpenAI', openaiError);

    // ✅ REEMBOLSO AUTOMÁTICO (exceto BYOK)
    if (user && !usingByok) {
        await refundOnOpenAIFailure(user.id, openaiError.message);
    }

    return NextResponse.json({
        success: true,
        originalAd: { copy: originalCopy, image: adImageUrl },
        generatedVariations: {
            variante1: `(ERRO NA OPENAI) ${openaiError.message}`,
            variante2: '(DICA) Verifique seu saldo de créditos na OpenAI',
            variante3: '(DEMO FUNCIONAL) Sistema está rodando normalmente'
        },
        logs: logger.exportAsJSON()
    });
}
```

### Passo 5: Adicionar Refund no DALL-E Catch (inside generateImageSafely)

```typescript
const generateImageSafely = async (
    prompt: string,
    fallbackUrl: string,
    targetSize: "1024x1024" | "1024x1792",
    imageNumber: number
) => {
    try {
        // ... código existente ...
    } catch (imgErr: any) {
        logger.error(STAGES.DALLE_FAIL, `Erro ao gerar imagem ${imageNumber}`, imgErr);

        // ✅ REEMBOLSO AUTOMÁTICO (apenas 1x, na primeira imagem)
        if (user && imageNumber === 1 && !usingByok) {
            await refundOnDALLEFailure(user.id, imgErr.message);
        }

        return fallbackUrl;
    }
};
```

---

## Exemplos de Uso

### Exemplo 1: Fluxo Completo com Validação e Refund

```typescript
// Frontend - Fazer requisição
const response = await fetch('/api/spy-engine', {
    method: 'POST',
    body: JSON.stringify({
        adUrl: 'https://facebook.com/ads/library/123456789',
        brandProfile: {
            companyName: 'Minha Empresa',
            niche: 'Emagrecimento',
            openaiKey: '' // Usar chave do servidor
        }
    })
});

// Se URL for inválida:
// Status: 400
// { error: 'URL inválida', details: 'Domínio inválido...', acceptedDomains: [...] }

// Se URL for válida mas Apify falhar:
// Status: 200 (sucesso)
// Crédito reembolsado automaticamente
// Fallback mock data retornado

// Se tudo funcionar:
// Status: 200
// Retorna 3 variações + 3 imagens geradas
```

### Exemplo 2: Verificação de Refund em Banco de Dados

```typescript
// Query para verificar histórico de refunds
SELECT * FROM supabase_logs
WHERE user_id = 'user_123'
AND event_type = 'CREDIT_REFUND'
ORDER BY timestamp DESC;

// Retorno esperado:
// {
//   user_id: 'user_123',
//   event_type: 'CREDIT_REFUND',
//   reason: 'APIFY_FAILURE',
//   amount: 1,
//   previous_balance: 4,
//   new_balance: 5,
//   failure_details: 'Apify falhou após 3 retries: timeout',
//   timestamp: '2026-03-08T14:35:00Z'
// }
```

### Exemplo 3: Teste Manual com cURL

```bash
# ✅ Teste com URL válida
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "https://facebook.com/ads/library/123456789",
    "brandProfile": { "companyName": "Test Co" }
  }'

# ❌ Teste com URL inválida
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "https://instagram.com/123456789",
    "brandProfile": {}
  }'
# Response:
# { "error": "URL inválida", "details": "Domínio inválido...", "acceptedDomains": [...] }

# ❌ Teste com URL malformada
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "not-a-valid-url",
    "brandProfile": {}
  }'
# Response:
# { "error": "URL inválida", "details": "URL malformada..." }
```

---

## Testes e Casos de Teste

### Teste Unitário: validateFacebookAdUrl()

```typescript
import { validateFacebookAdUrl } from './validation-refund';

describe('validateFacebookAdUrl', () => {
    it('deve aceitar URLs do Facebook válidas', () => {
        const urls = [
            'https://facebook.com/ads/library/123',
            'https://ads.facebook.com/manage/campaigns',
            'https://business.facebook.com/dashboard',
            'https://m.facebook.com/ads'
        ];

        urls.forEach(url => {
            const result = validateFacebookAdUrl(url);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });

    it('deve rejeitar URLs de outros domínios', () => {
        const urls = [
            'https://instagram.com/ads',
            'https://tiktok.com/ads',
            'https://malicious-facebook.com/',
            'https://facebook.com.evil.com/'
        ];

        urls.forEach(url => {
            const result = validateFacebookAdUrl(url);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    it('deve rejeitar URLs malformadas', () => {
        const urls = ['', null, 'not-a-url', undefined];

        urls.forEach(url => {
            const result = validateFacebookAdUrl(url as string);
            expect(result.valid).toBe(false);
        });
    });

    it('deve rejeitar URLs com parâmetros suspeitos', () => {
        const result = validateFacebookAdUrl(
            'https://facebook.com/ads?redirect=http://evil.com'
        );
        expect(result.valid).toBe(false);
    });
});
```

### Teste Unitário: refundCredits()

```typescript
import { refundCredits } from './validation-refund';

describe('refundCredits', () => {
    it('deve reembolsar créditos com sucesso', async () => {
        const result = await refundCredits({
            userId: 'test_user_123',
            amount: 1,
            reason: 'APIFY_FAILURE',
            failureDetails: 'Timeout'
        });

        expect(result.success).toBe(true);
        expect(result.newBalance).toBeGreaterThan(0);
    });

    it('deve registrar em supabase_logs', async () => {
        const userId = 'test_user_456';
        await refundCredits({
            userId,
            amount: 2,
            reason: 'MANUAL_REFUND',
            failureDetails: 'Admin refund'
        });

        // Verificar se foi logado
        const logs = await supabase
            .from('supabase_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('event_type', 'CREDIT_REFUND');

        expect(logs.data?.length).toBeGreaterThan(0);
    });

    it('deve rejeitar userId inválido', async () => {
        const result = await refundCredits({
            userId: '',
            amount: 1,
            reason: 'APIFY_FAILURE'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('deve rejeitar amount <= 0', async () => {
        const result = await refundCredits({
            userId: 'user_123',
            amount: 0,
            reason: 'APIFY_FAILURE'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
```

### Teste de Integração: Fluxo Completo

```typescript
describe('POST /api/spy-engine - Com Validação e Refund', () => {
    it('deve rejeitar URL inválida com status 400', async () => {
        const response = await fetch('/api/spy-engine', {
            method: 'POST',
            body: JSON.stringify({
                adUrl: 'https://instagram.com/ads',
                brandProfile: {}
            })
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toBe('URL inválida');
    });

    it('deve reembolsar crédito se Apify falhar', async () => {
        // Mock Apify para falhar
        const userId = 'test_user_789';
        const initialCredits = 5;

        // Fazer requisição
        const response = await fetch('/api/spy-engine', {
            method: 'POST',
            body: JSON.stringify({
                adUrl: 'https://facebook.com/ads/invalid',
                brandProfile: {}
            })
        });

        // Verificar se crédito foi reembolsado
        const logs = await supabase
            .from('supabase_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('reason', 'APIFY_FAILURE');

        expect(logs.data?.length).toBeGreaterThan(0);
    });

    it('deve processar URL válida com sucesso', async () => {
        const response = await fetch('/api/spy-engine', {
            method: 'POST',
            body: JSON.stringify({
                adUrl: 'https://facebook.com/ads/library/123456789',
                brandProfile: { companyName: 'Test' }
            })
        });

        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.generatedVariations).toBeDefined();
    });
});
```

---

## Estrutura de Banco de Dados

### Tabela: supabase_logs (Deve Existir)

```sql
CREATE TABLE supabase_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    reason VARCHAR(100),
    amount INTEGER,
    previous_balance INTEGER,
    new_balance INTEGER,
    failure_details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_logs_user_id ON supabase_logs(user_id);
CREATE INDEX idx_logs_event_type ON supabase_logs(event_type);
CREATE INDEX idx_logs_timestamp ON supabase_logs(timestamp);
```

### Tabela: spybot_subscriptions (Atualizar)

```sql
-- Verifique se a coluna credits existe
ALTER TABLE spybot_subscriptions
ADD COLUMN credits INTEGER DEFAULT 5;

-- Ou crie a tabela se não existir
CREATE TABLE spybot_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    plan VARCHAR(20) DEFAULT 'gratis',
    credits INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

---

## Resumo da Implementação

| Item | Arquivo | Status |
|------|---------|--------|
| Validação Facebook | `validation-refund.ts` | ✅ Pronto |
| Refund Automático | `validation-refund.ts` | ✅ Pronto |
| Integração route.ts | `route-updated-example.ts` | 📖 Exemplo |
| Testes Unitários | Este guia | 📋 Casos |
| Banco de Dados | Este guia | 📋 SQL |

---

## Checklist de Deploy

- [ ] Criar tabela `supabase_logs` no banco
- [ ] Adicionar coluna `credits` em `spybot_subscriptions`
- [ ] Importar funções em `route.ts`
- [ ] Adicionar validação de URL (Passo 2)
- [ ] Adicionar refund em Apify catch (Passo 3)
- [ ] Adicionar refund em OpenAI catch (Passo 4)
- [ ] Adicionar refund em DALL-E catch (Passo 5)
- [ ] Testar com URLs válidas/inválidas
- [ ] Verificar logs em supabase_logs
- [ ] Deploy em staging
- [ ] Deploy em produção
