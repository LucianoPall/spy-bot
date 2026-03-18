"use client";

import { useState, useMemo } from "react";
import HistoryCard from "@/components/HistoryCard";
import { Filter, Search } from "lucide-react";

interface Clone {
    id: string;
    niche?: string;
    created_at: string;
    original_url?: string;
    image1?: string;
    image2?: string;
    image3?: string;
    variante1?: string;
    variante2?: string;
    variante3?: string;
}

interface HistoryGalleryProps {
    initialClones: Clone[];
}

export default function HistoryGallery({ initialClones }: HistoryGalleryProps) {
    const [activeNiche, setActiveNiche] = useState<string>("Todos");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Descobre todos os nichos únicos extraindo da lista de clones (ignorando nulos)
    const uniqueNiches = useMemo(() => {
        const niches = initialClones
            .map(c => c.niche)
            .filter((n): n is string => typeof n === 'string' && n.trim() !== "");

        // Remove duplicatas e padroniza para primeira letra maiúscula (Opcional, mas limpo)
        const unique = Array.from(new Set(niches.map(n => n.trim().toUpperCase())));
        return ["Todos", ...unique];
    }, [initialClones]);

    // Aplica o filtro baseado no Nicho ativo e também no termo de busca (opcional de brinde)
    const filteredClones = useMemo(() => {
        return initialClones.filter(clone => {
            // Filtro de Nicho
            const matchesNiche = activeNiche === "Todos" || (clone.niche && clone.niche.trim().toUpperCase() === activeNiche);

            // Filtro de Texto (Busca livre no conteúdo da Copy principal)
            const searchText = searchQuery.toLowerCase();
            const matchesSearch = searchText === "" ||
                (clone.variante1 && clone.variante1.toLowerCase().includes(searchText)) ||
                (clone.niche && clone.niche.toLowerCase().includes(searchText));

            return matchesNiche && matchesSearch;
        });
    }, [initialClones, activeNiche, searchQuery]);

    return (
        <div className="w-full space-y-2 sm:space-y-3 lg:space-y-4">
            {/* Filtros e Busca: responsivo */}
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-3 lg:gap-4 bg-[#111] p-2 sm:p-3 md:p-4 lg:p-5 rounded-[10px] border border-[#222]">
                {/* Botões de Filtro */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    <Filter size={16} className="text-green-500 shrink-0" />
                    {uniqueNiches.map((niche) => (
                        <button
                            key={niche}
                            onClick={() => setActiveNiche(niche)}
                            className={`px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeNiche === niche
                                    ? 'bg-green-500 text-black'
                                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#333]'
                                }`}
                        >
                            {niche === "Todos" ? "Todos" : niche}
                        </button>
                    ))}
                </div>

                {/* Barra de Pesquisa */}
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Pesquisar clones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#222] text-xs sm:text-sm md:text-base text-white rounded-[12px] pl-12 pr-4 py-2 sm:py-2.5 md:py-3 outline-none focus:border-green-500/50 transition-colors placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* Grid de Cards: espaçamento responsivo para desktop */}
            {filteredClones.length === 0 ? (
                <div className="text-center py-16 bg-[#111]/50 border border-[#222] border-dashed rounded-[16px]">
                    <p className="text-xs text-gray-500">Nenhum clone encontrado.</p>
                    <button onClick={() => { setActiveNiche("Todos"); setSearchQuery(""); }} className="mt-2 text-green-500 text-xs hover:underline">
                        Limpar
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
