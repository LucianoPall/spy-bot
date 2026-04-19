"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import HistoryCard from "@/components/HistoryCard";
import AdvancedFilters from "@/components/AdvancedFilters";
import Pagination from "@/components/Pagination";
import { FilterOptions } from "@/lib/types";

const ITEMS_PER_PAGE = 12;

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
    const [currentPage, setCurrentPage] = useState(1);
    const topRef = useRef<HTMLDivElement>(null);

    // Descobre todos os nichos únicos extraindo da lista de clones (ignorando nulos)
    const uniqueNiches = useMemo(() => {
        const niches = initialClones
            .map(c => c.niche)
            .filter((n): n is string => typeof n === 'string' && n.trim() !== "");

        // Remove duplicatas e padroniza para primeira letra maiúscula
        const unique = Array.from(new Set(niches.map(n => n.trim().toUpperCase())));
        return unique;
    }, [initialClones]);

    // Conta quantos clones existem por nicho
    const nicheCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        initialClones.forEach(c => {
            if (c.niche) {
                const key = c.niche.trim().toUpperCase();
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
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

            return matchesAdvancedNiche && matchesDate;
        });
    }, [initialClones, advancedFilters]);

    // Paginação: fatia os clones filtrados conforme a página atual
    const totalPages = Math.ceil(filteredClones.length / ITEMS_PER_PAGE);
    const paginatedClones = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredClones.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredClones, currentPage]);

    // Ao mudar filtros: volta para página 1
    const handleFiltersChange = useCallback((filters: FilterOptions) => {
        setAdvancedFilters(filters);
        setCurrentPage(1);
    }, []);

    const handleFilterReset = useCallback(() => {
        setAdvancedFilters({});
        setCurrentPage(1);
    }, []);

    // Ao mudar de página: atualiza estado e scrolla para o topo da galeria
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    return (
        <div ref={topRef} className="w-full space-y-4">
            {/* Filtros Avançados */}
            <AdvancedFilters
                niches={uniqueNiches}
                nicheCounts={nicheCounts}
                onFiltersChange={handleFiltersChange}
                onFilterReset={handleFilterReset}
            />

            {/* Resumo de resultados */}
            {filteredClones.length > 0 && (
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-gray-500">
                        {filteredClones.length} {filteredClones.length === 1 ? "clone" : "clones"} encontrado{filteredClones.length !== 1 ? "s" : ""}
                        {totalPages > 1 && (
                            <span className="ml-1 text-gray-600">
                                — página {currentPage} de {totalPages}
                            </span>
                        )}
                    </span>
                </div>
            )}

            {/* Grid de Cards */}
            {filteredClones.length === 0 ? (
                <div className="text-center py-16 bg-[#111]/50 border border-[#222] border-dashed rounded-[16px]">
                    <p className="text-xs text-gray-500">Nenhum clone encontrado.</p>
                    <button onClick={handleFilterReset} className="mt-2 text-green-500 text-xs hover:underline">
                        Limpar filtros
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full">
                        {paginatedClones.map((clone) => (
                            <HistoryCard key={clone.id} clone={clone} />
                        ))}
                    </div>

                    {/* Paginação */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
}
