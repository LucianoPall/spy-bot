# ⚡ Quick Reference - Validação + Refund

## 🎯 Copiar/Colar Rápido

### Import no route.ts
```typescript
import { validateFacebookAdUrl, refundOnApifyFailure, refundOnOpenAIFailure, refundOnDALLEFailure } from './validation-refund';
```

### Validação (logo após receber adUrl)
```typescript
const urlValidation = validateFacebookAdUrl(adUrl);
if (!urlValidation.valid) {
    return NextResponse.json({
        error: 'URL inválida',
        details: urlValidation.error,
        acceptedDomains: ['facebook.com/ads/library/...', 'ads.facebook.com/...', 'business.facebook.com/...', 'm.facebook.com/...']
    }, { status: 400 });
}
```

### Refund Apify (catch block ~line 240)
```typescript
} catch (scraperError: any) {
    if (user) await refundOnApifyFailure(user.id, scraperError.message);
}
```

### Refund OpenAI (catch block ~line 479)
```typescript
} catch (openaiError: any) {
    if (user && !usingByok) await refundOnOpenAIFailure(user.id, openaiError.message);
}
```

### Refund DALL-E (inside generateImageSafely catch)
```typescript
} catch (imgErr: any) {
    if (user && imageNumber === 1 && !usingByok) await refundOnDALLEFailure(user.id, imgErr.message);
}
```

---

## 🧪 Teste Rápido com cURL

### ✅ URL Válida
```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"https://facebook.com/ads/library/123","brandProfile":{}}'
```

### ❌ URL Inválida
```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"https://instagram.com/ads","brandProfile":{}}'
# Status: 400, error message
```

### ❌ URL Malformada
```bash
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"not-a-url","brandProfile":{}}'
# Status: 400, error message
```

---

## 📝 Domínios Aceitos

| Domínio | Exemplos |
|---------|----------|
| `facebook.com` | facebook.com/ads/library/* |
| `ads.facebook.com` | ads.facebook.com/manage/* |
| `business.facebook.com` | business.facebook.com/dashboard |
| `m.facebook.com` | m.facebook.com/ads |

---

## 🚫 URLs Rejeitadas

```
instagram.com
tiktok.com
twitter.com
malicious-facebook.com
fake-facebook.com
facebook.com.evil.com
not-a-url
```

---

## 💾 SQL Rápido

### Criar Tabela
```sql
CREATE TABLE supabase_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type VARCHAR(50),
    reason VARCHAR(100),
    amount INTEGER,
    previous_balance INTEGER,
    new_balance INTEGER,
    failure_details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_logs_user_id ON supabase_logs(user_id);
```

### Ver Refunds
```sql
SELECT * FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
ORDER BY timestamp DESC LIMIT 10;
```

### Ver por Razão
```sql
SELECT reason, COUNT(*) as count, SUM(amount) as total
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
GROUP BY reason;
```

---

## 🧪 Testes Rápidos

```bash
# Rodar testes
npm test -- validation-refund.test.ts

# Ver cobertura
npm test -- validation-refund.test.ts --coverage
```

---

## ❌ Erros Comuns

| Erro | Solução |
|------|---------|
| `Cannot find module 'validation-refund'` | Verificar caminho do import |
| `BILLING_REFUND não existe` | Adicionar stage ao logger.ts |
| `Table supabase_logs not found` | Criar tabela com SQL acima |
| `RLS policy violation` | Verificar RLS em tabela |

---

## 📊 Fluxo de Erro

```
URL inválida
    ↓
validateFacebookAdUrl() retorna { valid: false }
    ↓
Retorna 400 Bad Request
    ↓
Sem descontar crédito
```

```
Apify falha (3 retries)
    ↓
refundOnApifyFailure() chamado
    ↓
refundCredits() processa
    ↓
Log em supabase_logs
    ↓
Crédito reembolsado
    ↓
Fallback mock data retornado
```

---

## 🎯 Razões de Refund

| Razão | Quando | Créditos |
|-------|--------|----------|
| APIFY_FAILURE | Apify falha 3x | 1 |
| OPENAI_FAILURE | OpenAI erro | 1 |
| DALLE_FAILURE | DALL-E erro | 1 |
| MANUAL_REFUND | Admin refund | N/A |

---

## 🔍 Monitorar Produção

```sql
-- Taxa de refunds por hora
SELECT DATE_TRUNC('hour', timestamp) as hour,
       COUNT(*) as refund_count
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Top 5 usuários com mais refunds
SELECT user_id, COUNT(*) as refund_count, SUM(amount) as total
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
GROUP BY user_id
ORDER BY refund_count DESC LIMIT 5;
```

---

## 📌 Checklist Final

- [ ] Arquivo `validation-refund.ts` copiado
- [ ] Imports adicionados
- [ ] Validação de URL implementada
- [ ] 3 Refunds implementados
- [ ] Tabela `supabase_logs` criada
- [ ] Testes passando
- [ ] Staging ok
- [ ] Deploy produção

---

## 🆘 Problemas?

**Validação não funciona:**
```
1. Verificar import
2. Verificar logger.ts tem BILLING_REFUND
3. npm run dev
```

**Refund não processa:**
```
1. Verificar tabela supabase_logs existe
2. Verificar RLS configurado
3. Verificar user.id é válido
```

**Testes falhando:**
```
npm run clean
npm install
npm test
```

---

**⏱️ Tempo:** 30-45 minutos
**📁 Arquivos:** 5 novos arquivos
**🔧 Integração:** 4 pontos em route.ts
**✅ Status:** Pronto para produção
