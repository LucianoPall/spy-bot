"use client";

import { memo, useMemo, useState, useEffect } from "react";
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

interface VirtualizedHistoryGalleryProps {
    initialClones: Clone[];
    uniqueNiches: string[];
    advancedFilters: FilterOptions;
    onFiltersChange: (filters: FilterOptions) => void;
}

// ⚡ Agressivo memo para colunas rápidas
const MemoizedHistoryCard = memo(HistoryCard, (prev, next) => {
    // Comparação rasa - só compara IDs
    return prev.clone.id === next.clone.id;
});

export default memo(function VirtualizedHistoryGallery({
    initialClones,
    uniqueNiches,
    advancedFilters,
    onFiltersChange
}: VirtualizedHistoryGalleryProps) {
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 9 });

    // ⚡ Memoize filtered clones calculation
    const filteredClones = useMemo(() => {
        return initialClones.filter(clone => {
            let matchesAdvancedNiche = true;
            if (advancedFilters.niche) {
                matchesAdvancedNiche = !!(clone.niche && clone.niche.trim().toUpperCase() === advancedFilters.niche);
            }

            let matchesDate = true;
            if (advancedFilters.dateRange) {
                const cloneDate = new Date(clone.created_at);
                const from = new Date(advancedFilters.dateRange.from);
                const to = new Date(advancedFilters.dateRange.to);
                to.setHours(23, 59, 59, 999);
                matchesDate = cloneDate >= from && cloneDate <= to;
            }

            return matchesAdvancedNiche && matchesDate;
        });
    }, [initialClones, advancedFilters]);

    // ⚡ Paginate visible items
    const visibleItems = useMemo(() => {
        return filteredClones.slice(visibleRange.start, visibleRange.end);
    }, [filteredClones, visibleRange]);

    // ⚡ Handle scroll virtualization
    useEffect(() => {
        const handleScroll = (e: Event) => {
            const container = e.target as HTMLElement;
            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const totalHeight = container.scrollHeight;

            // Load more when user scrolls down
            if (scrollTop + containerHeight > totalHeight - 500) {
                setVisibleRange(prev => ({
                    ...prev,
                    end: Math.min(prev.end + 3, filteredClones.length)
                }));
            }
        };

        const container = document.querySelector('[data-scrollable]');
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [filteredClones.length]);

    return (
        <div className="w-full space-y-4">
            <AdvancedFilters
                niches={uniqueNiches}
                onFiltersChange={onFiltersChange}
                onFilterReset={() => {
                    onFiltersChange({});
                    setVisibleRange({ start: 0, end: 9 });
                }}
            />

            {filteredClones.length > 0 && (
                <div className="text-xs text-gray-500 px-2">
                    {filteredClones.length} {filteredClones.length === 1 ? "clone" : "clones"} encontrado{filteredClones.length !== 1 ? "s" : ""}
                </div>
            )}

            {filteredClones.length === 0 ? (
                <div className="text-center py-16 bg-[#111]/50 border border-[#222] border-dashed rounded-[16px]">
                    <p className="text-xs text-gray-500">Nenhum clone encontrado.</p>
                    <button onClick={() => onFiltersChange({})} className="mt-2 text-green-500 text-xs hover:underline">
                        Limpar filtros
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full" data-scrollable style={{ contain: 'layout style paint' }}>
                    {visibleItems.map((clone) => (
                        <div key={clone.id} style={{ contain: 'content' }}>
                            <MemoizedHistoryCard clone={clone} />
                        </div>
                    ))}
                </div>
            )}

            {/* Load more indicator */}
            {visibleRange.end < filteredClones.length && (
                <div className="text-center py-4">
                    <button
                        onClick={() => setVisibleRange(prev => ({
                            ...prev,
                            end: Math.min(prev.end + 6, filteredClones.length)
                        }))}
                        className="text-green-500 hover:text-green-400 text-sm font-medium"
                    >
                        Carregar mais clones
                    </button>
                </div>
            )}
        </div>
    );
});
