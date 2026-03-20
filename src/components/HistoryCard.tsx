"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, ExternalLink, Image as ImageIcon, Check, ChevronDown, ChevronUp, Repeat2, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  validateCloneStructure,
  isValidImageUrl,
  isCacheValid
} from "@/lib/image-validation";

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

export default function HistoryCard({ clone }: { clone: Clone }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedContent, setCopiedContent] = useState<string | null>(null);
    const [loadedImages, setLoadedImages] = useState<{ [key: string]: string }>({});
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    // Tracking de metrics para observabilidade
    const metricsRef = useRef({
        imagesLoaded: 0,
        imagesFailed: 0,
        totalLoadTime: 0,
        cacheHits: 0,
        cacheMisses: 0
    });

    // Cache em localStorage para persistir imagens entre sessões
    const getCachedImage = (imageUrl: string | undefined, cacheKey: string) => {
        if (!imageUrl) return null;

        try {
            const cached = localStorage.getItem(`img_cache_${cacheKey}`);
            if (cached) {
                return cached;
            }
        } catch (e) {
            console.warn("Erro ao acessar localStorage", e);
        }
        return null;
    };

    const setCachedImage = (imageUrl: string, cacheKey: string) => {
        try {
            localStorage.setItem(`img_cache_${cacheKey}`, imageUrl);
        } catch (e) {
            console.warn("Erro ao salvar em localStorage", e);
        }
    };

    // Registra métrica de carregamento para observabilidade
    const recordMetric = (source: 'cache' | 'api' | 'proxy' | 'direct' | 'placeholder', duration: number) => {
        const metrics = metricsRef.current;

        if (source !== 'placeholder') {
            metrics.imagesLoaded++;
        } else {
            metrics.imagesFailed++;
        }

        if (source === 'cache') {
            metrics.cacheHits++;
        } else if (source === 'api' || source === 'proxy' || source === 'direct') {
            metrics.cacheMisses++;
        }

        metrics.totalLoadTime += duration;

        // Log a cada 10 imagens
        if ((metrics.imagesLoaded + metrics.imagesFailed) % 10 === 0) {
            console.log('[IMAGE_METRICS_SNAPSHOT]', {
                loaded: metrics.imagesLoaded,
                failed: metrics.imagesFailed,
                avgLoadTime: metrics.totalLoadTime / (metrics.imagesLoaded || 1),
                cacheHitRate: metrics.cacheHits / ((metrics.cacheHits + metrics.cacheMisses) || 1),
                failureRate: metrics.imagesFailed / (metrics.imagesLoaded + metrics.imagesFailed || 1)
            });
        }
    };

    // Tentar recuperar imagem expirada
    const attemptImageRecovery = async (cloneId: string) => {
        try {
            console.log('[RECOVERY] Tentando recuperar imagens expiradas para', cloneId);
            const response = await fetch('/api/regenerate-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generationId: cloneId })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[RECOVERY] ✅ Imagens recuperadas com sucesso', result);
                // Recarregar página para mostrar novas imagens
                window.location.reload();
            } else {
                console.warn('[RECOVERY] Falha ao recuperar imagens');
            }
        } catch (err) {
            console.error('[RECOVERY] Erro ao recuperar imagens', err);
        }
    };

    // Carrega imagem com fallback inteligente e logging detalhado
    useEffect(() => {
        const loadImage = async (imageUrl: string | undefined, imageKey: string, cacheKey: string) => {
            if (!imageUrl || failedImages.has(imageKey)) return;

            const startTime = performance.now();
            const imageLog: any = {
                imageKey,
                url: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
                attempts: {
                    cache: null,
                    getImage: null,
                    proxyImage: null,
                    directUrl: null,
                    fallback: null
                }
            };

            try {
                // Tentativa 1: Cache
                const cached = getCachedImage(imageUrl, cacheKey);
                if (cached) {
                    imageLog.attempts.cache = {
                        status: 'HIT',
                        duration: performance.now() - startTime
                    };
                    console.log('[IMAGE_CACHE_HIT]', imageLog);
                    setLoadedImages(prev => ({ ...prev, [imageKey]: cached }));
                    return;
                }
                imageLog.attempts.cache = { status: 'MISS', duration: performance.now() - startTime };

                // Tentativa 2: /api/get-image
                const getImageStart = performance.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
                try {
                    const response = await fetch(
                        `/api/get-image?url=${encodeURIComponent(imageUrl)}&cache=${cacheKey}`,
                        {
                            method: 'GET',
                            headers: { 'Cache-Control': 'public, max-age=31536000' },
                            signal: controller.signal
                        }
                    );
                    if (response.ok) {
                        const blob = await response.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        imageLog.attempts.getImage = {
                            status: 'SUCCESS',
                            duration: performance.now() - getImageStart,
                            blobSize: blob.size
                        };
                        setLoadedImages(prev => ({ ...prev, [imageKey]: objectUrl }));
                        setCachedImage(objectUrl, cacheKey);
                        console.log('[IMAGE_LOADED_API]', imageLog);
                        return;
                    }
                } catch (e: any) {
                    imageLog.attempts.getImage = {
                        status: 'FAILED',
                        duration: performance.now() - getImageStart,
                        error: e.message
                    };
                } finally {
                    clearTimeout(timeoutId);
                }

                // Tentativa 3: /api/proxy-image (com retry automático)
                const proxyStart = performance.now();
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
                    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
                    const response = await fetch(proxyUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (response.ok) {
                        const blob = await response.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        imageLog.attempts.proxyImage = {
                            status: 'SUCCESS',
                            duration: performance.now() - proxyStart,
                            blobSize: blob.size
                        };
                        setLoadedImages(prev => ({ ...prev, [imageKey]: objectUrl }));
                        setCachedImage(objectUrl, cacheKey);
                        console.log('[IMAGE_LOADED_PROXY]', imageLog);
                        return;
                    }
                } catch (e: any) {
                    imageLog.attempts.proxyImage = {
                        status: 'FAILED',
                        duration: performance.now() - proxyStart,
                        error: e.message
                    };
                }

                // Tentativa 4: URL direta
                const directStart = performance.now();
                try {
                    const response = await fetch(imageUrl, { method: 'HEAD' });
                    if (response.ok && response.headers.get('content-type')?.includes('image')) {
                        imageLog.attempts.directUrl = {
                            status: 'SUCCESS',
                            duration: performance.now() - directStart
                        };
                        console.log('[IMAGE_LOADED_DIRECT]', imageLog);
                        setLoadedImages(prev => ({ ...prev, [imageKey]: imageUrl }));
                        return;
                    }
                } catch (e: any) {
                    imageLog.attempts.directUrl = {
                        status: 'FAILED',
                        duration: performance.now() - directStart,
                        error: e.message
                    };
                }

                // Fallback final: usar placeholder
                imageLog.attempts.fallback = {
                    status: 'PLACEHOLDER',
                    duration: performance.now() - startTime
                };
                console.error('🔴 [IMAGE_ALL_ATTEMPTS_FAILED]', imageLog, {
                    reason: 'Todas as 4 tentativas falharam. Verifique console acima para detalhes de cada tentativa.',
                    suggestions: [
                        '1. Verifique se a URL é válida',
                        '2. Teste /api/image-health para status dos CDNs',
                        '3. Aumentar timeout de 30s se ainda falhar',
                        '4. Considerar usar image proxy como fallback obrigatório'
                    ]
                });
                setLoadedImages(prev => ({ ...prev, [imageKey]: PLACEHOLDER_IMAGE }));
                setFailedImages(prev => new Set(prev).add(imageKey));

            } catch (error: any) {
                console.error('[IMAGE_LOAD_EXCEPTION]', {
                    ...imageLog,
                    errorMessage: error.message,
                    duration: performance.now() - startTime
                });
                setLoadedImages(prev => ({ ...prev, [imageKey]: PLACEHOLDER_IMAGE }));
                setFailedImages(prev => new Set(prev).add(imageKey));
            }
        };

        // Validar estrutura do clone antes de processar
        if (!validateCloneStructure(clone)) {
            console.error('[INVALID_CLONE_STRUCTURE]', { cloneId: clone?.id });
            return;
        }

        // Validar cada imagem antes de tentar carregar
        const imagesToLoad = [
            { url: clone.image1, key: 'image1', cacheKey: `${clone.id}_1` },
            { url: clone.image2, key: 'image2', cacheKey: `${clone.id}_2` },
            { url: clone.image3, key: 'image3', cacheKey: `${clone.id}_3` }
        ];

        imagesToLoad.forEach(({ url, key, cacheKey }) => {
            if (url && !isValidImageUrl(url)) {
                console.error('[INVALID_IMAGE_URL]', { cloneId: clone.id, key, url });
                setFailedImages(prev => new Set(prev).add(key));
                return;
            }

            // Validar cache antes de usar
            const cached = localStorage.getItem(`img_cache_${cacheKey}`);
            if (!isCacheValid(cached)) {
                localStorage.removeItem(`img_cache_${cacheKey}`); // Limpar cache corrupto
                console.warn('[INVALID_CACHE_REMOVED]', { cacheKey });
            }

            loadImage(url, key, cacheKey);
        });
    }, [clone.id, clone.image1, clone.image2, clone.image3, failedImages]);

    const getImageUrl = (imageKey: string) => {
        return loadedImages[imageKey] || PLACEHOLDER_IMAGE;
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
                        <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-green-300 bg-green-900/30 border border-green-700/50 px-1.5 py-0.5 rounded w-max">
                            {clone.niche}
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
                        <img src={getImageUrl('image1')} alt="Thumbnail do Criativo 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
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
                            className="w-full mt-2 pt-1 sm:pt-2 text-center font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-2 sm:px-3 py-2 sm:py-2.5 md:py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm md:text-base mb-2"
                        >
                            🔧 Recuperar Imagens
                        </button>
                    )}

                    {/* Botão Clonar Novamente Grande e Visível */}
                    {clone.original_url && (
                        <Link
                            href={`/dashboard?url=${encodeURIComponent(clone.original_url)}`}
                            className="w-full mt-auto pt-1 sm:pt-2 text-center font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-2 sm:px-3 py-2 sm:py-2.5 md:py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm md:text-base"
                        >
                            🔄 CLONAR NOVAMENTE
                        </Link>
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
                                <img src={getImageUrl('image1')} alt="V1" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[80px] md:min-h-[120px]">
                                <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante1}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante1, 'v1')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 md:py-2.5 rounded-lg text-gray-300 font-medium text-xs md:text-sm transition-colors">
                                {copiedContent === 'v1' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v1' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image1 && (
                                <a href={getImageUrl('image1')} download={`variante-1-${clone.id}.png`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>

                        {/* Variante 2 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-blue-400 mb-4 text-xs md:text-sm lg:text-base flex items-center gap-2">💡 Solução Direta <span className="text-gray-600 text-[9px] md:text-[10px] bg-black px-2 py-0.5 rounded uppercase">Feed 1:1</span></h4>
                            <div className="w-full aspect-square bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                <img src={getImageUrl('image2')} alt="V2" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[80px] md:min-h-[120px]">
                                <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante2}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante2, 'v2')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 md:py-2.5 rounded-lg text-gray-300 font-medium text-xs md:text-sm transition-colors">
                                {copiedContent === 'v2' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v2' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image2 && (
                                <a href={getImageUrl('image2')} download={`variante-2-${clone.id}.png`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>

                        {/* Variante 3 */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl flex flex-col h-full hover:border-[#333] transition-colors">
                            <h4 className="font-bold text-purple-400 mb-4 text-xs md:text-sm lg:text-base flex items-center gap-2">🏆 Autoridade e Prova <span className="text-gray-600 text-[9px] md:text-[10px] bg-black px-2 py-0.5 rounded uppercase">Feed 4:5</span></h4>
                            <div className="w-full aspect-[4/5] bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
                                <img src={getImageUrl('image3')} alt="V3" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[80px] md:min-h-[120px]">
                                <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{clone.variante3}</p>
                            </div>
                            <button onClick={() => handleCopy(clone.variante3, 'v3')} className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 md:py-2.5 rounded-lg text-gray-300 font-medium text-xs md:text-sm transition-colors">
                                {copiedContent === 'v3' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedContent === 'v3' ? 'Copiado para Área de Transferência' : 'Copiar Copywriting'}
                            </button>
                            {clone.image3 && (
                                <a href={getImageUrl('image3')} download={`variante-3-${clone.id}.png`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
                                    Abrir Imagem em Alta
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-auto w-full border font-bold py-2 sm:py-3 md:py-4 lg:py-5 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base ${isExpanded
                    ? 'bg-[#151515] hover:bg-[#222] border-[#333] text-gray-400'
                    : 'bg-green-600/10 hover:bg-green-600/20 border-green-500/20 text-green-500 hover:border-green-500/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    }`}
            >
                {isExpanded ? (
                    <>Recolher Pack <ChevronUp size={18} className="md:w-5 md:h-5" /></>
                ) : (
                    <>Expandir Pack Completo <ChevronDown size={18} className="md:w-5 md:h-5" /></>
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
