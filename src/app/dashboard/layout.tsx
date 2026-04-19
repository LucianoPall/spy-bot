import { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CachePlanCookie } from "@/components/CachePlanCookie";
import DashboardShell from "@/components/DashboardShell";

// ⚡ Cache de 5 minutos para reduzir queries ao banco (OTIMIZAÇÃO)
export const revalidate = 300;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();

    // ⚡ OTIMIZAÇÃO: Usar getSession() que lê do cookie (sem network call)
    // O middleware já validou o usuário com getUser() — aqui só precisamos ler a sessão
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // Redirecionamento de segurança garantido (Dupla checagem além do middleware)
    if (!user) {
        redirect("/login");
    }

    const un = user?.email?.split('@')?.[0] || 'User';
    const isAdmin = user?.email === process.env.ADMIN_EMAIL;

    // ⚡ OTIMIZAÇÃO: Verificar cache de cookies primeiro (super rápido)
    let isPro = false;
    let shouldCacheInBackground = false;
    const cookieStore = await cookies();
    const cachedPlan = cookieStore.get('user_plan')?.value;

    if (cachedPlan) {
        // ⚡ Se tiver no cache (cookies), usar direto (MUITO MAIS RÁPIDO!)
        isPro = cachedPlan === 'pro';
    } else if (user) {
        // ✅ Só fazer query se NÃO tiver no cache
        const { data: sub } = await supabase.from('spybot_subscriptions').select('plan').eq('user_id', user.id).single();
        isPro = sub?.plan === 'pro';
        shouldCacheInBackground = true; // Sinaliza para cachear em background via Route Handler
    }

    return (
        <>
            {/* Cachear plano em background se não houver cache (via Route Handler) */}
            <CachePlanCookie shouldCache={shouldCacheInBackground} />
            {/* Shell do dashboard: gerencia o toggle da sidebar no client */}
            <DashboardShell userName={un} isPro={isPro} isAdmin={isAdmin}>
                {children}
            </DashboardShell>
        </>
    );
}
