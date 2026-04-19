# Checklist de Implementação - Validação Facebook + Refund

**Data de Início:** 2026-03-08
**Status:** 🟢 Código Pronto para Implementação
**Tempo Estimado:** 30-45 minutos

---

## 📦 Arquivos Criados

| Arquivo | Tipo | Status | Descrição |
|---------|------|--------|-----------|
| `src/app/api/spy-engine/validation-refund.ts` | ✅ Código | Pronto | Funções de validação e refund |
| `src/app/api/spy-engine/route-updated-example.ts` | 📖 Exemplo | Referência | Como integrar ao route.ts |
| `src/app/api/spy-engine/VALIDATION-REFUND-GUIDE.md` | 📚 Documentação | Completo | Guia detalhado com casos de teste |
| `src/app/api/spy-engine/validation-refund.test.ts` | 🧪 Testes | Pronto | Suite de testes unitários |
| `src/app/api/spy-engine/EXAMPLES.md` | 📋 Exemplos | Completo | cURL, TypeScript, fluxos reais |

---

## 🎯 Etapas de Implementação

### ETAPA 1: Preparar Banco de Dados (5-10 minutos)

- [ ] **1.1** Acessar Supabase Console
  - URL: https://app.supabase.com
  - Selecionar projeto: `aios-project`

- [ ] **1.2** Criar Tabela `supabase_logs`
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

  CREATE INDEX idx_logs_user_id ON supabase_logs(user_id);
  CREATE INDEX idx_logs_event_type ON supabase_logs(event_type);
  CREATE INDEX idx_logs_timestamp ON supabase_logs(timestamp);
  ```

- [ ] **1.3** Verificar/Adicionar coluna `credits` em `spybot_subscriptions`
  ```sql
  ALTER TABLE spybot_subscriptions
  ADD COLUMN credits INTEGER DEFAULT 5;
  ```

- [ ] **1.4** Verificar RLS (Row Level Security)
  - Confirmar que `spybot_subscriptions` tem RLS habilitado
  - Confirmar que `supabase_logs` tem RLS habilitado para escrita

---

### ETAPA 2: Copiar Arquivo de Funções (2 minutos)

- [ ] **2.1** Copiar `validation-refund.ts` para o projeto
  ```bash
  cp src/app/api/spy-engine/validation-refund.ts \
     C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web\src\app\api\spy-engine\
  ```

- [ ] **2.2** Verificar imports no arquivo
  ```typescript
  import { createClient } from '@/utils/supabase/server';
  import { logger, STAGES } from './logger';
  ```

---

### ETAPA 3: Integrar ao route.ts (15-20 minutos)

- [ ] **3.1** Importar funções no início de `route.ts`
  ```typescript
  import { validateFacebookAdUrl, refundOnApifyFailure, refundOnOpenAIFailure, refundOnDALLEFailure } from './validation-refund';
  ```

- [ ] **3.2** Adicionar validação de URL (após linha 130)
  ```typescript
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

- [ ] **3.3** Adicionar refund no catch de Apify (após linha 240)
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

- [ ] **3.4** Adicionar refund no catch de OpenAI (após linha 479)
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
              variante2: '(DICA) Verifique seu saldo em openai.com',
              variante3: '(DEMO) Sistema funcionando normalmente'
          },
          logs: logger.exportAsJSON()
      });
  }
  ```

- [ ] **3.5** Adicionar refund no catch de DALL-E (dentro `generateImageSafely`)
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

          // ✅ REEMBOLSO AUTOMÁTICO (apenas 1x)
          if (user && imageNumber === 1 && !usingByok) {
              await refundOnDALLEFailure(user.id, imgErr.message);
          }

          return fallbackUrl;
      }
  };
  ```

---

### ETAPA 4: Adicionar Stage ao Logger (2 minutos)

- [ ] **4.1** Verificar se `logger.ts` contém estes stages
  ```typescript
  BILLING_REFUND: 'BILLING_REFUND'  // ← Adicionar se não existir
  ```

- [ ] **4.2** Se não existir, adicionar em `src/app/api/spy-engine/logger.ts`
  ```typescript
  export const STAGES = {
      // ... outros stages ...
      BILLING_REFUND: 'BILLING_REFUND',
      // ...
  };
  ```

---

### ETAPA 5: Testar Localmente (10-15 minutos)

- [ ] **5.1** Iniciar servidor local
  ```bash
  npm run dev
  # ou
  yarn dev
  ```

- [ ] **5.2** Teste 1: URL Válida (Sucesso)
  ```bash
  curl -X POST http://localhost:3000/api/spy-engine \
    -H "Content-Type: application/json" \
    -d '{
      "adUrl": "https://facebook.com/ads/library/123456789",
      "brandProfile": { "companyName": "Test" }
    }'

  # Esperar: Status 200, response com sucesso
  ```

- [ ] **5.3** Teste 2: URL Instagram (Deve Rejeitar)
  ```bash
  curl -X POST http://localhost:3000/api/spy-engine \
    -H "Content-Type: application/json" \
    -d '{
      "adUrl": "https://instagram.com/ads/123456789",
      "brandProfile": {}
    }'

  # Esperar: Status 400, mensagem "URL inválida"
  ```

- [ ] **5.4** Teste 3: URL Malformada
  ```bash
  curl -X POST http://localhost:3000/api/spy-engine \
    -H "Content-Type: application/json" \
    -d '{
      "adUrl": "not-a-url",
      "brandProfile": {}
    }'

  # Esperar: Status 400, mensagem de URL malformada
  ```

- [ ] **5.5** Teste 4: Verificar Logs
  ```sql
  -- Acessar Supabase Console e executar:
  SELECT * FROM supabase_logs
  WHERE event_type = 'CREDIT_REFUND'
  ORDER BY timestamp DESC
  LIMIT 5;
  ```

---

### ETAPA 6: Testes Unitários (5 minutos)

- [ ] **6.1** Copiar arquivo de testes
  ```bash
  cp src/app/api/spy-engine/validation-refund.test.ts \
     C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web\src\app\api\spy-engine\
  ```

- [ ] **6.2** Executar testes
  ```bash
  npm test -- validation-refund.test.ts
  # ou
  jest validation-refund.test.ts
  ```

- [ ] **6.3** Verificar resultado
  - [ ] Todos os testes devem passar ✅
  - [ ] Coverage > 80%

---

### ETAPA 7: Verificação em Staging (5-10 minutos)

- [ ] **7.1** Fazer deploy em staging
  ```bash
  git add src/app/api/spy-engine/
  git commit -m "feat: Adiciona validação de URL Facebook e mecanismo de refund"
  git push origin main  # ou branch de staging
  ```

- [ ] **7.2** Testar em staging com cURL
  ```bash
  curl -X POST https://staging-yourapp.vercel.app/api/spy-engine \
    -H "Content-Type: application/json" \
    -d '{"adUrl": "https://instagram.com/ads", "brandProfile": {}}'
  ```

- [ ] **7.3** Monitorar Supabase Logs
  - Verificar se logs estão sendo criados
  - Verificar se refunds aparecem quando esperado

---

### ETAPA 8: Deploy em Produção (5 minutos)

- [ ] **8.1** Verificar checklist final
  - [ ] Todas as funções integradas
  - [ ] Todos os testes passando
  - [ ] Staging funcionando corretamente
  - [ ] Database migrations aplicadas

- [ ] **8.2** Fazer deploy
  ```bash
  # Se usar Vercel
  vercel deploy --prod

  # Se usar outro serviço, seguir seu processo
  ```

- [ ] **8.3** Monitorar produção
  - Primeira hora: Monitorar logs de erro
  - Verificar taxa de refunds
  - Verificar performance (latência adicional)

---

## 🔍 Testes Recomendados Post-Deploy

### Teste Manual 1: URL Válida com Sucesso
```bash
✅ Status: 200
✅ Crédito deduzido corretamente
✅ Resultado salvo em DB
```

### Teste Manual 2: URL Inválida (Instagram)
```bash
✅ Status: 400
✅ Mensagem clara ao usuário
✅ Nenhum crédito deduzido
```

### Teste Manual 3: Simular Falha Apify
```bash
# Modificar URL para forçar erro em Apify
✅ Refund automático processado
✅ Registrado em supabase_logs
✅ User vê fallback gracioso
```

### Teste Manual 4: Simular Falha OpenAI
```bash
# Usar chave OpenAI inválida
✅ Refund automático processado
✅ Registrado em supabase_logs
✅ User vê mensagem de erro clara
```

---

## 📊 Monitoramento em Produção

### Dashboard Recomendado (SQL)

```sql
-- Copiar e salvar como view em Supabase
CREATE VIEW refund_stats AS
SELECT
    DATE(timestamp) as date,
    COUNT(*) as total_refunds,
    reason,
    SUM(amount) as total_amount
FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
GROUP BY DATE(timestamp), reason
ORDER BY date DESC;

-- Usar em dashboard
SELECT * FROM refund_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, total_refunds DESC;
```

### Alertas Recomendados

- [ ] Se REFUND_RATE > 20% em 1 hora → Investigar Apify/OpenAI
- [ ] Se VALIDATION_ERROR_RATE > 30% em 1 hora → Verificar se há typosquatting
- [ ] Se USER tem > 5 refunds em 24h → Contactar user support

---

## 📝 Documentação

- [ ] **VALIDATION-REFUND-GUIDE.md** — Guia completo com SQL, casos de teste
- [ ] **EXAMPLES.md** — Exemplos de cURL, TypeScript, fluxos reais
- [ ] **validation-refund.test.ts** — Suite de testes unitários
- [ ] **route-updated-example.ts** — Exemplo de integração ao route.ts

---

## 🚨 Rollback Plan

Se precisar reverter a implementação:

```bash
# 1. Remover imports em route.ts
# 2. Remover chamadas de refund
# 3. Remover validação de URL

# 4. Opcional: Backup dos logs
SELECT * FROM supabase_logs
WHERE event_type = 'CREDIT_REFUND'
INTO OUTFILE '/backup/refund_logs_backup.csv';

# 5. Revert código
git revert HEAD~N
git push origin main
```

---

## ✅ Checklist Final Pré-Deploy

- [ ] Código compilado sem erros (`npm run build`)
- [ ] Testes passando (`npm test`)
- [ ] Staging testado e funcionando
- [ ] Database migrations aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] Logs de auditoria configurados
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

---

## 📞 Suporte

Se encontrar problemas:

1. **Validação não funciona:**
   - Verificar se `logger` está sendo importado corretamente
   - Verificar se stages incluem `BILLING_REFUND`

2. **Refund não processa:**
   - Verificar se `supabase_logs` existe
   - Verificar RLS em `spybot_subscriptions`
   - Verificar se `user.id` é válido

3. **Testes falhando:**
   - Limpar cache: `npm run clean`
   - Reinstalar dependências: `npm install`
   - Reexecuar testes

---

**Status:** 🟢 Pronto para Implementação
**Data:** 2026-03-08
**Responsável:** Claude Code
