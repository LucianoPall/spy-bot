# Passo a Passo: Executar Migration FASE 1

## Status: PRONTO PARA EXECUÇÃO

**Migration:** `supabase/migrations/001_create_campaigns.sql`
**Criada em:** 2026-03-17
**Tamanho:** ~150 linhas de SQL

---

## PASSO 1: Preparar Ambiente

### 1.1 - Navegar para o diretório do projeto
```bash
cd "C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web"
```

### 1.2 - Verificar que a CLI do Supabase está instalada
```bash
supabase --version
```

Se não estiver instalada:
```bash
npm install -g supabase
```

### 1.3 - Verificar que o arquivo migration foi criado
```bash
ls -la supabase/migrations/
```

Esperado:
```
001_create_campaigns.sql
```

---

## PASSO 2: Fazer Backup (IMPORTANTE!)

### 2.1 - Fazer backup do banco de dados atual
```bash
supabase db push --dry-run
```

**IMPORTANTE:** Este comando mostra o que será alterado SEM fazer alterações reais.

Se o output parecer correto, proceda.

### 2.2 - (Opcional) Exportar backup manual via Supabase Studio
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para **Database > Backups**
4. Clique em **Trigger Manual Backup**
5. Aguarde a confirmação

---

## PASSO 3: Executar a Migration

### 3.1 - Aplicar a migration
```bash
supabase db push
```

**Esperado:** Output como:
```
Applying migration: 001_create_campaigns.sql
Migration completed successfully
```

**Se houver erro:**
- Verifique a sintaxe SQL
- Revise se `spybot_generations` existe
- Consulte logs: `supabase logs --invert-match`

### 3.2 - Verificar que a migration foi aplicada
```bash
supabase migration list
```

Esperado: Sua migration aparece na lista com status ✅

---

## PASSO 4: Validar Tabelas

### 4.1 - Abrir Supabase Studio
1. Acesse: https://app.supabase.com
2. Selecione seu projeto **spy-bot-web**
3. Vá para **SQL Editor**

### 4.2 - Verificar tabelas criadas
Execute:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'spybot_campaign%';
```

Esperado resultado (3 linhas):
```
spybot_campaigns
spybot_campaign_clones
spybot_campaign_stats
```

### 4.3 - Verificar índices criados
Execute:
```sql
SELECT tablename, indexname FROM pg_indexes
WHERE tablename LIKE 'spybot_campaign%'
ORDER BY tablename;
```

Esperado: 7 índices listados

### 4.4 - Verificar RLS está ativo
Execute:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'spybot_campaign%';
```

Esperado: `rowsecurity = true` para todas as 3 tabelas

---

## PASSO 5: Validar Estrutura de Dados

### 5.1 - Ver estrutura de spybot_campaigns
```sql
\d spybot_campaigns
```

Esperado: 9 colunas listadas com seus tipos

### 5.2 - Ver restrições
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'spybot_campaigns';
```

Esperado: Constraints de PK, UNIQUE, FK

---

## PASSO 6: Testar Funcionalidade

### 6.1 - Obter seu UUID de usuário
```sql
SELECT id FROM auth.users LIMIT 1;
```

Copie o UUID retornado. Vamos chamá-lo de `{USER_UUID}`

### 6.2 - Teste 1: Criar Campanha
```sql
INSERT INTO spybot_campaigns (user_id, name, description, icon_emoji)
VALUES (
  '{USER_UUID}',
  'Minha Primeira Campanha',
  'Testes da FASE 1',
  '🎯'
);
```

Esperado: `INSERT 0 1` (1 linha inserida)

### 6.3 - Teste 2: Listar Campanhas (SELECT)
```sql
SELECT id, user_id, name, status, created_at
FROM spybot_campaigns
WHERE user_id = '{USER_UUID}';
```

Esperado: Sua campanha aparece na lista

### 6.4 - Teste 3: Atualizar Campanha
```sql
UPDATE spybot_campaigns
SET description = 'Descrição atualizada'
WHERE user_id = '{USER_UUID}'
AND name = 'Minha Primeira Campanha';
```

Esperado: `UPDATE 1` (1 linha atualizada)

### 6.5 - Teste 4: Criar Estatísticas (sem clone ainda)
Primeiro, obtenha o ID da campanha:
```sql
SELECT id FROM spybot_campaigns
WHERE user_id = '{USER_UUID}'
LIMIT 1;
```

Copie o `id`. Vamos chamá-lo de `{CAMPAIGN_ID}`

Então insira as stats:
```sql
INSERT INTO spybot_campaign_stats (campaign_id, user_id, total_clones, favorite_clones)
VALUES ('{CAMPAIGN_ID}', '{USER_UUID}', 0, 0);
```

Esperado: `INSERT 0 1`

### 6.6 - Teste 5: Validar Constraint de Unicidade
Tente inserir outra campanha com mesmo nome:
```sql
INSERT INTO spybot_campaigns (user_id, name)
VALUES ('{USER_UUID}', 'Minha Primeira Campanha');
```

Esperado: **ERRO** - Deve violar constraint UNIQUE
```
ERROR: duplicate key value violates unique constraint
```

---

## PASSO 7: Testar RLS (Segurança)

### 7.1 - Criar segundo usuário (se possível)

1. Em **Supabase Studio > Authentication > Users**
2. Clique em **Create User**
3. Adicione email e password
4. Copie o UUID do novo usuário. Vamos chamá-lo de `{USER_UUID_2}`

### 7.2 - Tentar acessar como outro usuário
Em um novo terminal do SQL Editor, execute como User 2:
```sql
-- Simular acesso de User 2
SET request.jwt.claims = '{"sub": "{USER_UUID_2}"}';

SELECT * FROM spybot_campaigns;
```

Esperado: **Resultado vazio** - User 2 não deve ver campanhas de User 1

### 7.3 - Tentar inserir como outro usuário
```sql
-- Simular acesso de User 2
SET request.jwt.claims = '{"sub": "{USER_UUID_2}"}';

-- Tentar criar campanha para User 1 (deve falhar)
INSERT INTO spybot_campaigns (user_id, name)
VALUES ('{USER_UUID}', 'Hack Attempt');
```

Esperado: **ERRO de RLS**
```
ERROR: new row violates row-level security policy
```

---

## PASSO 8: Testar Trigger

### 8.1 - Obter IDs necessários

```sql
-- Obter ID da campanha
SELECT id FROM spybot_campaigns
WHERE user_id = '{USER_UUID}' LIMIT 1;
-- Guarde como {CAMPAIGN_ID}

-- Obter ID de um clone existente (se houver)
SELECT id FROM spybot_generations LIMIT 1;
-- Guarde como {CLONE_ID}
```

### 8.2 - Verificar stats ANTES de adicionar clone
```sql
SELECT total_clones, favorite_clones
FROM spybot_campaign_stats
WHERE campaign_id = '{CAMPAIGN_ID}';
```

Esperado: `0 | 0`

### 8.3 - Adicionar um clone à campanha
```sql
INSERT INTO spybot_campaign_clones (campaign_id, clone_id, is_favorite)
VALUES ('{CAMPAIGN_ID}', '{CLONE_ID}', false);
```

Esperado: `INSERT 0 1`

### 8.4 - Verificar stats DEPOIS (Trigger deve ter atualizado)
```sql
SELECT total_clones, favorite_clones
FROM spybot_campaign_stats
WHERE campaign_id = '{CAMPAIGN_ID}';
```

Esperado: `1 | 0` (total aumentou, favorites permanece 0)

### 8.5 - Marcar como favorito e verificar novamente
```sql
UPDATE spybot_campaign_clones
SET is_favorite = true
WHERE campaign_id = '{CAMPAIGN_ID}'
AND clone_id = '{CLONE_ID}';

SELECT total_clones, favorite_clones
FROM spybot_campaign_stats
WHERE campaign_id = '{CAMPAIGN_ID}';
```

Esperado: `1 | 1` (ambos agora 1)

---

## PASSO 9: Limpar Testes (Opcional)

Se quiser remover os dados de teste:

```sql
-- Delete stats (deve deletar stats também)
DELETE FROM spybot_campaigns
WHERE user_id = '{USER_UUID}'
AND name = 'Minha Primeira Campanha';

-- Verificar que foi deletado
SELECT COUNT(*) FROM spybot_campaigns
WHERE user_id = '{USER_UUID}';
```

Esperado: `0`

---

## PASSO 10: Fazer Commit no Git

### 10.1 - Adicionar arquivos ao git
```bash
cd "C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web"

git add supabase/migrations/001_create_campaigns.sql
git add FASE_1_INSTRUCOES_EXECUCAO.md
git add FASE_1_RESUMO_IMPLEMENTACAO.md
git add PASSO_A_PASSO_EXECUCAO.md
```

### 10.2 - Criar commit
```bash
git commit -m "feat: Phase 1 database schema for campaigns and collections"
```

### 10.3 - Verificar commit
```bash
git log --oneline -5
```

---

## ✅ CHECKLIST FINAL

- [ ] Migration executada com sucesso
- [ ] 3 tabelas criadas
- [ ] 7 índices criados
- [ ] 8 RLS policies ativas
- [ ] Trigger funcionando
- [ ] Teste INSERT funcionou
- [ ] Teste SELECT funcionou
- [ ] Teste UPDATE funcionou
- [ ] Teste CONSTRAINT funcionou
- [ ] Teste RLS funcionou
- [ ] Teste TRIGGER funcionou
- [ ] Arquivos commitados no git
- [ ] Backup realizado (opcional mas recomendado)

---

## Se Algo der Errado

### Rollback da Migration
```bash
supabase db reset
```

**CUIDADO:** Isto deleta TODOS os dados do banco local.

### Verificar Logs
```bash
supabase logs --invert-match
```

### Contatar Suporte
- Supabase Docs: https://supabase.com/docs
- Discord Community: https://discord.supabase.com

---

## Próximos Passos

Após validação bem-sucedida:

1. **Crie a FASE 2:** API REST endpoints
2. **Crie a FASE 3:** Frontend components
3. **Integre:** Tudo junto com testes e2e

---

**Desenvolvido por:** DEX (Synkra AIOS)
**Data:** 2026-03-17

