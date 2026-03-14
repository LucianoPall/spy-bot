"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Loader2, Copy, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import ActiveProfileBanner from "@/components/ActiveProfileBanner";
import KPICards from "@/components/KPICards";

interface GenerationResult {
    originalAd?: { copy?: string; image?: string };
    generatedVariations?: { variante1?: string; variante2?: string; variante3?: string };
    generatedImages?: { image1?: string; image2?: string; image3?: string };
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
                if (storedProfile) brandProfile = JSON.parse(storedProfile);
            } catch (e) {
                console.error(e);
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

            setResult(data);
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
        <div className="max-w-4xl mx-auto">
            {/* Active Profile Banner */}
            <ActiveProfileBanner />

            {/* KPI Cards */}
            <KPICards />

            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Clonador & Criativo AI</h2>
                <p className="text-gray-400">Insira a URL de um anúncio concorrente da Biblioteca do Meta para mapear a estratégia e gerar <strong>3 copies matadoras + 3 artes de design prontas</strong>.</p>
            </div>

            {/* Área de Input */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-6 shadow-2xl mb-8">
                <form onSubmit={handleCloning} className="flex flex-col md:flex-row gap-4">
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

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Foto Original Escrapada */}
                        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-[#222] pb-2">Imagem/Thumbnail Extraída</h3>
                            {result.originalAd?.image ? (
                                <Image src={result.originalAd.image} alt="Anúncio Base" width={600} height={400} className="w-full rounded-lg border border-[#333]" />
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

                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Novas Variações Geradas (Sua Vantagem Desleal)</h3>

                    <div className="grid md:grid-cols-3 gap-6">
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

                        {/* Variante 3: Storytelling */}
                        <VariationCard
                            title="📖 Variante 3: Storytelling Rápido"
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

function VariationCard({ title, text, imageUrl, index, copied, onCopy }: { title: string, text: string | undefined, imageUrl?: string, index: number, copied: boolean, onCopy: () => void }) {
    const [downloading, setDownloading] = useState(false);

    // Debug: Log da URL
    useEffect(() => {
        console.log(`Variante ${index} - imageUrl:`, imageUrl);
    }, [imageUrl, index]);

    if (!text) return null;

    const handleDownloadImage = async () => {
        if (!imageUrl) return;
        setDownloading(true);
        try {
            // Usa o fetch para pular bloqueios CORS automáticos em âncoras (a href)
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `CopySpy_Arte_Variante${index}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Erro ao baixar. Abrindo em nova aba de fallback.", error);
            window.open(imageUrl, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-gradient-to-b from-[#151515] to-[#0a0a0a] border border-[#222] hover:border-green-500/50 transition-colors rounded-xl p-5 flex flex-col group relative overflow-hidden">
            {imageUrl ? (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border border-[#333] shrink-0 group/image">
                    <Image src={`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`} alt={title} fill className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500" onError={() => console.error(`Erro ao carregar imagem ${index}: ${imageUrl}`)} />

                    {/* Overlay Escuro com Botão de Download (Aparece ao passar o mouse) */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                            onClick={handleDownloadImage}
                            disabled={downloading}
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
                <div className="w-full h-48 mb-4 rounded-lg bg-[#0a0a0a] border border-dashed border-[#333] flex items-center justify-center text-gray-500 text-sm">
                    ⚠️ Imagem não disponível (URL vazia)
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
