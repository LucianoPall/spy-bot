# Supabase Setup para Production

## 1. Criar Projeto Supabase

1. Vá para https://app.supabase.com
2. Clique **New Project**
3. Nome: "spy-bot-web-prod"
4. Region: **Mais próximo de você** (São Paulo se BR)
5. Password: Salve em lugar seguro

## 2. Pegar Keys

1. Settings → API
2. Copie:
   - **Project URL**: `https://xxxxx.supabase.co` → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key**: `eyJhbGc...` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Key**: `eyJhbGc...` (diferente!) → `SUPABASE_SERVICE_KEY`

## 3. Criar Tabelas

```sql
-- user_credits
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  credits INT DEFAULT 5,
  plan VARCHAR(50) DEFAULT 'gratis',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- supabase_logs
CREATE TABLE supabase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  event_type VARCHAR(100),
  reason VARCHAR(100),
  amount INT,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_credits ON user_credits(user_id);
CREATE INDEX idx_logs_user ON supabase_logs(user_id);
```

## 4. Criar Storage Bucket

1. Storage → New Bucket
2. Nome: "generated-images"
3. Público: SIM (para servir imagens)
4. Policies:
   - SELECT: Público
   - INSERT: Autenticado
   - UPDATE: Owner
   - DELETE: Owner

## 5. Testar Conexão

```bash
npm install @supabase/supabase-js
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  'https://xxxxx.supabase.co',
  'eyJhbGc...'
);
client.auth.getSession().then(console.log);
"
```

✅ Pronto!
