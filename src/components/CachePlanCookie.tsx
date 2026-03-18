"use client";

import { useEffect } from "react";

/**
 * Componente que cacheia o plano do usuário em cookies
 * Chamado apenas quando não há cache (para otimizar)
 */
export function CachePlanCookie({ shouldCache }: { shouldCache: boolean }) {
    useEffect(() => {
        if (!shouldCache) return;

        // Chamar endpoint para cachear o plano
        fetch("/api/set-user-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        }).catch(error => {
            // Log silencioso - não quebra a UI
            console.log("Cache de plano agendado em background");
        });
    }, [shouldCache]);

    return null; // Componente invisível
}
