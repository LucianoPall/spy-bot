# FASE 1: Banco de Dados - Instruções de Execução

## Status: CRIAÇÃO CONCLUÍDA

**Data:** 2026-03-17
**Versão:** 1.0
**Arquivo:** `supabase/migrations/001_create_campaigns.sql`

---

## Resumo do que foi criado

A migration SQL foi criada com as seguintes estruturas:

### Tabelas Criadas:
1. **spybot_campaigns** - Gerencia campanhas de clones
2. **spybot_campaign_clones** - Relacionamento entre campanhas e clones
3. **spybot_campaign_stats** - Estatísticas agregadas de campanhas

### Modificações:
- Adicionadas colunas a `spybot_generations`: `campaign_id` e `clone_tags`

### Segurança (RLS):
- Políticas habilitadas para todas as 3 tabelas
- Acesso restrito ao usuário proprietário
- Trigger automático para atualizar estatísticas

---

## Próximos Passos

### 1. Executar a Migration
```bash
cd C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web
supabase db push
```

**Esperado:** Mensagem de sucesso indicando que as tabelas foram criadas.

---

### 2. Validar no Supabase Studio

Acesse: https://app.supabase.com

Verifique em seu projeto:

#### a) Tabelas criadas
- Vá para **SQL Editor** ou **Table Editor**
- Procure por:
  - `spybot_campaigns`
  - `spybot_campaign_clones`
  - `spybot_campaign_stats`

#### b) Índices criados
- Vá para **SQL Editor**
- Execute:
```sql
SELECT tablename, indexname FROM pg_indexes
WHERE tablename LIKE 'spybot_campaign%';
```

#### c) RLS Policies ativas
- Vá para **Authentication > Policies**
- Verifique que existem políticas para cada tabela

---

### 3. Testar as Queries

#### Teste 1: Criar campanha
```sql
INSERT INTO spybot_campaigns (user_id, name, description)
VALUES (
  'seu-uuid-aqui',
  'Campanha de Teste',
  'Primeira campanha para testes'
);
```

#### Teste 2: Listar campanhas
```sql
SELECT * FROM spybot_campaigns
WHERE user_id = 'seu-uuid-aqui';
```

#### Teste 3: Inserir estatísticas
```sql
INSERT INTO spybot_campaign_stats (campaign_id, user_id)
VALUES ('campaign-uuid-aqui', 'seu-uuid-aqui');
```

---

## Testes de Segurança (RLS)

### Teste as Políticas de RLS:

1. **Conectar como Usuário A** - Deve criar sua própria campanha
2. **Conectar como Usuário B** - NÃO deve ver/editar campanhas do Usuário A
3. **Verificar Trigger** - Ao adicionar clone à campanha, as stats devem atualizar

---

## Troubleshooting

### Erro: "spybot_generations" não existe
- A tabela `spybot_generations` deve existir no banco antes da migration
- Verifique se há migration anterior criando essa tabela

### Erro: "Política X já existe"
- Se rodar a migration novamente, pode ter conflito
- Solução: Usar `DROP POLICY IF EXISTS` antes de criar

### RLS Policies não funcionam
- Verifique se RLS está habilitado na tabela
- Teste com o console do Supabase usando diferentes users

---

## Checklist de Validação

- [ ] Arquivo migration criado em `supabase/migrations/001_create_campaigns.sql`
- [ ] `supabase db push` executado com sucesso
- [ ] 3 tabelas criadas no Supabase
- [ ] 7 índices criados
- [ ] 8 RLS policies criadas
- [ ] Trigger `update_campaign_stats_trigger` ativo
- [ ] Testes básicos de INSERT/SELECT funcionam
- [ ] RLS policies bloqueiam acesso não-autorizado

---

## Próxima Fase

**FASE 2: API REST** (2-3 dias)
- Criar endpoints CRUD para campanhas
- Implementar validações
- Adicionar autenticação via JWT

**FASE 3: Frontend** (2-3 dias)
- Componentes React para gerenciamento
- UI para criar/editar/deletar campanhas
- Dashboard com estatísticas

---

## Contatos & Suporte

Se encontrar problemas:
1. Verifique logs do Supabase: `supabase logs`
2. Teste migrations: `supabase migration list`
3. Reverta se necessário: `supabase db reset`

