import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente Supabase seguro para componentes que rodam no Frontend (Client Components).
// Ele força o salvamento do token em Cookies para que o Backend consiga barrar ou liberar o acesso.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
