"use client";

import { useState, useMemo } from "react";
import VirtualizedHistoryGallery from "@/components/VirtualizedHistoryGallery";
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

interface HistoryClientWrapperProps {
    initialClones: Clone[];
}

export default function HistoryClientWrapper({ initialClones }: HistoryClientWrapperProps) {
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
            const matchesStatus = true;

            return matchesAdvancedNiche && matchesDate && matchesStatus;
        });
    }, [initialClones, advancedFilters]);

    return (
        <VirtualizedHistoryGallery
            initialClones={initialClones}
            uniqueNiches={uniqueNiches}
            advancedFilters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
        />
    );
}
