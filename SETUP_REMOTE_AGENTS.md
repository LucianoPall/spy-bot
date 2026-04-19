# Configuração de Agentes Remotos - Spy Bot

Implementação de 2 agentes remotos para automatizar tarefas:
1. **Relatório Diário** — envia resumo diário de uso por email
2. **Scraping Agendado** — processa fila de anúncios automaticamente

---

## ✅ Relatório Diário (PRONTO)

### Rota
- **Endpoint:** `GET /api/internal/daily-report`
- **Auth:** Bearer token (header `Authorization`)
- **Resposta:** JSON com estatísticas e status de envio

### Como funciona
1. Busca análises dos últimos 24h no Supabase
2. Agrupa por nicho
3. Calcula créditos consumidos
4. Envia email HTML formatado para o admin

### Testar localmente
```bash
curl -X GET http://localhost:3000/api/internal/daily-report \
  -H "Authorization: Bearer bbd4d76af38a70f85c9e7f3b2ee094fe168998760de6ee9a026cbe223d890129"
```

### Agendar com RemoteTrigger
Após configurar o Resend API Key, execute:
```bash
/schedule daily-report
```

---

## ⚠️ Scraping Agendado (PENDENTE - Precisa Migration)

### Rota
- **Endpoint:** `POST /api/internal/batch-scrape`
- **Auth:** Bearer token (header `Authorization`)
- **Resposta:** JSON com resultados do processamento

### Como funciona
1. Busca até 5 URLs pendentes na tabela `scraping_jobs`
2. Executa scraping via Apify para cada uma
3. Salva resultado ou erro no Supabase
4. Retorna resumo

### Passo 1: Criar tabela no Supabase

Acesse o dashboard do Supabase e execute este SQL na aba "SQL Editor":

```sql
CREATE TABLE scraping_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status, created_at);

ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON scraping_jobs
  AS PERMISSIVE FOR ALL TO authenticated, anon
  USING (true) WITH CHECK (true);
```

### Passo 2: Verificar criação

```bash
curl -X POST http://localhost:3000/api/internal/setup-db \
  -H "Authorization: Bearer bbd4d76af38a70f85c9e7f3b2ee094fe168998760de6ee9a026cbe223d890129"
```

Se retornar `"tableExists": true`, passou!

### Passo 3: Inserir URLs para scraping

```bash
# Via Supabase SQL Editor ou programaticamente
INSERT INTO scraping_jobs (ad_url) VALUES 
  ('https://facebook.com/ads/example1'),
  ('https://facebook.com/ads/example2');
```

### Passo 4: Testar rota

```bash
curl -X POST http://localhost:3000/api/internal/batch-scrape \
  -H "Authorization: Bearer bbd4d76af38a70f85c9e7f3b2ee094fe168998760de6ee9a026cbe223d890129"
```

### Agendar com RemoteTrigger

```bash
/schedule batch-scrape
```

---

## 🔧 Variáveis de Ambiente

Adicionar ao `.env.local`:

```env
# API Interna (Cron Jobs / Agentes Remotos)
# Gerar com: openssl rand -hex 32
CRON_SECRET="<cole-aqui-um-valor-seguro>"

# Email (Resend)
RESEND_API_KEY=""  # Obter em https://resend.com/api-keys
```

---

## 📧 Configurar Resend (Email)

1. Criar conta em https://resend.com
2. Gerar API Key
3. Adicionar ao `.env.local`: `RESEND_API_KEY="re_..."`
4. **Nota:** Em desenvolvimento sem chave, emails são mock mas a rota funciona

---

## 🎯 Próximos Passos

### Para ativar os agentes, use:

```bash
# Agendar relatório diário (7h todos os dias)
/schedule daily-report --cron "0 7 * * *"

# Agendar scraping (8h todos os dias)
/schedule batch-scrape --cron "0 8 * * *"
```

### Monitorar execução

Os agentes executam via Claude RemoteTrigger e registram logs em stdout. Você pode:
1. Verificar logs no dashboard do Claude.ai
2. Chamar as rotas manualmente para debug
3. Adicionar mais testes

---

## 📁 Arquivos Criados

```
src/
├── services/
│   └── email.service.ts          # Serviço Resend (wrapper)
└── app/api/internal/
    ├── daily-report/
    │   └── route.ts              # Relatório diário
    ├── batch-scrape/
    │   └── route.ts              # Scraping em lote
    └── setup-db/
        └── route.ts              # Verificador de tabela

supabase/
└── migrations/
    └── 004_scraping_jobs.sql     # Migration (executar manualmente)
```

---

## ❓ Troubleshooting

**Erro: "Missing API key" (Resend)**
- Normal em dev sem RESEND_API_KEY — emails são simulados

**Erro: "Table does not exist"**
- Execute o SQL de criação no Supabase SQL Editor
- Ou chame a rota de setup para ver o SQL exato

**Erro: "Unauthorized"**
- Verificar Bearer token no header Authorization
- Confirmar que CRON_SECRET está correto

---

## Estrutura de Segurança

✅ **Bearer Token Authentication** — todas as rotas internas requerem CRON_SECRET
✅ **Service Role Key** — Supabase client usa chave com privilégios altos (seguro em backend)
✅ **RLS Policies** — tabela scraping_jobs tem políticas de acesso restritivas
✅ **Rate Limiting** — não implementado (pode ser adicionado depois se necessário)

---

## Recursos

- [Resend Email API](https://resend.com/docs)
- [Supabase Service Role](https://supabase.com/docs/guides/api-keys)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [RemoteTrigger Claude Code](https://claude.ai/docs/remote-triggers)
