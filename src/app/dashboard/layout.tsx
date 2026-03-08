import { ReactNode } from "react";
import { LayoutDashboard, LogOut, Settings, Target, History as HistoryIcon, CreditCard } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";

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

    // Busca status da assinatura para a badge
    let isPro = false;
    if (user) {
        const { data: sub } = await supabase.from('spybot_subscriptions').select('plan').eq('user_id', user.id).single();
        isPro = sub?.plan === 'pro';
    } else {
        // DEV MODE: Simula usuário PRO
        isPro = true;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 flex">
            {/* Sidebar Oculta em Mobile para o MVP rápido, visível em md+ */}
            <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] hidden md:flex flex-col">
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
            <main className="flex-1 flex flex-col min-h-screen max-w-full">
                {/* Header Mobile Opcional */}
                <header className="md:hidden p-4 border-b border-[#1a1a1a] bg-[#0a0a0a] flex justify-between items-center">
                    <strong className="text-green-500 flex items-center gap-2"><Target className="w-5 h-5" /> Spy Bot</strong>
                    <div className="w-6 h-6">
                        {/* Dropdown mobile de logout viria aqui no futuro */}
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
