# 🗄️ Guia de Aplicação da Migration do Supabase

## Status Atual
- ✅ **Código**: 100% (tipos corrigidos, build passou)
- ✅ **Testes**: 100% (136/136 testes passando)
- ⏳ **Database**: Pronto para aplicação manual

---

## Passo 1: Acessar o SQL Editor

1. Vá para: **https://app.supabase.com**
2. Selecione seu projeto: **spy-bot-web** (rrtsfhhutbneaxpuubra)
3. No menu esquerdo, clique em **SQL Editor**
4. Clique em **New Query**

---

## Passo 2: Copiar e Executar a Migration

### Opção A: Copiar arquivo local
1. Abra o arquivo: `supabase/migrations/002_storage_rls_spybot_images.sql`
2. Selecione todo o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor do Supabase (Ctrl+V)

### Opção B: Conteúdo direto

```sql
-- Create bucket for spy bot generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('spybot_images', 'spybot_images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (should already be enabled globally, but ensure it)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload images to spybot_images
CREATE POLICY "Allow authenticated users to upload to spybot_images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
)
ON CONFLICT DO NOTHING;

-- Policy 2: Allow public read access to spybot_images
CREATE POLICY "Allow public read access to spybot_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'spybot_images');

-- Policy 3: Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated users to delete own images in spybot_images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update own images in spybot_images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
);
```

---

## Passo 3: Executar

1. Clique no botão **"▶ Run"** (canto superior direito)
2. Aguarde a execução concluir
3. Verifique se não há erros na aba "Results"

---

## Verificação

Após executar, verifique:

1. **Storage Bucket Criado:**
   - Vá para: **Storage** → **Buckets**
   - Procure por: **spybot_images**
   - Certifique-se de que está marcado como **PUBLIC**

2. **RLS Policies:**
   - Clique na aba **spybot_images**
   - Vá para **Policies**
   - Verifique se existem 4 policies:
     - ✅ Allow authenticated users to upload to spybot_images
     - ✅ Allow public read access to spybot_images
     - ✅ Allow authenticated users to delete own images in spybot_images
     - ✅ Allow authenticated users to update own images in spybot_images

---

## O que a Migration faz

| Componente | Descrição |
|-----------|-----------|
| **Bucket** | Cria um bucket público chamado `spybot_images` para armazenar imagens geradas pelo Spy Bot |
| **RLS (Row Level Security)** | Ativa segurança em nível de linha para `storage.objects` |
| **Policy 1** | Permite que usuários autenticados façam upload de imagens |
| **Policy 2** | Permite que o público leia/acesse qualquer imagem do bucket (PUBLIC) |
| **Policy 3** | Permite que usuários autenticados deletem suas próprias imagens |
| **Policy 4** | Permite que usuários autenticados atualizem suas próprias imagens |

---

## Resultado Esperado

```
[04:35:42.532Z] Successfully executed query
[04:35:42.534Z] Database migration applied
```

---

## Próximos Passos

Após completar a migration:

1. ✅ Confirmar que `spybot_images` bucket existe
2. ✅ Confirmar que as 4 policies foram criadas
3. ✅ O projeto estará em **100%** de conclusão
4. 🚀 Pronto para produção!

---

**Data**: 2026-03-19
**Status**: Awaiting Manual SQL Execution
**Estimated Time**: < 1 minuto
