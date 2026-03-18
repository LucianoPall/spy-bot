import { createClient } from "@/utils/supabase/server";
import { Clock, History as HistoryIcon, Zap, Target, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import HistoryGallery from "@/components/HistoryGallery";

// ⚡ Cache de 10 segundos para navegação rápida (OTIMIZAÇÃO)
export const revalidate = 10;

export default async function HistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // ⚡ OTIMIZAÇÃO: Usar select limitado (só campos necessários) + revalidate
    const { data: clones, error } = await supabase
        .from("spybot_generations")
        .select("id, niche, created_at, variante1, image1, image2, image3, original_copy, original_image", { count: 'exact' })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50); // ⚡ Limitar a 50 clones (otimização de pagination)

    if (error) {
        console.error("Erro ao carregar histórico", error);
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-red-500">
                Lamentamos, ocorreu um erro ao se conectar com o Cofre de Dados. A tabela do banco precisa ser construída.
            </div>
        );
    }

    // Garantir que clones é sempre um array
    const clonesList = clones || [];

    if (clonesList.length === 0) {
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
    const totalClones = clonesList.length;
    const distinctNiches = new Set(clonesList.map(c => c.niche).filter(Boolean)).size;
    const firstCloneDate = clonesList[clonesList.length - 1]?.created_at || null;

    return (
        <div className="w-full space-y-2 sm:space-y-3">
            <div>
                <h2 className="text-sm sm:text-base font-bold text-white mb-0.5 flex items-center gap-1.5">
                    <HistoryIcon className="text-green-500" size={16} />
                    Meus Clones
                </h2>
            </div>

            {/* Stats Cards: responsivo com spacing adequado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                {/* Total Clones Card */}
                <div className="bg-[#111] border border-[#222] rounded-[10px] p-3 sm:p-4 md:p-5 space-y-2 min-h-[70px] md:min-h-[90px] lg:min-h-[110px]">
                    <div className="flex items-center gap-2">
                        <Zap className="text-green-500" size={14} />
                        <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-medium text-gray-400">Total</span>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{totalClones}</div>
                </div>

                {/* Distinct Niches Card */}
                <div className="bg-[#111] border border-[#222] rounded-[10px] p-3 sm:p-4 md:p-5 space-y-2 min-h-[70px] md:min-h-[90px] lg:min-h-[110px]">
                    <div className="flex items-center gap-2">
                        <Target className="text-green-500" size={14} />
                        <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-medium text-gray-400">Nichos</span>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{distinctNiches}</div>
                </div>

                {/* First Clone Date Card */}
                <div className="bg-[#111] border border-[#222] rounded-[10px] p-3 sm:p-4 md:p-5 space-y-2 min-h-[70px] md:min-h-[90px] lg:min-h-[110px]">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-green-500" size={14} />
                        <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-medium text-gray-400">Desde</span>
                    </div>
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                        {firstCloneDate
                            ? new Date(firstCloneDate).toLocaleDateString('pt-BR')
                            : '-'}
                    </div>
                </div>
            </div>

            <HistoryGallery initialClones={clonesList} />
        </div>
    );
}
