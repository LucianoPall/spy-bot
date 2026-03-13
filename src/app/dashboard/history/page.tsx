import { createClient } from "@/utils/supabase/server";
import { Clock, History as HistoryIcon, Zap, Target, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import HistoryGallery from "@/components/HistoryGallery";

export default async function HistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: clones, error } = await supabase
        .from("spybot_generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erro ao carregar histórico", error);
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-red-500">
                Lamentamos, ocorreu um erro ao se conectar com o Cofre de Dados. A tabela do banco precisa ser construída.
            </div>
        );
    }

    if (!clones || clones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <Clock className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-300">Nenhum Clone Salvo Ainda</h2>
                <p className="text-gray-500 mt-2 max-w-sm">
                    Volte à página inicial, insira um link de anúncio e faça sua primeira clonagem. Ela ficará salva aqui para a eternidade.
                </p>
            </div>
        );
    }

    // Calculate stats
    const totalClones = clones.length;
    const distinctNiches = new Set(clones.map(c => c.niche).filter(Boolean)).size;
    const firstCloneDate = clones[clones.length - 1]?.created_at || null;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <HistoryIcon className="text-green-500" size={32} />
                    O Cofre: Meus Clones
                </h2>
                <p className="text-gray-400">
                    Aqui ficam guardadas todas as suas pérolas de copywriting e criativos validados.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                {/* Total Clones Card */}
                <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Zap className="text-green-500" size={20} />
                        <span className="text-sm font-medium text-gray-400">Total de Clones</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{totalClones}</div>
                    <p className="text-xs text-gray-500">Anúncios clonados</p>
                </div>

                {/* Distinct Niches Card */}
                <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Target className="text-green-500" size={20} />
                        <span className="text-sm font-medium text-gray-400">Nichos Utilizados</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{distinctNiches}</div>
                    <p className="text-xs text-gray-500">Mercados diferentes</p>
                </div>

                {/* First Clone Date Card */}
                <div className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-green-500" size={20} />
                        <span className="text-sm font-medium text-gray-400">Primeiro Clone</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                        {firstCloneDate
                            ? new Date(firstCloneDate).toLocaleDateString('pt-BR')
                            : '-'}
                    </div>
                    <p className="text-xs text-gray-500">Data de início</p>
                </div>
            </div>

            <HistoryGallery initialClones={clones} />
        </div>
    );
}
