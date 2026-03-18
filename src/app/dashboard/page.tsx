"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Copy, CheckCircle2, AlertTriangle, Download, Brain } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ActiveProfileBanner from "@/components/ActiveProfileBanner";
import KPICards from "@/components/KPICards";
import ImageTypeIndicator from "@/components/ImageTypeIndicator";

interface GeneratedImage {
    url: string;
    type: 'generated' | 'placeholder' | 'fallback';
    niche?: string;
}

interface StrategicAnalysis {
    hook?: string;
    promise?: string;
    emotion?: string;
    cta?: string;
    persuasion_structure?: string;
    angle?: string;
    offer_type?: string;
}

interface GenerationResult {
    originalAd?: {
        copy?: string;
        image?: string;
        isMockData?: boolean;
        warning?: string;
    };
    generatedVariations?: { variante1?: string; variante2?: string; variante3?: string };
    generatedImages?: {
        image1?: GeneratedImage | string;
        image2?: GeneratedImage | string;
        image3?: GeneratedImage | string;
    };
    strategicAnalysis?: StrategicAnalysis;
}

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        const urlParam = searchParams.get("url");
        if (urlParam) {
            setUrl(decodeURIComponent(urlParam));
        }
    }, [searchParams]);

    const handleCloning = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            // Resgatando o Perfil Inteligente da Marca do Cliente
            let brandProfile = null;
            try {
                const storedProfile = localStorage.getItem("spybot_brand_profile");
                if (storedProfile) {
                    try {
                        brandProfile = JSON.parse(storedProfile);
                    } catch (parseError) {
                        console.error("Profile JSON inválido, removendo cache corrompido", parseError);
                        localStorage.removeItem("spybot_brand_profile"); // Limpar cache ruim
                    }
                }
            } catch (storageError) {
                console.error("Erro ao acessar localStorage:", storageError);
            }

            const response = await fetch("/api/spy-engine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adUrl: url, brandProfile }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ocorreu um erro ao processar o anúncio.");
            }

            // Garante que imagens estão presentes com tipo apropriado (fallback se necessário)
            const defaultFallbackImage: GeneratedImage = {
                url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
                type: 'fallback',
            };

            const result = {
                ...data,
                generatedImages: {
                    image1: data.generatedImages?.image1 || defaultFallbackImage,
                    image2: data.generatedImages?.image2 || defaultFallbackImage,
                    image3: data.generatedImages?.image3 || defaultFallbackImage,
                }
            };

            // 🔍 LOG DETALHADO PARA DEBUGAR IMAGENS
            console.log('[Dashboard] 🖼️ IMAGENS RECEBIDAS DO BACKEND:', {
                raw: {
                    image1: data.generatedImages?.image1,
                    image2: data.generatedImages?.image2,
                    image3: data.generatedImages?.image3,
                },
                processed: {
                    image1: result.generatedImages?.image1,
                    image2: result.generatedImages?.image2,
                    image3: result.generatedImages?.image3,
                }
            });

            console.log('[Dashboard] Processamento completo:', {
                hasMockData: result.originalAd?.isMockData,
                variationsCount: [result.generatedVariations?.variante1, result.generatedVariations?.variante2, result.generatedVariations?.variante3].filter(Boolean).length,
                imagesTypes: {
                    image1: typeof result.generatedImages?.image1 === 'object' ? result.generatedImages.image1.type : 'string',
                    image2: typeof result.generatedImages?.image2 === 'object' ? result.generatedImages.image2.type : 'string',
                    image3: typeof result.generatedImages?.image3 === 'object' ? result.generatedImages.image3.type : 'string',
                },
                imageUrls: {
                    image1: typeof result.generatedImages?.image1 === 'object' ? result.generatedImages.image1?.url?.substring(0, 80) : result.generatedImages?.image1?.substring(0, 80),
                    image2: typeof result.generatedImages?.image2 === 'object' ? result.generatedImages.image2?.url?.substring(0, 80) : result.generatedImages?.image2?.substring(0, 80),
                    image3: typeof result.generatedImages?.image3 === 'object' ? result.generatedImages.image3?.url?.substring(0, 80) : result.generatedImages?.image3?.substring(0, 80),
                }
            });

            setResult(result);
        } catch (err: unknown) {
            setError((err as { message?: string } | undefined)?.message || 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string | undefined, index: number) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="w-full">
            {/* Active Profile Banner */}
            <ActiveProfileBanner />

            {/* KPI Cards */}
            <KPICards />

            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Clonador & Criativo AI</h2>
                <p className="text-gray-400">Insira a URL de um anúncio concorrente da Biblioteca do Meta para mapear a estratégia e gerar <strong>3 copies matadoras + 3 artes de design prontas</strong>.</p>
            </div>

            {/* Área de Input */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 shadow-2xl mb-8">
                <form onSubmit={handleCloning} className="flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                            type="url"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Cole aqui o link do FaceAds (https://www.facebook.com/ads/library/?id=...)"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="md:w-48 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={20} /> Rodando IA...</>
                        ) : (
                            <>Clonar Agora</>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400">
                        <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>

            {/* Resultados */}
            {result && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Aviso se dados são mock/gerados */}
                    {result.originalAd?.isMockData && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
                            <div className="flex-shrink-0 text-yellow-500 text-xl">⚠️</div>
                            <div className="flex-1">
                                <p className="text-yellow-200 font-semibold">Dados Gerados Automaticamente</p>
                                <p className="text-yellow-100/80 text-sm mt-1">
                                    {result.originalAd?.warning || "O anúncio original não pôde ser extraído completamente. As imagens e textos abaixo foram gerados automaticamente baseado em análise de padrões similares."}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        {/* Foto Original Escrapada */}
                        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-[#222] pb-2">Imagem/Thumbnail Extraída</h3>
                            {result.originalAd?.image ? (
                                <img src={result.originalAd.image} alt="Anúncio Base" className="w-full rounded-lg border border-[#333]" />
                            ) : (
                                <div className="h-48 bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-dashed border-[#333] text-gray-600">
                                    Nenhuma imagem encontrada
                                </div>
                            )}
                        </div>

                        {/* Texto Original */}
                        <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-[#222] pb-2">Copy Original (O que ele fez)</h3>
                            <div className="flex-1 bg-[#0a0a0a] p-4 rounded-lg border border-[#222] text-sm text-gray-400 overflow-y-auto max-h-64 whitespace-pre-wrap">
                                {result.originalAd?.copy || "Texto não identificado"}
                            </div>
                        </div>
                    </div>

                    <hr className="border-[#222] my-8" />

                    {result?.strategicAnalysis && Object.values(result.strategicAnalysis).some(Boolean) && (
                        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-5 border-b border-[#222] pb-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Brain size={20} className="text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Análise Estratégica Profunda</h3>
                                    <p className="text-xs text-gray-500">DNA persuasivo decodificado pelo Spy Bot</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                <StrategicField label="Gancho" value={result.strategicAnalysis.hook} color="purple" />
                                <StrategicField label="Promessa" value={result.strategicAnalysis.promise} color="blue" />
                                <StrategicField label="Emoção" value={result.strategicAnalysis.emotion} color="pink" />
                                <StrategicField label="CTA" value={result.strategicAnalysis.cta} color="green" />
                                <StrategicField label="Estrutura" value={result.strategicAnalysis.persuasion_structure} color="yellow" />
                                <StrategicField label="Ângulo" value={result.strategicAnalysis.angle} color="orange" />
                                <StrategicField label="Tipo de Oferta" value={result.strategicAnalysis.offer_type} color="cyan" />
                            </div>
                        </div>
                    )}

                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Novas Variações Geradas (Sua Vantagem Desleal)</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        {/* Variante 1: Dor */}
                        <VariationCard
                            title="🔥 Variante 1: Foco na Dor"
                            text={result.generatedVariations?.variante1}
                            imageUrl={result.generatedImages?.image1}
                            index={1}
                            copied={copiedIndex === 1}
                            onCopy={() => copyToClipboard(result.generatedVariations?.variante1, 1)}
                        />

                        {/* Variante 2: Benefício */}
                        <VariationCard
                            title="✨ Variante 2: Solução Direta"
                            text={result.generatedVariations?.variante2}
                            imageUrl={result.generatedImages?.image2}
                            index={2}
                            copied={copiedIndex === 2}
                            onCopy={() => copyToClipboard(result.generatedVariations?.variante2, 2)}
                        />

                        {/* Variante 3: Autoridade e Prova */}
                        <VariationCard
                            title="🏆 Variante 3: Autoridade e Prova"
                            text={result.generatedVariations?.variante3}
                            imageUrl={result.generatedImages?.image3}
                            index={3}
                            copied={copiedIndex === 3}
                            onCopy={() => copyToClipboard(result.generatedVariations?.variante3, 3)}
                        />
                    </div>

                </div>
            )}
        </div>
    );
}

function VariationCard({
    title,
    text,
    imageUrl,
    index,
    copied,
    onCopy,
}: {
    title: string;
    text: string | undefined;
    imageUrl?: GeneratedImage | string;
    index: number;
    copied: boolean;
    onCopy: () => void;
}) {
    const [downloading, setDownloading] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // Extrair URL e tipo da imagem
    const imageData = typeof imageUrl === 'object' ? imageUrl : { url: imageUrl, type: 'generated' as const };
    const finalImageUrl = imageData?.url;
    const imageType = imageData?.type || 'generated';

    // Debug: Log detalhado da imagem
    useEffect(() => {
        const isDalle = finalImageUrl?.includes('oaidalleapiprodscus');
        const isSupabase = finalImageUrl?.includes('supabase');
        const provider = isDalle ? '🎨 DALL-E' : isSupabase ? '☁️ Supabase' : '🌐 Unsplash';

        console.log(`[Variante ${index}] Imagem:`, {
            provider,
            type: imageType,
            url: finalImageUrl?.substring(0, 80),
            isObject: typeof imageUrl === 'object',
            isDalleTemp: isDalle && imageType === 'generated'
        });
        setImageFailed(false);
        setImageLoading(true);
    }, [imageUrl, index, imageType, finalImageUrl]);

    if (!text) return null;

    const handleDownloadImage = async () => {
        if (!finalImageUrl) return;
        setDownloading(true);
        try {
            console.log(`[Download Variante ${index}] Iniciando download:`, { imageType, url: finalImageUrl.substring(0, 50) });
            // Usa o proxy para contornar bloqueios CORS
            const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(finalImageUrl)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `CopySpy_Arte_Variante${index}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            console.log(`[Download Variante ${index}] Download concluído com sucesso`);
        } catch (error) {
            console.error(`[Download Variante ${index}] Erro ao baixar imagem:`, error);
            alert("Não foi possível baixar a imagem. Tente novamente.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-gradient-to-b from-[#151515] to-[#0a0a0a] border border-[#222] hover:border-green-500/50 transition-colors rounded-xl p-5 flex flex-col group relative overflow-hidden">
            {finalImageUrl && !imageFailed ? (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border border-[#333] shrink-0 group/image bg-[#0a0a0a]">
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
                            <Loader2 className="animate-spin text-gray-600" size={24} />
                        </div>
                    )}
                    <img
                        src={`/api/proxy-image?url=${encodeURIComponent(finalImageUrl)}`}
                        alt={title}
                        className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500"
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                            console.warn(`[Variante ${index}] Imagem não carregou - usando fallback`);
                            setImageFailed(true);
                            setImageLoading(false);
                        }}
                    />

                    {/* Badge Indicador de Tipo */}
                    <ImageTypeIndicator type={imageType} niche="Marketing" />

                    {/* Tooltip para placeholders */}
                    {imageType === 'placeholder' && (
                        <div className="absolute bottom-2 left-2 bg-yellow-900/80 text-yellow-100 text-xs px-2 py-1 rounded opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 max-w-[80%]">
                            Esta é uma imagem de placeholder. Use-a como referência para criar sua própria arte.
                        </div>
                    )}

                    {/* Overlay Escuro com Botão de Download */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                            onClick={handleDownloadImage}
                            disabled={downloading || imageLoading}
                            className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transform translate-y-4 group-hover/image:translate-y-0 transition-transform duration-300 shadow-xl disabled:opacity-50"
                            title="Baixar Arte para Campanhas"
                        >
                            {downloading ? (
                                <><Loader2 className="animate-spin" size={18} /> Baixando...</>
                            ) : (
                                <><Download size={18} /> Baixar Arte</>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full h-48 mb-4 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-dashed border-[#444] flex flex-col items-center justify-center text-gray-500 text-sm space-y-2">
                    {imageFailed ? (
                        <>
                            <div className="text-3xl">⚠️</div>
                            <p>Imagem não carregou</p>
                            <p className="text-xs text-gray-600 text-center max-w-xs">(Verifique sua conexão ou tente novamente)</p>
                        </>
                    ) : (
                        <>
                            <div className="text-3xl">🖼️</div>
                            <p>Carregando imagem...</p>
                        </>
                    )}
                </div>
            )}
            <h4 className="font-semibold text-gray-200 mb-3">{title}</h4>
            <div className="text-sm text-gray-400 flex-1 whitespace-pre-wrap mb-4">
                {text}
            </div>
            <button
                onClick={onCopy}
                className="mt-auto flex flex-none items-center justify-center gap-2 w-full py-2 bg-[#222] group-hover:bg-green-900/20 group-hover:text-green-400 text-gray-300 rounded transition-all text-sm font-medium"
            >
                {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? "Texto Copiado!" : "Copiar Copy"}
            </button>
        </div>
    )
}

const colorClasses: Record<string, string> = {
  purple: "text-purple-400 bg-purple-500/10 border-purple-700/30",
  blue:   "text-blue-400 bg-blue-500/10 border-blue-700/30",
  pink:   "text-pink-400 bg-pink-500/10 border-pink-700/30",
  green:  "text-green-400 bg-green-500/10 border-green-700/30",
  yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-700/30",
  orange: "text-orange-400 bg-orange-500/10 border-orange-700/30",
  cyan:   "text-cyan-400 bg-cyan-500/10 border-cyan-700/30",
};

function StrategicField({ label, value, color = "gray" }: { label: string; value?: string; color?: string }) {
  if (!value) return null;
  const cls = colorClasses[color] || "text-gray-400 bg-gray-500/10 border-gray-700/30";
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p className="text-xs leading-snug">{value}</p>
    </div>
  );
}
