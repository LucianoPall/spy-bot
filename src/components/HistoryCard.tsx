"use client";

import { useState } from "react";
import { Copy, ExternalLink, Check, ChevronDown, ChevronUp, Repeat2, AlertCircle } from "lucide-react";
import Link from "next/link";

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
    strategic_analysis?: {
        hook?: string;
        promise?: string;
        emotion?: string;
        cta?: string;
        persuasion_structure?: string;
        angle?: string;
        offer_type?: string;
    } | null | string;
    campaign_id?: string | null;
    clone_tags?: string[] | null;
}

// Fallback image para quando nenhuma imagem conseguir carregar
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23222' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' font-size='18' fill='%23888' text-anchor='middle' dy='.3em'%3EImagem Indisponível%3C/text%3E%3C/svg%3E";

/**
 * Gera URL otimizada para exibição de imagem
 * Usa proxy para URLs externas, direto para Supabase
 */
function getProxyUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return PLACEHOLDER_IMAGE;
    // URLs do Supabase são permanentes — carregar direto (mais rápido)
    if (imageUrl.includes('supabase')) return imageUrl;
    // URLs externas — usar proxy para evitar CORS
    return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
}

function getNicheDisplayName(niche: string): string {
    const names: Record<string, string> = {
        emagrecimento: 'Emagrecimento',
        estetica: 'Estética & Beleza',
        alimentacao: 'Alimentação',
        igaming: 'iGaming & Apostas',
        ecommerce: 'E-commerce',
        renda_extra: 'Renda Extra',
        geral: 'Marketing Digital',
    };
    return names[niche] || niche.charAt(0).toUpperCase() + niche.slice(1);
}

function getNicheBadgeStyle(niche: string): string {
    const styles: Record<string, string> = {
        emagrecimento: 'text-blue-300 bg-blue-900/30 border-blue-700/50',
        estetica: 'text-pink-300 bg-pink-900/30 border-pink-700/50',
        alimentacao: 'text-orange-300 bg-orange-900/30 border-orange-700/50',
        igaming: 'text-yellow-300 bg-yellow-900/30 border-yellow-700/50',
        ecommerce: 'text-cyan-300 bg-cyan-900/30 border-cyan-700/50',
        renda_extra: 'text-emerald-300 bg-emerald-900/30 border-emerald-700/50',
        geral: 'text-gray-300 bg-gray-900/30 border-gray-700/50',
    };
    return styles[niche] || styles['geral'];
}

export default function HistoryCard({ clone }: { clone: Clone }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedContent, setCopiedContent] = useState<string | null>(null);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    // Tentar recuperar imagem expirada
    const attemptImageRecovery = async (cloneId: string) => {
        try {
            const response = await fetch('/api/regenerate-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generationId: cloneId })
            });

            if (response.ok) {
                window.location.reload();
            }
        } catch {
            // silently fail
        }
    };

    const handleImageError = (imageKey: string) => {
        setFailedImages(prev => new Set(prev).add(imageKey));
    };

    const getImageUrl = (imageKey: string, rawUrl: string | undefined) => {
        if (failedImages.has(imageKey)) return PLACEHOLDER_IMAGE;
        return getProxyUrl(rawUrl);
    };

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

    // Verificar se todas as imagens falharam
    const allImagesFailed = failedImages.has('image1') && failedImages.has('image2') && failedImages.has('image3');

    return (
        <div className={`bg-[#111] border rounded-[10px] p-2 sm:p-3 md:p-4 lg:p-5 transition-all flex flex-col group min-h-[180px] ${isExpanded ? 'border-green-500/50 md:col-span-2 lg:col-span-3' : 'border-[#222] hover:border-[#333]'}`}>
            <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="flex flex-col gap-1 md:gap-2">
                    {clone.niche && (
                        <span className={`text-[9px] sm:text-[10px] md:text-[11px] font-bold px-1.5 py-0.5 rounded w-max border ${getNicheBadgeStyle(clone.niche)}`}>
                            {getNicheDisplayName(clone.niche)}
                        </span>
                    )}
                    <span className="text-[10px] sm:text-[11px] md:text-[12px] text-gray-500">
                        {new Date(clone.created_at).toLocaleDateString('pt-BR')}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <a href={getValidUrl(clone.original_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1 font-medium bg-green-500/10 px-2 py-1 rounded hover:bg-green-500/20">
                        📱 Original <ExternalLink size={12} />
                    </a>
                    {clone.original_url && (
                        <Link href={`/dashboard?url=${encodeURIComponent(clone.original_url)}`} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 font-medium bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20">
                            🔄 Clonar <Repeat2 size={12} />
                        </Link>
                    )}
                </div>
            </div>

            {!isExpanded && (
                <>
                    <div className="w-full aspect-[4/3] sm:aspect-square md:aspect-video lg:aspect-square bg-[#0a0a0a] rounded-md mb-2 sm:mb-3 md:mb-4 overflow-hidden border border-[#1a1a1a] relative transition-colors">
                        <img src={getImageUrl('image1', clone.image1)} alt="Thumbnail do Criativo 1" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; handleImageError('image1'); }} />
                        <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-[9px] sm:text-[10px] text-green-400 px-2 py-1 rounded border border-green-500/20 font-bold uppercase">Capa do Clone</div>

                        {/* Aviso se imagem expirou */}
                        {allImagesFailed && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                                <AlertCircle size={24} className="text-orange-500" />
                                <p className="text-[10px] text-orange-400 text-center px-2">Imagens expiradas</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 mb-2 sm:mb-3 md:mb-4">
                        <p className="text-[10px] sm:text-[11px] md:text-[12px] text-gray-400 line-clamp-2 leading-tight">
                            {clone.variante1 || "Sem copy"}
                        </p>
                    </div>

                    {/* Botão de Recuperação de Imagens (se todas falharam) */}
                    {allImagesFailed && (
                        <button
                            onClick={() => attemptImageRecovery(clone.id)}
                            className="w-full mt-2 text-center font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-2 sm:px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs mb-2"
                        >
                            🔧 Recuperar Imagens
                        </button>
                    )}
                </>
            )}

            {isExpanded && (
                <div className="space-y-4 sm:space-y-6 md:space-y-8 mb-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 border-b border-[#222] pb-3 sm:pb-4 md:pb-6">
                        <div className="p-2 md:p-3 bg-green-500/10 rounded-lg">
                            <Copy size={24} className="text-green-500 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg lg:text-xl font-bold text-white">Pack Completo do Clone</h3>
                            <p className="text-xs md:text-sm text-gray-400">Variantes textuais e visuais protegidas pela IA.</p>
                        </div>
                    </div>

                    {clone.strategic_analysis && (
                        <StrategicAnalysisCollapsible analysis={clone.strategic_analysis} />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                        {/* Variante 1 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-green-400 mb-4 text-xs md:text-sm lg:text-base flex items-center gap-2">🔥 Dor Extrema <span className="text-gray-600 text-[9px] md:text-[10px] bg-black px-2 py-0.5 rounded uppercase">Feed 1:1</span></h4>
                            <div className="w-full aspect-square bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                <img src={getImageUrl('image1', clone.image1)} alt="V1" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; handleImageError('image1'); }} />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[80px] md:min-h-[120px]">
                                <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante1}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante1, 'v1')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 md:py-2.5 rounded-lg text-gray-300 font-medium text-xs md:text-sm transition-colors">
                                {copiedContent === 'v1' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v1' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image1 && (
                                <a href={getImageUrl('image1', clone.image1)} download={`variante-1-${clone.id}.png`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>

                        {/* Variante 2 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-blue-400 mb-4 text-xs md:text-sm lg:text-base flex items-center gap-2">💡 Solução Direta <span className="text-gray-600 text-[9px] md:text-[10px] bg-black px-2 py-0.5 rounded uppercase">Feed 1:1</span></h4>
                            <div className="w-full aspect-square bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                <img src={getImageUrl('image2', clone.image2)} alt="V2" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; handleImageError('image2'); }} />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[80px] md:min-h-[120px]">
                                <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante2}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante2, 'v2')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 md:py-2.5 rounded-lg text-gray-300 font-medium text-xs md:text-sm transition-colors">
                                {copiedContent === 'v2' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v2' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image2 && (
                                <a href={getImageUrl('image2', clone.image2)} download={`variante-2-${clone.id}.png`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>

                        {/* Variante 3 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-purple-400 mb-4 text-xs md:text-sm lg:text-base flex items-center gap-2">🏆 Autoridade e Prova <span className="text-gray-600 text-[9px] md:text-[10px] bg-black px-2 py-0.5 rounded uppercase">Feed 4:5</span></h4>
                            <div className="w-full aspect-[4/5] bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                <img src={getImageUrl('image3', clone.image3)} alt="V3" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; handleImageError('image3'); }} />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[80px] md:min-h-[120px]">
                                <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante3}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante3, 'v3')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 md:py-2.5 rounded-lg text-gray-300 font-medium text-xs md:text-sm transition-colors">
                                {copiedContent === 'v3' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v3' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image3 && (
                                <a href={getImageUrl('image3', clone.image3)} download={`variante-3-${clone.id}.png`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-auto w-full border font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs ${isExpanded
                    ? 'bg-[#151515] hover:bg-[#222] border-[#333] text-gray-400'
                    : 'bg-green-600/10 hover:bg-green-600/20 border-green-500/20 text-green-500 hover:border-green-500/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    }`}
            >
                {isExpanded ? (
                    <>Recolher <ChevronUp size={14} /></>
                ) : (
                    <>Ver Pack Completo <ChevronDown size={14} /></>
                )}
            </button>
        </div>
    );
}

function StrategicAnalysisCollapsible({ analysis }: { analysis: NonNullable<Clone['strategic_analysis']> }) {
  const [open, setOpen] = useState(false);

  // Parsing seguro de análise estratégica (pode ser string JSON ou objeto)
  let parsedAnalysis: Record<string, string> = {};
  try {
    if (typeof analysis === 'string') {
      parsedAnalysis = JSON.parse(analysis);
    } else if (typeof analysis === 'object' && analysis !== null) {
      parsedAnalysis = analysis as Record<string, string>;
    }
  } catch (e) {
    console.error('Erro ao parsear análise estratégica:', e);
    return null;
  }

  const fields = [
    { label: "Gancho", value: parsedAnalysis.hook },
    { label: "Promessa", value: parsedAnalysis.promise },
    { label: "Emoção", value: parsedAnalysis.emotion },
    { label: "CTA", value: parsedAnalysis.cta },
    { label: "Estrutura", value: parsedAnalysis.persuasion_structure },
    { label: "Ângulo", value: parsedAnalysis.angle },
    { label: "Tipo de Oferta", value: parsedAnalysis.offer_type },
  ].filter(f => f.value);

  if (fields.length === 0) return null;

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#111] transition-colors"
      >
        <span className="text-sm font-semibold text-purple-400">Análise Estratégica do Original</span>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-2 border-t border-[#1a1a1a] pt-3">
          {fields.map(f => (
            <div key={f.label} className="bg-[#111] border border-[#222] rounded-lg p-2">
              <p className="text-[9px] font-bold uppercase text-gray-600 mb-0.5">{f.label}</p>
              <p className="text-[11px] text-gray-300 leading-snug">{f.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
