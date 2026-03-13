"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, ExternalLink, Image as ImageIcon, Check, ChevronDown, ChevronUp, Repeat2 } from "lucide-react";
import Link from "next/link";

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

export default function HistoryCard({ clone }: { clone: Clone }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedContent, setCopiedContent] = useState<string | null>(null);

    const handleCopy = (text: string | undefined, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedContent(id);
        setTimeout(() => setCopiedContent(null), 2000);
    };

    const getValidUrl = (url: string | undefined) => {
        if (!url) return "#";
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    };

    return (
        <div className={`bg-[#111] border rounded-xl p-5 transition-all flex flex-col group ${isExpanded ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)] col-span-1 md:col-span-2 xl:col-span-3' : 'border-[#222] hover:border-[#333]'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                    {clone.niche && (
                        <span className="text-[10px] font-bold text-green-300 bg-green-900/30 border border-green-700/50 px-2 py-1 rounded w-max tracking-wide shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                            🏷️ {clone.niche.toUpperCase()}
                        </span>
                    )}
                    <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded font-mono">
                        {new Date(clone.created_at).toLocaleDateString('pt-BR')} às {new Date(clone.created_at).toLocaleTimeString('pt-BR')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <a href={getValidUrl(clone.original_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-green-500 hover:text-green-400 hover:underline flex items-center gap-1 font-medium bg-green-500/10 px-2 py-1 rounded">
                        Anúncio Original <ExternalLink size={12} />
                    </a>
                    {clone.original_url && (
                        <Link href={`/dashboard?url=${encodeURIComponent(clone.original_url)}`} className="text-xs text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1 font-medium bg-blue-500/10 px-2 py-1 rounded">
                            Clonar Novamente <Repeat2 size={12} />
                        </Link>
                    )}
                </div>
            </div>

            {!isExpanded && (
                <>
                    <div className="w-full aspect-video bg-[#0a0a0a] rounded-lg mb-4 overflow-hidden border border-[#1a1a1a] relative group-hover:border-green-500/20 transition-colors">
                        {clone.image1 ? (
                            <Image src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`} alt="Thumbnail do Criativo 1" fill className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700"><ImageIcon size={32} /></div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-[10px] text-green-400 px-2 py-1 rounded border border-green-500/20 font-bold uppercase">Capa do Clone</div>
                    </div>

                    <div className="flex-1 mb-6">
                        <h4 className="font-bold text-gray-200 text-sm mb-2 flex items-center gap-2">
                            <Copy size={14} className="text-green-500" />
                            Big Idea Principal <span className="text-gray-600 font-normal text-xs">(Preview)</span>
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                            {clone.variante1 || "Nenhuma cópia armazenada nesta geração."}
                        </p>
                    </div>
                </>
            )}

            {isExpanded && (
                <div className="space-y-6 mb-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 border-b border-[#222] pb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Copy className="text-green-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Pack Completo do Clone</h3>
                            <p className="text-xs text-gray-400">Variantes textuais e visuais protegidas pela IA.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Variante 1 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-green-400 mb-4 text-sm flex items-center gap-2">🔥 Dor Extrema <span className="text-gray-600 text-[10px] bg-black px-2 py-0.5 rounded uppercase">Feed 1:1</span></h4>
                            <div className="w-full aspect-square bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                {clone.image1 && <Image src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`} alt="V1" fill className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante1}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante1, 'v1')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 rounded-lg text-gray-300 font-medium text-xs transition-colors">
                                {copiedContent === 'v1' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v1' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image1 && (
                                <a href={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`} download target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>

                        {/* Variante 2 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-blue-400 mb-4 text-sm flex items-center gap-2">💡 Solução Direta <span className="text-gray-600 text-[10px] bg-black px-2 py-0.5 rounded uppercase">Feed 1:1</span></h4>
                            <div className="w-full aspect-square bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                {clone.image2 && <Image src={`/api/proxy-image?url=${encodeURIComponent(clone.image2)}`} alt="V2" fill className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante2}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante2, 'v2')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 rounded-lg text-gray-300 font-medium text-xs transition-colors">
                                {copiedContent === 'v2' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v2' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image2 && (
                                <a href={`/api/proxy-image?url=${encodeURIComponent(clone.image2)}`} download target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>

                        {/* Variante 3 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-purple-400 mb-4 text-sm flex items-center gap-2">📖 Storytelling <span className="text-gray-600 text-[10px] bg-black px-2 py-0.5 rounded uppercase">Stories 9:16</span></h4>
                            <div className="w-full aspect-[9/16] bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                {clone.image3 && <Image src={`/api/proxy-image?url=${encodeURIComponent(clone.image3)}`} alt="V3" fill className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante3}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante3, 'v3')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 rounded-lg text-gray-300 font-medium text-xs transition-colors">
                                {copiedContent === 'v3' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v3' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image3 && (
                                <a href={`/api/proxy-image?url=${encodeURIComponent(clone.image3)}`} download target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-auto w-full border font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${isExpanded
                    ? 'bg-[#151515] hover:bg-[#222] border-[#333] text-gray-400'
                    : 'bg-green-600/10 hover:bg-green-600/20 border-green-500/20 text-green-500 hover:border-green-500/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    }`}
            >
                {isExpanded ? (
                    <>Recolher Pack <ChevronUp size={16} /></>
                ) : (
                    <>Expandir Pack Completo <ChevronDown size={16} /></>
                )}
            </button>
        </div>
    );
}
