import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente Supabase para uso no Frontend e para gerenciar Autenticação do Usuário
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
