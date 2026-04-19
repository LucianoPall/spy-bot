# Exemplos Práticos - Validação Facebook + Refund

## Índice
1. [Exemplos de cURL](#exemplos-de-curl)
2. [Exemplos TypeScript/JavaScript](#exemplos-typescriptjavascript)
3. [Fluxos Reais de Erro](#fluxos-reais-de-erro)
4. [Monitoramento em Produção](#monitoramento-em-produção)

---

## Exemplos de cURL

### 1. Teste com URL Válida (Sucesso)

```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "https://facebook.com/ads/library/123456789",
    "brandProfile": {
      "companyName": "My E-commerce Store",
      "niche": "Fashion",
      "targetAudience": "Mulheres 25-45",
      "toneOfVoice": "Casual e amigável"
    }
  }'

# Resposta Esperada (200 OK):
# {
#   "success": true,
#   "originalAd": { "copy": "...", "image": "..." },
#   "generatedVariations": {
#     "variante1": "Texto da variação 1...",
#     "imagePrompt1": "...",
#     "variante2": "...",
#     "imagePrompt2": "...",
#     "variante3": "...",
#     "imagePrompt3": "...",
#     "detectedNiche": "Fashion"
#   },
#   "generatedImages": {
#     "image1": "https://...",
#     "image2": "https://...",
#     "image3": "https://..."
#   },
#   "logs": { ... }
# }
```

### 2. Teste com URL Inválida (Instagram)

```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "https://instagram.com/ads/123456789",
    "brandProfile": {}
  }'

# Resposta Esperada (400 Bad Request):
# {
#   "error": "URL inválida",
#   "details": "Domínio inválido: \"instagram.com\". A URL deve pertencer a facebook.com, ads.facebook.com, business.facebook.com ou m.facebook.com.",
#   "acceptedDomains": [
#     "facebook.com/ads/library/...",
#     "ads.facebook.com/manage/...",
#     "business.facebook.com/...",
#     "m.facebook.com/..."
#   ]
# }
```

### 3. Teste com URL Malformada

```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "not-a-valid-url",
    "brandProfile": {}
  }'

# Resposta Esperada (400 Bad Request):
# {
#   "error": "URL inválida",
#   "details": "URL malformada: \"not-a-valid-url\". Certifique-se de incluir \"https://\" ou \"http://\".",
#   "acceptedDomains": [...]
# }
```

### 4. Teste com URL Suspeita (Typosquatting)

```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "https://malicious-facebook.com/ads",
    "brandProfile": {}
  }'

# Resposta Esperada (400 Bad Request):
# {
#   "error": "URL inválida",
#   "details": "Domínio inválido: \"malicious-facebook.com\". A URL deve pertencer a facebook.com...",
#   "acceptedDomains": [...]
# }
```

### 5. Teste com Parâmetros Suspeitos

```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{
    "adUrl": "https://facebook.com/ads?redirect=http://evil.com&malware=true",
    "brandProfile": {}
  }'

# Resposta Esperada (400 Bad Request):
# {
#   "error": "URL inválida",
#   "details": "URL contém parâmetros suspeitos. Certifique-se de que é uma URL legítima do Facebook Ads Library.",
#   "acceptedDomains": [...]
# }
```

### 6. Teste com Múltiplas URLs Válidas

```bash
# Teste 1: facebook.com
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl": "https://facebook.com/ads/library/123", "brandProfile": {}}'

# Teste 2: ads.facebook.com
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl": "https://ads.facebook.com/manage/campaigns", "brandProfile": {}}'

# Teste 3: business.facebook.com
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl": "https://business.facebook.com/dashboard", "brandProfile": {}}'

# Teste 4: m.facebook.com
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl": "https://m.facebook.com/ads/library", "brandProfile": {}}'
```

---

## Exemplos TypeScript/JavaScript

### 1. Cliente Frontend com Tratamento de Erro

```typescript
// pages/dashboard.tsx ou components/AdAnalyzer.tsx

import { useState } from 'react';

export function AdAnalyzer() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{ message: string; details?: string } | null>(null);
    const [results, setResults] = useState(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            // ✅ Validação Frontend (opcional, mas recomendado)
            const urlValidation = await fetch('/api/validate-url', {
                method: 'POST',
                body: JSON.stringify({ url })
            });

            if (!urlValidation.ok) {
                const validationError = await urlValidation.json();
                setError(validationError);
                setLoading(false);
                return;
            }

            // Fazer requisição ao spy-engine
            const response = await fetch('/api/spy-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adUrl: url,
                    brandProfile: {
                        companyName: localStorage.getItem('companyName'),
                        niche: localStorage.getItem('niche'),
                        targetAudience: localStorage.getItem('targetAudience'),
                        toneOfVoice: localStorage.getItem('toneOfVoice')
                    }
                })
            });

            // ❌ Erro 400: URL inválida
            if (response.status === 400) {
                const errorData = await response.json();
                setError({
                    message: errorData.error,
                    details: errorData.details
                });
                setLoading(false);
                return;
            }

            // ✅ Sucesso
            const data = await response.json();
            if (data.success) {
                setResults(data);
            } else {
                setError({ message: 'Erro ao processar a análise' });
            }
        } catch (err: any) {
            setError({ message: 'Erro de conexão: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Analisador de Anúncios Facebook</h1>

            <form onSubmit={handleAnalyze} className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Cole a URL do anúncio Facebook..."
                        className="flex-1 px-4 py-2 border rounded-lg"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                        {loading ? 'Analisando...' : 'Analisar'}
                    </button>
                </div>
            </form>

            {/* ❌ Mostrar erro com detalhes */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <h2 className="font-bold text-red-800 mb-2">{error.message}</h2>
                    {error.details && (
                        <p className="text-red-700 text-sm mb-4">{error.details}</p>
                    )}
                    <div className="bg-white p-3 rounded border border-red-100 text-xs">
                        <p className="font-semibold mb-2">URLs Aceitas:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <li>facebook.com/ads/library/...</li>
                            <li>ads.facebook.com/manage/...</li>
                            <li>business.facebook.com/...</li>
                            <li>m.facebook.com/...</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* ✅ Mostrar resultados */}
            {results && (
                <div className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h2 className="font-bold text-green-800 mb-3">✅ Análise Concluída</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="border rounded-lg p-4">
                                    <h3 className="font-bold mb-2">Variação {i}</h3>
                                    <p className="text-sm text-gray-700 mb-3">
                                        {results.generatedVariations[`variante${i}`]}
                                    </p>
                                    <img
                                        src={results.generatedImages[`image${i}`]}
                                        alt={`Imagem ${i}`}
                                        className="w-full rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

### 2. Teste Direto em Node.js

```typescript
// test-validation.ts - Execute com: npx ts-node test-validation.ts

import { validateFacebookAdUrl, refundCredits } from './validation-refund';

async function runTests() {
    console.log('='.repeat(60));
    console.log('TESTE: validateFacebookAdUrl()');
    console.log('='.repeat(60));

    const testUrls = [
        // ✅ Válidas
        { url: 'https://facebook.com/ads/library/123', expected: true },
        { url: 'https://ads.facebook.com/manage/campaigns', expected: true },
        { url: 'https://business.facebook.com/dashboard', expected: true },
        { url: 'https://m.facebook.com/ads', expected: true },

        // ❌ Inválidas
        { url: 'https://instagram.com/ads', expected: false },
        { url: 'https://tiktok.com/ads', expected: false },
        { url: 'not-a-url', expected: false },
        { url: 'https://malicious-facebook.com/', expected: false },
    ];

    for (const { url, expected } of testUrls) {
        const result = validateFacebookAdUrl(url);
        const status = result.valid === expected ? '✅' : '❌';
        console.log(`${status} ${url.substring(0, 50)}`);
        if (result.error) console.log(`   └─ ${result.error}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TESTE: refundCredits()');
    console.log('='.repeat(60));

    // Teste refund (requer banco de dados)
    try {
        const refundResult = await refundCredits({
            userId: 'test_user_123',
            amount: 1,
            reason: 'APIFY_FAILURE',
            failureDetails: 'Test refund'
        });

        if (refundResult.success) {
            console.log(`✅ Refund bem-sucedido. Novo saldo: ${refundResult.newBalance}`);
        } else {
            console.log(`❌ Refund falhou: ${refundResult.error}`);
        }
    } catch (err: any) {
        console.log(`⚠️  Não foi possível testar refund (banco indisponível): ${err.message}`);
    }
}

runTests();
```

---

## Fluxos Reais de Erro

### Fluxo 1: Usuário Tenta URL do Instagram

```
1️⃣ Frontend
   └─ Usuário copia URL: https://instagram.com/p/ABC123

2️⃣ Backend - Validação
   └─ validateFacebookAdUrl() retorna { valid: false, error: "Domínio inválido..." }

3️⃣ Response (400 Bad Request)
   {
     "error": "URL inválida",
     "details": "Domínio inválido: \"instagram.com\"...",
     "acceptedDomains": [...]
   }

4️⃣ Frontend - Tratamento
   └─ Mostra mensagem de erro ao usuário
   └─ Oferece dica sobre quais URLs são aceitas
   └─ Não desconta crédito (erro de validação, não processamento)
```

### Fluxo 2: Apify Falha Completamente

```
1️⃣ Frontend
   └─ Usuário envia: https://facebook.com/ads/library/123

2️⃣ Backend - Validação
   └─ ✅ URL é válida

3️⃣ Backend - Apify Call
   └─ fetchWithRetry tenta 3 vezes
   └─ Todas as tentativas falham com timeout
   └─ Lança erro: "Apify retornou status 503 após 3 tentativas"

4️⃣ Backend - Refund Automático (linha ~240)
   └─ await refundOnApifyFailure(user.id, error.message)
   └─ refundCredits() é chamado
   └─ Log registrado em supabase_logs:
      {
        event_type: 'CREDIT_REFUND',
        reason: 'APIFY_FAILURE',
        amount: 1,
        previous_balance: 4,
        new_balance: 5,
        failure_details: 'Apify falhou após 3 retries: timeout'
      }

5️⃣ Response (200 OK - Fallback ativado)
   {
     "success": true,
     "originalAd": {
       "copy": "[Mock data - Apify indisponível]",
       "image": "[Mock image]"
     },
     "generatedVariations": {
       "variante1": "Crédito foi reembolsado! Tente novamente.",
       ...
     }
   }

6️⃣ Frontend - Exibe
   └─ "A extração falhou, mas seu crédito foi reembolsado!"
   └─ Oferece opção de tentar novamente
```

### Fluxo 3: OpenAI Retorna Erro de Quota

```
1️⃣ Backend - OpenAI Call (linha ~303)
   └─ activeOpenaiClient.chat.completions.create({...})
   └─ Retorna erro: "You exceeded your current quota"

2️⃣ Backend - Catch Block (linha ~479)
   └─ openaiError capturado
   └─ Verifica se !usingByok (não tá usando chave customizada)
   └─ await refundOnOpenAIFailure(user.id, error.message)
   └─ Log registrado em supabase_logs

3️⃣ Response (200 OK - Graceful Fallback)
   {
     "success": true,
     "originalAd": {...},
     "generatedVariations": {
       "variante1": "(ERRO NA OPENAI) You exceeded your current quota",
       "variante2": "(DICA) Recarregue os créditos da OpenAI",
       "variante3": "(DEMO) Sistema funcionando normalmente"
     }
   }

4️⃣ User's Credits
   └─ -1 crédito reembolsado
   └─ Total: 5 créditos de volta
```

### Fluxo 4: DALL-E Indisponível

```
1️⃣ Backend - DALL-E Call (linha ~358)
   └─ activeOpenaiClient.images.generate({...})
   └─ Falha: "503 Service Unavailable"

2️⃣ Backend - generateImageSafely Catch (linha ~367)
   └─ imgErr capturado
   └─ Verifica se imageNumber === 1 (só reembolsa 1x)
   └─ await refundOnDALLEFailure(user.id, error.message)
   └─ Log registrado em supabase_logs
   └─ Retorna fallback image

3️⃣ Response (200 OK)
   {
     "success": true,
     "originalAd": {...},
     "generatedVariations": {...},
     "generatedImages": {
       "image1": "https://images.unsplash.com/photo-... (fallback)",
       "image2": "https://images.unsplash.com/photo-... (fallback)",
       "image3": "https://images.unsplash.com/photo-... (fallback)"
     }
   }

4️⃣ User's Credits
   └─ -1 crédito reembolsado
```

---

## Monitoramento em Produção

### SQL: Verificar Histórico de Refunds

```sql
-- Últimos 10 reembolsos
SELECT
    user_id,
    reason,
    amount,
    previous_balance,
    new_balance,
    timestamp
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
ORDER BY timestamp DESC
LIMIT 10;

-- Reembolsos por razão (hoje)
SELECT
    reason,
    COUNT(*) as count,
    SUM(amount) as total_refunded
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
AND DATE(timestamp) = CURRENT_DATE
GROUP BY reason
ORDER BY count DESC;

-- Usuários com mais refunds
SELECT
    user_id,
    COUNT(*) as refund_count,
    SUM(amount) as total_refunded,
    MAX(timestamp) as last_refund
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
GROUP BY user_id
ORDER BY refund_count DESC
LIMIT 20;

-- Rastrear padrões de falha
SELECT
    reason,
    failure_details,
    COUNT(*) as occurrences,
    MIN(timestamp) as first_occurrence,
    MAX(timestamp) as last_occurrence
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY reason, failure_details
ORDER BY occurrences DESC;
```

### Logs: Buscar Erros de Validação

```sql
-- URLs que falharam na validação (não processadas)
SELECT
    COUNT(*) as failed_attempts,
    DATE(created_at) as date
FROM request_logs
WHERE endpoint = '/api/spy-engine'
AND status_code = 400
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Domínios que tentaram acessar (não validadas)
SELECT
    SUBSTRING_INDEX(request_body, 'adUrl', -1) as attempted_domain,
    COUNT(*) as count
FROM request_logs
WHERE endpoint = '/api/spy-engine'
AND status_code = 400
GROUP BY attempted_domain
ORDER BY count DESC;
```

### Alertas Recomendados

```typescript
// Você pode adicionar triggers ou webhooks em:

// 1. Se refunds > 10 em uma hora
SELECT COUNT(*) FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
AND timestamp >= NOW() - INTERVAL 1 HOUR

// 2. Se APIFY_FAILURE > 50% dos requests
SELECT
    SUM(CASE WHEN reason = 'APIFY_FAILURE' THEN 1 ELSE 0 END) as apify_failures,
    COUNT(*) as total_failures,
    ROUND(100.0 * SUM(CASE WHEN reason = 'APIFY_FAILURE' THEN 1 ELSE 0 END) / COUNT(*), 2) as percentage
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
AND timestamp >= NOW() - INTERVAL 1 HOUR

// 3. Se validação falhar > 30% dos requests
SELECT
    COUNT(CASE WHEN status_code = 400 THEN 1 END) as validation_errors,
    COUNT(*) as total_requests,
    ROUND(100.0 * COUNT(CASE WHEN status_code = 400 THEN 1 END) / COUNT(*), 2) as error_rate
FROM request_logs
WHERE endpoint = '/api/spy-engine'
AND timestamp >= NOW() - INTERVAL 1 HOUR
```

---

## Resumo de Integração

| Fase | Função | Arquivo |
|------|--------|---------|
| 1. Validação | `validateFacebookAdUrl()` | validation-refund.ts |
| 2. Apify | `refundOnApifyFailure()` | route.ts (linha ~240) |
| 3. OpenAI | `refundOnOpenAIFailure()` | route.ts (linha ~479) |
| 4. DALL-E | `refundOnDALLEFailure()` | route.ts (dentro generateImageSafely) |
| 5. Auditoria | Registros em supabase_logs | Automático |

