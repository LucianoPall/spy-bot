"use client";

import { useState, useMemo } from "react";
import HistoryCard from "@/components/HistoryCard";
import AdvancedFilters from "@/components/AdvancedFilters";
import { FilterOptions } from "@/lib/types";

interface Clone {
    id: string;
    user_id?: string;
    niche?: string;
    created_at: string;
    original_url?: string;
    original_copy?: string;
    original_image?: string;
    image1?: string;
    image2?: string;
    image3?: string;
    variante1?: string;
    variante2?: string;
    variante3?: string;
    strategic_analysis?: string | object | null;
    campaign_id?: string | null;
    clone_tags?: string[] | null;
}

interface HistoryGalleryProps {
    initialClones: Clone[];
}

export default function HistoryGallery({ initialClones }: HistoryGalleryProps) {
    const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});

    // Descobre todos os nichos únicos extraindo da lista de clones (ignorando nulos)
    const uniqueNiches = useMemo(() => {
        const niches = initialClones
            .map(c => c.niche)
            .filter((n): n is string => typeof n === 'string' && n.trim() !== "");

        // Remove duplicatas e padroniza para primeira letra maiúscula
        const unique = Array.from(new Set(niches.map(n => n.trim().toUpperCase())));
        return unique;
    }, [initialClones]);

    // Aplica apenas filtros avançados
    const filteredClones = useMemo(() => {
        return initialClones.filter(clone => {
            // Filtro de Nicho (avançado)
            let matchesAdvancedNiche = true;
            if (advancedFilters.niche) {
                matchesAdvancedNiche = !!(clone.niche && clone.niche.trim().toUpperCase() === advancedFilters.niche);
            }

            // Filtro de Data (avançado)
            let matchesDate = true;
            if (advancedFilters.dateRange) {
                const cloneDate = new Date(clone.created_at);
                const from = new Date(advancedFilters.dateRange.from);
                const to = new Date(advancedFilters.dateRange.to);
                // Ajusta a data 'to' para incluir todo o dia
                to.setHours(23, 59, 59, 999);
                matchesDate = cloneDate >= from && cloneDate <= to;
            }

            // Filtro de Status (avançado)
            let matchesStatus = true;

            return matchesAdvancedNiche && matchesDate && matchesStatus;
        });
    }, [initialClones, advancedFilters]);

    return (
        <div className="w-full space-y-4">
            {/* Filtros Avançados */}
            <AdvancedFilters
                niches={uniqueNiches}
                onFiltersChange={setAdvancedFilters}
                onFilterReset={() => {
                    setAdvancedFilters({});
                }}
            />


            {/* Resumo de resultados */}
            {filteredClones.length > 0 && (
                <div className="text-xs text-gray-500 px-2">
                    {filteredClones.length} {filteredClones.length === 1 ? "clone" : "clones"} encontrado{filteredClones.length !== 1 ? "s" : ""}
                </div>
            )}

            {/* Grid de Cards: espaçamento responsivo para desktop */}
            {filteredClones.length === 0 ? (
                <div className="text-center py-16 bg-[#111]/50 border border-[#222] border-dashed rounded-[16px]">
                    <p className="text-xs text-gray-500">Nenhum clone encontrado.</p>
                    <button onClick={() => setAdvancedFilters({})} className="mt-2 text-green-500 text-xs hover:underline">
                        Limpar filtros
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full">
                    {filteredClones.map((clone) => (
                        <HistoryCard key={clone.id} clone={clone} />
                    ))}
                </div>
            )}
        </div>
    );
}
