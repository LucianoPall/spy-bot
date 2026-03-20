# Quick Reference - FASE 1 Banco de Dados

## 🎯 Objetivo Concluído
Criar schema de banco de dados para gerenciar coleções/campanhas de clones no Spy Bot.

## 📋 Arquivos Criados

| Arquivo | Tipo | Propósito |
|---------|------|----------|
| `supabase/migrations/001_create_campaigns.sql` | SQL Migration | Schema SQL principal |
| `FASE_1_INSTRUCOES_EXECUCAO.md` | Docs | Instruções passo-a-passo |
| `FASE_1_RESUMO_IMPLEMENTACAO.md` | Docs | Resumo completo da implementação |
| `PASSO_A_PASSO_EXECUCAO.md` | Docs | Testes e validação detalhada |
| `SCHEMA_VISUAL.md` | Docs | Diagrama e detalhes de tabelas |
| `QUICK_REFERENCE_FASE1.md` | Docs | Este arquivo |

## 🗄️ Estrutura de Banco de Dados

### Tabelas (3)
```
spybot_campaigns
├─ id (UUID)
├─ user_id (UUID) → auth.users
├─ name (VARCHAR)
├─ description (TEXT)
├─ icon_emoji (VARCHAR)
├─ color_hex (VARCHAR)
├─ status (VARCHAR)
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

spybot_campaign_clones
├─ id (UUID)
├─ campaign_id (UUID) → spybot_campaigns
├─ clone_id (UUID) → spybot_generations
├─ is_favorite (BOOLEAN)
├─ performance_notes (TEXT)
├─ tags (TEXT[])
├─ position (INT)
├─ added_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

spybot_campaign_stats
├─ id (UUID)
├─ campaign_id (UUID) → spybot_campaigns
├─ user_id (UUID) → auth.users
├─ total_clones (INT)
├─ favorite_clones (INT)
├─ clones_with_high_ctr (INT)
├─ avg_ctr (DECIMAL)
└─ last_updated (TIMESTAMP)
```

### Alterações (1)
```
spybot_generations
├─ + campaign_id (UUID) → spybot_campaigns
└─ + clone_tags (TEXT[])
```

## 📊 Índices (7)
```
idx_user_campaigns    → (user_id)
idx_campaign_status   → (user_id, status)
idx_campaign_clones   → (campaign_id)
idx_clone_campaigns   → (clone_id)
idx_favorites         → (campaign_id, is_favorite)
idx_campaign_stats    → (user_id)
idx_clone_campaign    → (campaign_id)
```

## 🔒 RLS Policies (8)
```
spybot_campaigns:
├─ SELECT: auth.uid() = user_id
├─ INSERT: auth.uid() = user_id
├─ UPDATE: auth.uid() = user_id
└─ DELETE: auth.uid() = user_id

spybot_campaign_clones:
├─ SELECT: user owns campaign
└─ INSERT/UPDATE/DELETE: user owns campaign

spybot_campaign_stats:
└─ SELECT: auth.uid() = user_id
```

## ⚙️ Automação (1 Trigger + 1 Função)
```
update_campaign_stats_trigger
└─ Dispara em INSERT/UPDATE/DELETE em spybot_campaign_clones
   └─ Executa update_campaign_stats()
      └─ Atualiza total_clones, favorite_clones, last_updated
```

## 🚀 Como Executar

### Pré-requisitos
```bash
npm install -g supabase
# ou: brew install supabase/tap/supabase (Mac)
```

### 1. Dry Run (Seguro)
```bash
cd "C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web"
supabase db push --dry-run
```

### 2. Executar Migration
```bash
supabase db push
```

### 3. Validar
```bash
supabase migration list
```

### 4. Testar (Supabase Studio)
```
https://app.supabase.com
→ Seu projeto
→ SQL Editor
→ Execute os testes em PASSO_A_PASSO_EXECUCAO.md
```

## ✅ Checklist de Execução

```
[ ] Migration SQL criada
[ ] supabase db push executado
[ ] 3 tabelas criadas no banco
[ ] 7 índices criados
[ ] 8 RLS policies ativas
[ ] Trigger criado e funcionando
[ ] INSERT test passed
[ ] SELECT test passed
[ ] UPDATE test passed
[ ] CONSTRAINT test passed
[ ] RLS security test passed
[ ] TRIGGER automático test passed
[ ] Backup realizado
```

## 📚 Documentação Principal

1. **Para Executar:** `PASSO_A_PASSO_EXECUCAO.md`
2. **Para Entender Schema:** `SCHEMA_VISUAL.md`
3. **Para Resumo Técnico:** `FASE_1_RESUMO_IMPLEMENTACAO.md`
4. **Para Instruções:** `FASE_1_INSTRUCOES_EXECUCAO.md`

## 🔧 SQL Útil

### Ver estrutura de tabela
```sql
\d spybot_campaigns
\d spybot_campaign_clones
\d spybot_campaign_stats
```

### Ver índices
```sql
SELECT tablename, indexname FROM pg_indexes
WHERE tablename LIKE 'spybot_campaign%';
```

### Ver RLS status
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables WHERE tablename LIKE 'spybot_campaign%';
```

### Ver trigger
```sql
SELECT * FROM pg_trigger WHERE tgname = 'update_campaign_stats_trigger';
```

## 🎮 Comandos Git

```bash
# Status
git status

# Adicionar arquivos
git add supabase/migrations/001_create_campaigns.sql
git add FASE_1_*.md
git add PASSO_A_PASSO_EXECUCAO.md
git add SCHEMA_VISUAL.md
git add QUICK_REFERENCE_FASE1.md

# Commit
git commit -m "feat: Phase 1 database schema for campaigns [AIOS PHASE 1]"

# Ver log
git log --oneline -5
```

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Migration falha | Verifique `spybot_generations` existe |
| RLS policies não funcionam | Execute `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| Trigger não atualiza stats | Verifique se trigger foi criado com sucesso |
| Índices não usados | Analise com `EXPLAIN ANALYZE` |
| Constraint error | Verifique unicidade de (user_id, name) |

## 🔗 Referências

### Supabase Documentation
- https://supabase.com/docs/reference/sql
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/migrations

### PostgreSQL Documentation
- https://www.postgresql.org/docs/current/sql-syntax.html
- https://www.postgresql.org/docs/current/sql-trigger.html

## 📋 Próximos Passos

### FASE 2: API REST (1-1.5 dias)
- Criar endpoints CRUD
- Implementar autenticação JWT
- Adicionar validações

### FASE 3: Frontend (2-3 dias)
- Componentes React
- UI para campanhas
- Dashboard de estatísticas

## 💡 Tips & Tricks

### Para listar campanhas do usuário logado:
```sql
SELECT * FROM spybot_campaigns
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Para contar clones em uma campanha:
```sql
SELECT COUNT(*) FROM spybot_campaign_clones
WHERE campaign_id = 'campaign-uuid';
```

### Para obter clones favoritos:
```sql
SELECT * FROM spybot_campaign_clones
WHERE campaign_id = 'campaign-uuid'
AND is_favorite = true;
```

## 📞 Suporte

Se algo der errado:
1. Verifique `PASSO_A_PASSO_EXECUCAO.md` seção "Troubleshooting"
2. Consulte `SCHEMA_VISUAL.md` para entender estrutura
3. Execute `supabase logs` para ver erros
4. Execute `supabase db reset` para rollback completo

---

## Status da FASE 1: ✅ CONCLUÍDO

**Data de Criação:** 2026-03-17
**Desenvolvedor:** DEX (Synkra AIOS)
**Pronto para:** Execução com `supabase db push`

