import { ReactNode } from "react";
import { LayoutDashboard, LogOut, Settings, Target } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    // Nota: A lógica real de logout pode ser cliente-side em um botão iterativo.
    // Neste MVP, faremos uma barra lateral estática com Next.js server components para os links.

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 flex">
            {/* Sidebar Oculta em Mobile para o MVP rápido, visível em md+ */}
            <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-2">
                        <Target className="w-6 h-6 text-green-500" />
                        Spy Bot
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">PRO LICENCE - V1.3</p>
                </div>

                <nav className="flex-1 px-4 mt-8 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-green-900/10 text-green-400 rounded-lg border border-green-500/20 transition-all">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Clonador de Anúncios</span>
                    </Link>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-gray-200 cursor-not-allowed opacity-50">
                        <Settings size={20} />
                        <span className="font-medium">Configurações</span>
                    </div>
                </nav>

                <div className="p-4 border-t border-[#1a1a1a]">
                    <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/10 rounded-lg transition-all">
                        <LogOut size={20} />
                        <span className="font-medium">Sair da Conta</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen max-w-full">
                {/* Header Mobile Opcional */}
                <header className="md:hidden p-4 border-b border-[#1a1a1a] bg-[#0a0a0a] flex justify-between items-center">
                    <strong className="text-green-500 flex items-center gap-2"><Target className="w-5 h-5" /> Spy Bot</strong>
                    <Link href="/login" className="text-sm text-red-400"><LogOut size={16} /></Link>
                </header>

                <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
