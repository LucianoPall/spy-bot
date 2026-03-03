"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Mail, ChevronRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError("Credenciais inválidas. Verifique seu e-mail e senha.");
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex text-[#e2e8f0] bg-[#050505]">
            {/* Lado Esquerdo - Forms */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 border-r border-[#1a1a1a]">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                            Spy Bot
                        </h1>
                        <h2 className="text-2xl font-semibold mt-4">Acesso Restrito</h2>
                        <p className="text-gray-400 mt-2">
                            Insira as credenciais recebidas após a compra para acessar o clonador.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">E-mail de Compra</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Senha (Token)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-all"
                        >
                            <span>{loading ? "Acessando..." : "Entrar no Painel"}</span>
                            {!loading && <ChevronRight className="h-5 w-5" />}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-gray-600">
                        Ainda não tem acesso? <a href="/" className="text-green-500 hover:underline">Adquira sua licença.</a>
                    </p>
                </div>
            </div>

            {/* Lado Direito - Branding (Visível apenas em Desktop) */}
            <div className="hidden lg:flex w-1/2 bg-[#0a0a0a] items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-green-900/10 blur-[100px] rounded-full"></div>
                <div className="relative z-10 max-w-lg text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.3)]">
                        <Lock className="w-12 h-12 text-black" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">A Área Segura dos Players Ocultos.</h2>
                    <p className="text-gray-400 text-lg">
                        Você está prestes a entrar no ambiente onde copiamos campanhas milionárias em segundos. Mantenha seu login em segurança.
                    </p>
                </div>
            </div>
        </div>
    );
}
