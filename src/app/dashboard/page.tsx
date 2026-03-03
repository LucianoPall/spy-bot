"use client";

import { useState } from "react";
import { Search, Loader2, Copy, CheckCircle2, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCloning = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch("/api/spy-engine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adUrl: url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ocorreu um erro ao processar o anúncio.");
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Clonador de Alta Conversão</h2>
                <p className="text-gray-400">Insira a URL de um anúncio concorrente da Biblioteca de Anúncios do Meta para roubar a estratégia e gerar 3 copies matadoras.</p>
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

                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Novas Variações Geradas (Sua Vantagem Desleal)</h3>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Variante 1: Dor */}
                        <VariationCard
                            title="🔥 Variante 1: Foco na Dor"
                            text={result.generatedVariations?.variante1}
                            index={1}
                            copied={copiedIndex === 1}
                            onCopy={() => copyToClipboard(result.generatedVariations?.variante1, 1)}
                        />

                        {/* Variante 2: Benefício */}
                        <VariationCard
                            title="✨ Variante 2: Solução Direta"
                            text={result.generatedVariations?.variante2}
                            index={2}
                            copied={copiedIndex === 2}
                            onCopy={() => copyToClipboard(result.generatedVariations?.variante2, 2)}
                        />

                        {/* Variante 3: Storytelling */}
                        <VariationCard
                            title="📖 Variante 3: Storytelling Rápido"
                            text={result.generatedVariations?.variante3}
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

function VariationCard({ title, text, index, copied, onCopy }: { title: string, text: string, index: number, copied: boolean, onCopy: () => void }) {
    if (!text) return null;

    return (
        <div className="bg-gradient-to-b from-[#151515] to-[#0a0a0a] border border-[#222] hover:border-green-500/50 transition-colors rounded-xl p-5 flex flex-col group relative">
            <h4 className="font-semibold text-gray-200 mb-3">{title}</h4>
            <div className="text-sm text-gray-400 flex-1 whitespace-pre-wrap mb-4">
                {text}
            </div>
            <button
                onClick={onCopy}
                className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-[#222] group-hover:bg-green-900/20 group-hover:text-green-400 text-gray-300 rounded transition-all text-sm font-medium"
            >
                {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? "Texto Copiado!" : "Copiar Copy"}
            </button>
        </div>
    )
}
