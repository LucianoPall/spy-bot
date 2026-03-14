"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function SetupAdminPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSetupAdmin = async () => {
        setLoading(true);
        setMessage("");
        setSuccess(false);

        try {
            const response = await fetch("/api/setup-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setMessage("✅ " + data.message);
                console.log("Admin configurado:", data.data);

                // Redirecionar após 2 segundos
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            } else {
                setMessage("❌ " + (data.error || "Erro ao configurar admin"));
            }
        } catch (error) {
            setMessage("❌ Erro ao conectar com o servidor");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
            <div className="max-w-md w-full bg-[#111] border border-[#222] rounded-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <Crown className="w-16 h-16 text-yellow-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Admin Setup</h1>
                <p className="text-gray-400 mb-8">
                    Clique abaixo para configurar sua conta como ADMIN com créditos ilimitados PRO.
                </p>

                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                            success
                                ? "bg-green-900/30 border border-green-500/50 text-green-400"
                                : "bg-red-900/30 border border-red-500/50 text-red-400"
                        }`}
                    >
                        {success ? (
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm">{message}</p>
                    </div>
                )}

                <button
                    onClick={handleSetupAdmin}
                    disabled={loading || success}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-bold transition-all ${
                        success
                            ? "bg-green-600 text-white cursor-default"
                            : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white disabled:opacity-50"
                    }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Configurando...
                        </>
                    ) : success ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Pronto!
                        </>
                    ) : (
                        <>
                            <Crown className="w-5 h-5" />
                            Ativar ADMIN PRO
                        </>
                    )}
                </button>

                <p className="text-xs text-gray-500 mt-6">
                    Você será redirecionado para o dashboard em breve.
                </p>
            </div>
        </div>
    );
}
