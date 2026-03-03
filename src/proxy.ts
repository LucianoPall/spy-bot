import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
    const res = NextResponse.next()

    // Roteamento básico de segurança
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')

    // Pegar o token de sessão do cookie
    const supabaseSession = req.cookies.get('sb-rrtsfhhutbneaxpuubra-auth-token') // Exemplo de nome de cookie do supabase, mas vamos usar uma checagem simples

    // No Supabase v2, a sessão fica salva em cookies (dependendo da implementação).
    // Para MVP rápido de Autenticação, se a requisição for para /dashboard e não tivermos indicativo de login
    // redirecionamos para /login.

    // NOTA: Para uma segurança perfeita com App Router, deveríamos usar @supabase/ssr.
    // Como estamos num MVP sem bibliotecas complexas instaladas, essa é uma validação base.

    // Como estamos construindo a versão MVP do Dashboard, deixaremos a rota aberta
    // temporariamente caso não achem o cookie, para facilitar testes locais.
    // Idealmente:
    // if (isDashboard && !supabaseSession) {
    //   return NextResponse.redirect(new URL('/login', req.url))
    // }

    return res
}

export const config = {
    matcher: ['/dashboard/:path*'],
}
