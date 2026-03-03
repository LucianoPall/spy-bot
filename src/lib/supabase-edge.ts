import { createClient } from '@supabase/supabase-js';

// Cliente para rotas Edge/Client, precisamos pegar a URL e KEY novamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseEdge = createClient(supabaseUrl, supabaseAnonKey);
