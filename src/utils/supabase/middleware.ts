import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    let {
        data: { user },
    } = await supabase.auth.getUser()

    // Bloqueio de rota: Rejeita acessos não autorizados ao /dashboard
    // DEV MODE: Permite acesso sem autenticação em modo desenvolvimento
    const devModeRaw = process.env.NEXT_PUBLIC_DEV_MODE;
    const devMode = devModeRaw?.trim().toLowerCase() === 'true';

    // Criar usuário mock quando DEV_MODE está ativado e não há usuário
    if (devMode && !user) {
        const mockUser = {
            id: 'dev-user-123',
            email: 'dev@localhost.test',
            app_metadata: { provider: 'dev' },
            user_metadata: { name: 'Dev User' },
            aud: 'authenticated',
            created_at: new Date().toISOString()
        };
        user = mockUser as any;
        console.log('[DEV_MODE] Mock user created:', {
            userId: mockUser.id,
            email: mockUser.email,
            provider: mockUser.app_metadata.provider
        });
    }

    // Debug logs para verificar DEV_MODE
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        console.log('[DEV_MODE DEBUG]', {
            devModeRaw: devModeRaw,
            devModeProcessed: devMode,
            user: user ? 'logged_in' : 'not_logged_in',
            userEmail: user?.email,
            pathname: request.nextUrl.pathname,
            willBlock: !user && !devMode
        });
    }

    // Se DEV_MODE está ativado, permitir acesso a todas as rotas
    if (devMode) {
        console.log('[DEV_MODE] All routes accessible - DEV_MODE is enabled');
        return supabaseResponse;
    }

    // Se não DEV_MODE, bloquear /dashboard sem autenticação
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        console.log('[MIDDLEWARE] Redirecting to /login - no user and devMode disabled');
        return NextResponse.redirect(url)
    }

    // Redirecionamento amigável: Se logado não precisa ir no /login de novo
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
