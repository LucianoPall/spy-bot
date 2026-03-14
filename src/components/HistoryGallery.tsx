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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#111] p-4 rounded-xl border border-[#222]">
                {/* Botões de Filtro Rápido (Nichos) */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                    <Filter size={18} className="text-green-500 mr-2 shrink-0" />
                    {uniqueNiches.map((niche) => (
                        <button
                            key={niche}
                            onClick={() => setActiveNiche(niche)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeNiche === niche
                                    ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-gray-200 border border-[#333]'
                                }`}
                        >
                            {niche === "Todos" ? "🌍 Todos os Nichos" : niche}
                        </button>
                    ))}
                </div>

                {/* Barra de Pesquisa Rápida */}
                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Pesquisar clones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#222] text-sm text-white rounded-lg pl-10 pr-4 py-2 outline-none focus:border-green-500/50 transition-colors placeholder:text-gray-600"
                    />
                </div>
            </div>

            {filteredClones.length === 0 ? (
                <div className="text-center py-20 bg-[#111]/50 border border-[#222] border-dashed rounded-xl">
                    <p className="text-gray-500">Nenhum clone encontrado para o Nicho &quot;{activeNiche}&quot;.</p>
                    <button onClick={() => { setActiveNiche("Todos"); setSearchQuery(""); }} className="mt-4 text-green-500 text-sm hover:underline">
                        Limpar Filtros
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClones.map((clone) => (
                        <HistoryCard key={clone.id} clone={clone} />
                    ))}
                </div>
            )}
        </div>
    );
}
