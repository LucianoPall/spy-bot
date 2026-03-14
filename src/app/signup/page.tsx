"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Mail, ChevronRight } from "lucide-react";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validar email
        if (!email.includes("@")) {
            setError("Por favor, insira um email válido.");
            setLoading(false);
            return;
        }

        // Validar senha
        if (password.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.");
            setLoading(false);
            return;
        }

        const { data, error: signupError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signupError) {
            setError(signupError.message || "Erro ao criar conta. Tente novamente.");
            setLoading(false);
        } else if (data?.user) {
            setSuccess("✅ Conta criada com sucesso! Redirecionando...");
            // Fazer login automático após signup
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!loginError) {
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            } else {
                setError("Conta criada, mas falha no login automático. Tente fazer login.");
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
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
                        <h2 className="text-2xl font-semibold mt-4">Criar Conta</h2>
                        <p className="text-gray-400 mt-2">
                            Crie sua conta para acessar o clonador de anúncios milionários.
                        </p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
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
                            <label className="block text-sm font-medium text-gray-400 mb-2">Senha (Mínimo 6 caracteres)</label>
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

                        {success && (
                            <div className="p-3 bg-green-900/30 border border-green-500/50 rounded text-green-400 text-sm">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
                        >
                            <span>{loading ? "Criando conta..." : "Criar Conta"}</span>
                            {!loading && <ChevronRight className="h-5 w-5" />}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-gray-600">
                        Já tem conta? <Link href="/login" className="text-green-500 hover:underline">Faça login aqui.</Link>
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
                    <h2 className="text-3xl font-bold mb-4">Bem-vindo ao Spy Bot</h2>
                    <p className="text-gray-400 text-lg">
                        Junte-se à comunidade de empreendedores que estão clonando campanhas milionárias em segundos.
                    </p>
                </div>
            </div>
        </div>
    );
}
