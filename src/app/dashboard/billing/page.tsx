import { createClient } from "@/utils/supabase/server";
import { CreditCard, Zap, CheckCircle2, AlertCircle, Key } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Buscar status logado
    const { data: sub } = await supabase.from('spybot_subscriptions').select('*').eq('user_id', user.id).single();

    // Se não existir na tabela ainda, os defaults são aplicados
    const currentCredits = sub?.credits ?? 5;
    const currentPlan = sub?.plan ?? "gratis";
    const isPro = currentPlan === "pro";

    // Busca se usuário tem BYOK ativado para mostrar status
    const { data: profile } = await supabase.from('spybot_brand_profile').select('openai_key').eq('user_id', user.id).single();
    const hasByok = profile?.openai_key && profile.openai_key.trim() !== "";

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="text-green-500" size={32} />
                    Assinatura e Créditos
                </h1>
                <p className="text-gray-400 mt-2">
                    Gerencie seu plano, controle seus limites de clones mensais e desbloqueie o poder ilimitado.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Painel do Plano Atual */}
                <div className="bg-[#111] border border-[#222] p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-0"></div>
                    <div className="relative z-10">
                        <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Seu Plano Atual</h2>
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-4xl font-extrabold text-white">
                                {isPro ? "Plano PRO" : "Plano Grátis"}
                            </span>
                            {isPro && <span className="bg-green-500 text-black text-xs font-bold px-2 py-1 rounded">ATIVO</span>}
                        </div>

                        {!isPro && (
                            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Extrações Lives no Mês</span>
                                    <span className="text-white font-bold">{currentCredits} de 5 Restantes</span>
                                </div>
                                <div className="w-full bg-[#0a0a0a] rounded-full h-3 mb-4 overflow-hidden border border-[#222]">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-1000 ${currentCredits <= 1 ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${(currentCredits / 5) * 100}%` }}
                                    ></div>
                                </div>
                                {currentCredits <= 0 && !hasByok && (
                                    <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <p>Seus créditos acabaram! Assine o PRO ou insira sua chave da OpenAI nas Configurações para continuar usando sem pagar mensalidade (BYOK).</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={18} className={isPro ? "text-green-500" : "text-gray-500"} />
                                <span>Gerações de Imagem DALL-E 3</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={18} className={isPro ? "text-green-500" : "text-gray-500"} />
                                <span>Mapeamento de Copywriting IA</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={18} className={isPro ? "text-green-500" : "text-gray-600 opacity-50"} />
                                <span>Extração Ilimitada de Anúncios</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={18} className={isPro ? "text-green-500" : "text-gray-600 opacity-50"} />
                                <span>Desbloqueio de Múltiplas Contas</span>
                            </div>
                        </div>

                        {hasByok && !isPro && (
                            <div className="mt-6 flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl text-purple-400">
                                <Key size={24} className="shrink-0" />
                                <div>
                                    <p className="text-sm font-bold">Modo Hacker Ativo (BYOK)</p>
                                    <p className="text-xs opacity-80">Suas extrações usarão seu próprio saldo da OpenAI independentemente dos créditos gratuitos.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upsell / Checkout Card */}
                {!isPro && (
                    <div className="group bg-gradient-to-b from-[#1a1c11] to-[#0a0a0a] border border-green-500/30 p-8 rounded-2xl relative flex flex-col items-center text-center hover:border-green-500 transition-all shadow-[0_0_30px_rgba(34,197,94,0.05)] hover:shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-[-50%] bg-green-500 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                            Recomendado
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-full mb-6">
                            <Zap className="text-green-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Spy Bot PRO</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Pare de perder os criativos vitoriosos da concorrência. Desbloqueie todas as limitações e domine o seu nicho.
                        </p>
                        <div className="mb-8">
                            <span className="text-5xl font-extrabold text-white">R$ 97</span>
                            <span className="text-gray-500 text-lg">/mês</span>
                        </div>

                        {/* Link Fictício de Checkout, o usuário poderá mudar para Stripe/Kiwify depois */}
                        <a
                            href="https://pay.kiwify.com.br"
                            target="_blank"
                            className="w-full bg-green-500 hover:bg-green-400 text-black font-extrabold py-3 pr-4 pl-4 rounded-xl transition-all shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2"
                        >
                            <Zap size={18} />
                            Desbloquear Acesso Ilimitado
                        </a>
                        <p className="text-xs text-gray-500 mt-4">Cancele a qualquer momento. Sem fidelidade.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
