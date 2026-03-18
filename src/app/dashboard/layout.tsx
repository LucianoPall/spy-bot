import { ReactNode } from "react";
import { LayoutDashboard, LogOut, Settings, Target, History as HistoryIcon, CreditCard } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CachePlanCookie } from "@/components/CachePlanCookie";

// ⚡ Cache de 5 minutos para reduzir queries ao banco (OTIMIZAÇÃO)
export const revalidate = 300;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();

    // Consulta os dados do usuario no Supabase (SSR)
    const { data: { user } } = await supabase.auth.getUser();

    // Redirecionamento de segurança garantido (Dupla checagem além do middleware)
    // DEV MODE: Permite acesso sem login se NEXT_PUBLIC_DEV_MODE=true
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    if (!user && !devMode) {
        redirect("/login");
    }

    const un = user?.email ? user.email.split('@')[0] : "Dev User";

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
    } else {
        // DEV MODE: Simula usuário PRO
        isPro = true;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 flex">
            {/* Cachear plano em background se não houver cache (via Route Handler) */}
            <CachePlanCookie shouldCache={shouldCacheInBackground} />
            {/* Sidebar: 260px profissional - responsiva com bottom nav mobile */}
            <aside className="
  w-full md:w-[260px]
  fixed md:relative
  bottom-0 md:bottom-auto
  left-0 right-0
  h-[70px] md:h-screen
  bg-[#0a0a0a]
  border-t md:border-t-0 md:border-r
  border-[#1a1a1a]
  flex md:flex-col
  z-40 md:z-0
  overflow-x-auto md:overflow-x-hidden
">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2">
                        <Target className="w-6 h-6 text-green-500" />
                        Spy Bot
                    </h1>
                    <div className="mt-4 flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-300 truncate" title={user?.email}>
                            Olá, {un}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded w-max tracking-wider ${isPro ? 'text-green-500 bg-green-900/20' : 'text-gray-400 bg-gray-800'}`}>
                            {isPro ? 'PRO LICENCE' : 'PLANO GRÁTIS'}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-6 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#151515] hover:text-gray-200 transition-all rounded-lg">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Clonador de Anúncios</span>
                    </Link>
                    <Link href="/dashboard/history" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#151515] hover:text-gray-200 transition-all rounded-lg">
                        <HistoryIcon size={20} />
                        <span className="font-medium">Meus Clones</span>
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#151515] hover:text-gray-200 transition-all rounded-lg">
                        <Settings size={20} />
                        <span className="font-medium">Configurações</span>
                    </Link>
                    <Link href="/dashboard/billing" className="flex items-center gap-3 px-4 py-3 text-green-500 hover:bg-green-500/10 transition-all rounded-lg mt-4 border border-green-500/20">
                        <CreditCard size={20} />
                        <span className="font-bold">Assinatura PRO</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-[#1a1a1a]">
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen pb-[70px] md:pb-0">
                {/* Header Mobile: 70px padrão - hidden no desktop */}
                <header className="md:hidden h-[70px] border-b border-[#1a1a1a] bg-[#0a0a0a] flex justify-between items-center px-6">
                    <strong className="text-green-500 flex items-center gap-2"><Target className="w-5 h-5" /> Spy Bot</strong>
                    <div className="w-6 h-6" />
                </header>

                {/* Content: Responsivo com padding escalável */}
                <div className="flex-1 overflow-y-auto w-full flex items-start justify-center">
                    <div className="w-full max-w-6xl px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 lg:py-5">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
