import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Roda em todas as chamadas de rota para validar/atualizar o cookie do banco
    return await updateSession(request)
}

export const config = {
    matcher: [
        // Pula páginas internas de sistema e estáticos para não gastar chamadas
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
