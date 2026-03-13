"use client";

import { useState, useEffect } from "react";
import { Save, UserCircle2, Building2, Target, MessageSquare, Loader2, Key, Crown, Zap, AlertCircle } from "lucide-react";

const SUGGESTED_NICHES = [
    "Estética Facial",
    "Emagrecimento",
    "Imóveis",
    "E-commerce",
    "Cursos Digitais",
    "Marketing Digital",
    "Saúde e Bem-estar",
    "Moda e Vestuário",
    "Pets",
    "Finanças Pessoais"
];

interface SubscriptionData {
    credits_remaining: number;
    plan: string;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

    const [profile, setProfile] = useState({
        companyName: "",
        niche: "",
        targetAudience: "",
        toneOfVoice: "",
        openaiKey: ""
    });

    useEffect(() => {
        // Fetch subscription data and load profile
        const initializeData = async () => {
            try {
                const stored = localStorage.getItem("spybot_brand_profile");
                if (stored) {
                    // eslint-disable-next-line
                    setProfile(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to parse profile", e);
            }

            try {
                const response = await fetch("/api/subscription-data");
                if (response.ok) {
                    const data = await response.json();
                    // eslint-disable-next-line
                    setSubscription(data);
                }
            } catch (error) {
                console.error("Failed to fetch subscription data:", error);
            }

            // eslint-disable-next-line
            setLoading(false);
        };

        initializeData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        // Simulando delay de salvamento para dar sensação de persistência
        setTimeout(() => {
            localStorage.setItem("spybot_brand_profile", JSON.stringify(profile));
            setSaving(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }, 800);
    };

    if (loading) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Painel de Assinatura (Monetização) */}
            <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222] rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Crown className="text-yellow-500" size={24} /> Seu Plano e Uso
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 flex flex-col justify-center">
                        <span className="text-sm text-gray-400 font-medium mb-1">Status da Conta</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-200">
                                {subscription?.plan === 'pro' ? 'Plano PRO' : 'Plano Grátis'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                subscription?.plan === 'pro'
                                    ? 'bg-green-900 text-green-400'
                                    : 'bg-gray-800 text-gray-400'
                            }`}>
                                {subscription?.plan === 'pro' ? 'PRO' : 'STARTER'}
                            </span>
                        </div>
                    </div>
                    <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-4 flex flex-col justify-center">
                        <span className="text-sm text-gray-400 font-medium mb-2">Extrações Livres no Mês</span>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-green-500 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                    style={{
                                        width: subscription ? `${(subscription.credits_remaining / 5) * 100}%` : '40%'
                                    }}
                                ></div>
                            </div>
                            <span className="text-sm font-bold text-green-400 whitespace-nowrap">
                                {subscription ? `${subscription.credits_remaining} de 5 Restantes` : '- de 5 Restantes'}
                            </span>
                        </div>
                    </div>
                </div>

                <button className="w-full relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3">
                        <Zap className="fill-white" size={20} />
                        Desbloquear Múltiplas Contas e Geração Ilimitada - Assine o PRO
                    </div>
                </button>
            </div>

            <hr className="border-[#1a1a1a]" />

            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <UserCircle2 className="text-green-500" size={32} />
                    Perfil Inteligente da Marca
                </h2>
                <p className="text-gray-400">
                    Preencha os dados do seu negócio (ou do seu cliente). O Spy Bot usará essa identidade secretamente para que as copies e as imagens geradas fiquem com a cara perfeita da sua empresa, evitando textos genéricos.
                </p>
            </div>

            <form onSubmit={handleSave} className="bg-[#111] border border-[#222] rounded-xl p-6 md:p-8 shadow-2xl space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Empresa */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Building2 size={16} className="text-green-500" /> Nome do Especialista ou Empresa
                        </label>
                        <input
                            type="text"
                            name="companyName"
                            value={profile.companyName}
                            onChange={handleChange}
                            placeholder="Ex: Dr. Lucas ou Clínica Diamante"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>

                    {/* Nicho */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Target size={16} className="text-green-500" /> Nicho de Mercado
                        </label>
                        <input
                            type="text"
                            name="niche"
                            value={profile.niche}
                            onChange={handleChange}
                            placeholder="Ex: Estética Facial, Emagrecimento, Imóveis de Luxo"
                            list="niches-list"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                        />
                        <datalist id="niches-list">
                            {SUGGESTED_NICHES.map((niche) => (
                                <option key={niche} value={niche} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* Público Alvo */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <UserCircle2 size={16} className="text-green-500" /> Quem é o seu Público-Alvo Ideal?
                    </label>
                    <textarea
                        name="targetAudience"
                        value={profile.targetAudience}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Ex: Mulheres de 30 a 50 anos, mães, que se sentem inseguras com o corpo pós-gravidez e têm poder aquisitivo classe B."
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors resize-none"
                    />
                </div>

                {/* Tom de Voz */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <MessageSquare size={16} className="text-green-500" /> Tom de Voz e Estilo Desejado
                    </label>
                    <textarea
                        name="toneOfVoice"
                        value={profile.toneOfVoice}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Ex: Autoridade médica, acolhedor mas firme, estilo direto ao ponto (Hard Sell), escassez fortíssima."
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors resize-none"
                    />
                </div>

                {/* Chave da OpenAI - APENAS para plano PRO */}
                {subscription && subscription.plan === 'pro' && (
                    <div className="space-y-2 mt-6 p-4 border border-green-500/20 bg-green-900/10 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 bg-green-500/20 text-green-400 text-xs font-bold rounded-bl-lg">
                            Recurso PRO
                        </div>
                        <label className="text-sm font-medium text-green-400 flex items-center gap-2">
                            <Key size={16} /> Sua Própria Chave da API OpenAI (Opcional)
                        </label>
                        <p className="text-xs text-green-500/70 mb-2">
                            Se você usa muito o sistema, insira sua chave sk-* aqui para pagar direto para a OpenAI e não consumir os créditos inclusos no PRO. A chave fica salva apenas no seu navegador.
                        </p>
                        <input
                            type="password"
                            name="openaiKey"
                            value={profile.openaiKey}
                            onChange={handleChange}
                            placeholder="sk-proj-..."
                            className="w-full bg-[#050505] border border-green-500/40 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors font-mono text-sm"
                        />
                    </div>
                )}

                {/* Aviso para usuários grátis */}
                {subscription && subscription.plan === 'gratis' && subscription.credits_remaining === 0 && (
                    <div className="space-y-2 mt-6 p-4 border border-yellow-500/20 bg-yellow-900/10 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-yellow-500 mt-1 shrink-0" size={20} />
                            <div>
                                <p className="text-sm font-medium text-yellow-400 mb-1">Seus créditos grátis acabaram!</p>
                                <p className="text-xs text-yellow-300/80">
                                    Assine o plano PRO ($97) para continuar usando. Após o upgrade, você poderá adicionar sua própria Chave da OpenAI aqui.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-[#222] flex items-center justify-between">
                    <div className="text-sm">
                        {success && <span className="text-green-400 font-medium">✨ Perfil salvo com sucesso! O Spy Bot já está ciente.</span>}
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Salvar Identidade
                    </button>
                </div>
            </form>
        </div>
    );
}
