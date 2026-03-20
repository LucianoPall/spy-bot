# Schema Visual - FASE 1 Banco de Dados

## Diagrama de Entidades e Relacionamentos (ER)

```
┌─────────────────────────────────────────────────────────────────┐
│                          auth.users                              │
│  (Tabela do Supabase Authentication)                            │
├─────────────────────────────────────────────────────────────────┤
│  id (UUID) [PK]                                                 │
│  email (VARCHAR)                                                │
│  ... (outras colunas de autenticação)                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        │ (1:N)        │ (1:N)        │ (1:N)
        │              │              │
        ▼              ▼              ▼
┌──────────────────┐  ┌──────────────────────┐  ┌────────────────────┐
│ spybot_campaigns │  │spybot_campaign_stats │  │spybot_generations  │
├──────────────────┤  ├──────────────────────┤  ├────────────────────┤
│ id (UUID) [PK]   │  │ id (UUID) [PK]       │  │ id (UUID) [PK]     │
│ user_id (UUID)   │◄─┤ campaign_id (UUID)   │  │ ... (outras cols)  │
│ name (VARCHAR)   │  │ user_id (UUID)       │  │ campaign_id (UUID) │
│ description      │  │ total_clones (INT)   │  │ clone_tags (TEXT[])│
│ icon_emoji       │  │ favorite_clones      │  │ ... (outras cols)  │
│ color_hex        │  │ clones_with_high_ctr │  │                    │
│ status           │  │ avg_ctr (DECIMAL)    │  │                    │
│ created_at       │  │ last_updated         │  │                    │
│ updated_at       │  └──────────────────────┘  └────────────────────┘
└────────┬──────────┘           ▲                       ▲
         │                      │                       │
         │         ┌────────────┘                       │
         │         │                                    │
         │ (1:N)   │ (read)                    (N:1)    │
         │         │                                    │
         └─────┬───────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ spybot_campaign_clones       │
    ├──────────────────────────────┤
    │ id (UUID) [PK]               │
    │ campaign_id (UUID) [FK] ◄────┼─────── spybot_campaigns
    │ clone_id (UUID) [FK]    ─────┼────────► spybot_generations
    │ is_favorite (BOOLEAN)        │
    │ performance_notes (TEXT)     │
    │ tags (TEXT[])                │
    │ position (INT)               │
    │ added_at (TIMESTAMP)         │
    │ updated_at (TIMESTAMP)       │
    └──────────────────────────────┘
```

---

## Tabelas em Detalhes

### 1. spybot_campaigns
Armazena as coleções/campanhas de clones criadas pelo usuário.

```
┌──────────────────────────────────────────────────────────────┐
│ spybot_campaigns                                             │
├──────────────────────────────────────────────────────────────┤
│ Campo            │ Tipo         │ Restrições                │
├──────────────────────────────────────────────────────────────┤
│ id               │ UUID         │ PRIMARY KEY               │
│                  │              │ DEFAULT gen_random_uuid() │
├──────────────────────────────────────────────────────────────┤
│ user_id          │ UUID         │ NOT NULL                  │
│                  │              │ REFERENCES auth.users.id  │
│                  │              │ ON DELETE CASCADE         │
├──────────────────────────────────────────────────────────────┤
│ name             │ VARCHAR(255) │ NOT NULL                  │
│                  │              │ UNIQUE(user_id, name)     │
├──────────────────────────────────────────────────────────────┤
│ description      │ TEXT         │ (opcional)                │
├──────────────────────────────────────────────────────────────┤
│ icon_emoji       │ VARCHAR(10)  │ (opcional)                │
├──────────────────────────────────────────────────────────────┤
│ color_hex        │ VARCHAR(7)   │ DEFAULT '#10b981'         │
├──────────────────────────────────────────────────────────────┤
│ status           │ VARCHAR(50)  │ DEFAULT 'active'          │
│                  │              │ Ex: active, archived      │
├──────────────────────────────────────────────────────────────┤
│ created_at       │ TIMESTAMP    │ DEFAULT NOW()             │
├──────────────────────────────────────────────────────────────┤
│ updated_at       │ TIMESTAMP    │ DEFAULT NOW()             │
└──────────────────────────────────────────────────────────────┘

Índices:
  idx_user_campaigns      (user_id)
  idx_campaign_status     (user_id, status)

RLS Policies:
  - SELECT: auth.uid() = user_id
  - INSERT: auth.uid() = user_id
  - UPDATE: auth.uid() = user_id
  - DELETE: auth.uid() = user_id

Exemplo de dados:
  id                    | user_id              | name              | icon
  ─────────────────────│──────────────────────│────────────────────│─────
  550e8400-e29b-41d4... | 123e4567-e89b-12d3... | "Roupas Femininas" | 👗
  6ba7b810-9dad-11d1... | 123e4567-e89b-12d3... | "Eletrônicos"      | 📱
  6ba7b811-9dad-11d1... | 987fcdeb-51a2-43d1... | "Saúde"            | ⚕️
```

---

### 2. spybot_campaign_clones
Relacionamento entre campanhas e clones com metadados.

```
┌──────────────────────────────────────────────────────────────┐
│ spybot_campaign_clones                                       │
├──────────────────────────────────────────────────────────────┤
│ Campo            │ Tipo         │ Restrições                │
├──────────────────────────────────────────────────────────────┤
│ id               │ UUID         │ PRIMARY KEY               │
│                  │              │ DEFAULT gen_random_uuid() │
├──────────────────────────────────────────────────────────────┤
│ campaign_id      │ UUID         │ NOT NULL                  │
│                  │              │ REFERENCES spybot_campaigns│
│                  │              │ ON DELETE CASCADE         │
│                  │              │ UNIQUE(campaign_id,clone_id)
├──────────────────────────────────────────────────────────────┤
│ clone_id         │ UUID         │ NOT NULL                  │
│                  │              │ REFERENCES spybot_generations│
│                  │              │ ON DELETE CASCADE         │
├──────────────────────────────────────────────────────────────┤
│ is_favorite      │ BOOLEAN      │ DEFAULT FALSE             │
├──────────────────────────────────────────────────────────────┤
│ performance_notes│ TEXT         │ (opcional)                │
│                  │              │ Ex: notas sobre performance│
├──────────────────────────────────────────────────────────────┤
│ tags             │ TEXT[]       │ Array de tags             │
│                  │              │ Ex: ['hot', 'trending']   │
├──────────────────────────────────────────────────────────────┤
│ position         │ INT          │ DEFAULT 0                 │
│                  │              │ Para ordenação            │
├──────────────────────────────────────────────────────────────┤
│ added_at         │ TIMESTAMP    │ DEFAULT NOW()             │
├──────────────────────────────────────────────────────────────┤
│ updated_at       │ TIMESTAMP    │ DEFAULT NOW()             │
└──────────────────────────────────────────────────────────────┘

Índices:
  idx_campaign_clones    (campaign_id)
  idx_clone_campaigns    (clone_id)
  idx_favorites          (campaign_id, is_favorite)

RLS Policies:
  - SELECT: auth.uid() owns campaign
  - INSERT/UPDATE/DELETE: auth.uid() owns campaign

Exemplo de dados:
  campaign_id              | clone_id                 | is_fav | tags
  ────────────────────────│──────────────────────────│────────│─────────────
  550e8400-e29b-41d4...   | aa0e8400-e29b-41d4...    | true   | ['hot']
  550e8400-e29b-41d4...   | bb0e8400-e29b-41d4...    | false  | ['test']
  6ba7b810-9dad-11d1...   | cc0e8400-e29b-41d4...    | true   | ['top']
```

---

### 3. spybot_campaign_stats
Estatísticas agregadas por campanha (atualizado via trigger).

```
┌──────────────────────────────────────────────────────────────┐
│ spybot_campaign_stats                                        │
├──────────────────────────────────────────────────────────────┤
│ Campo            │ Tipo         │ Restrições                │
├──────────────────────────────────────────────────────────────┤
│ id               │ UUID         │ PRIMARY KEY               │
│                  │              │ DEFAULT gen_random_uuid() │
├──────────────────────────────────────────────────────────────┤
│ campaign_id      │ UUID         │ NOT NULL, UNIQUE          │
│                  │              │ REFERENCES spybot_campaigns│
│                  │              │ ON DELETE CASCADE         │
├──────────────────────────────────────────────────────────────┤
│ user_id          │ UUID         │ NOT NULL (desnormalizado) │
│                  │              │ REFERENCES auth.users.id  │
│                  │              │ ON DELETE CASCADE         │
├──────────────────────────────────────────────────────────────┤
│ total_clones     │ INT          │ DEFAULT 0                 │
│                  │              │ COUNT(*) from clones      │
├──────────────────────────────────────────────────────────────┤
│ favorite_clones  │ INT          │ DEFAULT 0                 │
│                  │              │ COUNT(*) where is_favorite│
├──────────────────────────────────────────────────────────────┤
│ clones_with_high │ INT          │ DEFAULT 0                 │
│ _ctr             │              │ COUNT(*) where ctr >= X   │
├──────────────────────────────────────────────────────────────┤
│ avg_ctr          │ DECIMAL(5,2) │ DEFAULT 0                 │
│                  │              │ AVG(clone.ctr)            │
├──────────────────────────────────────────────────────────────┤
│ last_updated     │ TIMESTAMP    │ DEFAULT NOW()             │
│                  │              │ Atualizado via trigger    │
└──────────────────────────────────────────────────────────────┘

Índices:
  idx_campaign_stats     (user_id)

RLS Policies:
  - SELECT: auth.uid() = user_id

Exemplo de dados:
  campaign_id              | user_id                  | total | fav | avg_ctr
  ────────────────────────│──────────────────────────│───────│─────│─────────
  550e8400-e29b-41d4...   | 123e4567-e89b-12d3...    | 5     | 2   | 12.50
  6ba7b810-9dad-11d1...   | 987fcdeb-51a2-43d1...    | 3     | 1   | 8.75
```

---

### 4. spybot_generations (Modificações)

Coluna adicional adicionada para vincular clones a campanhas:

```
Colunas NOVAS:
  campaign_id    | UUID         | REFERENCES spybot_campaigns
                 |              | ON DELETE SET NULL
  clone_tags     | TEXT[]       | Array de tags para clone

Índices NOVOS:
  idx_clone_campaign (campaign_id)
```

---

## Fluxo de Dados

### Criar Campanha
```
1. User cria campanha via POST /api/campaigns
   └─ INSERT INTO spybot_campaigns (user_id, name, icon_emoji, color_hex)

2. Sistema cria record de stats automaticamente
   └─ INSERT INTO spybot_campaign_stats (campaign_id, user_id)
```

### Adicionar Clone a Campanha
```
1. User clica "Add to Campaign" em um clone
   └─ INSERT INTO spybot_campaign_clones (campaign_id, clone_id)

2. Trigger dispara e atualiza stats
   └─ UPDATE spybot_campaign_stats SET total_clones = total_clones + 1

3. Stats refletem novo total
   └─ SELECT * FROM spybot_campaign_stats WHERE campaign_id = X
```

### Marcar como Favorito
```
1. User marca clone como favorito
   └─ UPDATE spybot_campaign_clones SET is_favorite = true

2. Trigger dispara e atualiza stats
   └─ UPDATE spybot_campaign_stats SET favorite_clones = COUNT(*)

3. Stats agora mostram mais um favorito
```

### Deletar Campanha
```
1. User deleta campanha
   └─ DELETE FROM spybot_campaigns WHERE id = X

2. CASCADE deleta automaticamente:
   - Todos os clones dessa campanha (spybot_campaign_clones)
   - Stats da campanha (spybot_campaign_stats)
   - References em spybot_generations (SET NULL)
```

---

## Contagem Total de Objetos

### Tabelas: 3
- spybot_campaigns
- spybot_campaign_clones
- spybot_campaign_stats

### Índices: 7
- idx_user_campaigns
- idx_campaign_status
- idx_campaign_clones
- idx_clone_campaigns
- idx_favorites
- idx_campaign_stats
- idx_clone_campaign

### Políticas RLS: 8
- 4 para spybot_campaigns (SELECT, INSERT, UPDATE, DELETE)
- 2 para spybot_campaign_clones (SELECT, INSERT/UPDATE/DELETE)
- 2 para spybot_campaign_stats (SELECT)

### Triggers: 1
- update_campaign_stats_trigger

### Funções: 1
- update_campaign_stats()

---

## Padrões de Acesso SQL

### 1. Listar campanhas do usuário
```sql
SELECT * FROM spybot_campaigns
WHERE user_id = current_user_id
ORDER BY created_at DESC;
```

### 2. Obter clones de uma campanha
```sql
SELECT sc.*, sg.*
FROM spybot_campaign_clones sc
JOIN spybot_generations sg ON sc.clone_id = sg.id
WHERE sc.campaign_id = {campaign_id}
ORDER BY sc.position;
```

### 3. Obter favoritos
```sql
SELECT * FROM spybot_campaign_clones
WHERE campaign_id = {campaign_id}
AND is_favorite = true;
```

### 4. Obter estatísticas
```sql
SELECT * FROM spybot_campaign_stats
WHERE campaign_id = {campaign_id};
```

### 5. Buscar campanhas por status
```sql
SELECT * FROM spybot_campaigns
WHERE user_id = current_user_id
AND status = 'active'
ORDER BY updated_at DESC;
```

---

## Performance Considerations

### Índices criados para:
✅ Lookup por user_id (campaigns)
✅ Filtro por status (campaigns)
✅ Join com clones (campaign_clones)
✅ Reverse lookup de clones (clone_campaigns)
✅ Filtro de favoritos (favorites)
✅ Lookup de stats (campaign_stats)

### Queries sem índice (EVITAR):
❌ SELECT * FROM spybot_campaign_clones WHERE is_favorite = true
   (Use índice idx_favorites ao filtrar por campaign_id também)

---

## Segurança (RLS)

### Isolamento por Usuário
- User A SÓ VÊ campanhas dele
- User A SÓ PODE EDITAR campanhas dele
- User A SÓ PODE DELETAR campanhas dele
- Clones de User B não aparecem para User A

### Integridade Referencial
- Não é possível ter clone sem campanha
- Não é possível ter stats sem campanha
- Deletar campanha deleta tudo associado

---

## Próximos Passos

### FASE 2: API REST
- POST /campaigns (CREATE)
- GET /campaigns (LIST)
- GET /campaigns/:id (READ)
- PUT /campaigns/:id (UPDATE)
- DELETE /campaigns/:id (DELETE)
- POST /campaigns/:id/clones (ADD CLONE)
- DELETE /campaigns/:id/clones/:cloneId (REMOVE CLONE)
- PATCH /campaigns/:id/clones/:cloneId (FAVORITE TOGGLE)

### FASE 3: Frontend
- CampaignsPage
- CampaignCard
- CreateCampaignModal
- EditCampaignModal
- AddCloneToCampaignModal
- CampaignStatsPanel

---

**Schema versão 1.0**
**Documentado em:** 2026-03-17

