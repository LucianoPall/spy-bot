import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Route Handler para cachear o plano do usuário em cookies
 * Chamado quando não há cache, para evitar queries repetidas
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ✅ Buscar plano do usuário
        const { data: sub } = await supabase
            .from('spybot_subscriptions')
            .select('plan')
            .eq('user_id', user.id)
            .single();

        const isPro = sub?.plan === 'pro';

        // 💾 AGORA SIM: SET do cookie em Route Handler (permitido!)
        const cookieStore = await cookies();
        cookieStore.set('user_plan', isPro ? 'pro' : 'free', {
            maxAge: 300, // 5 minutos
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return NextResponse.json({
            success: true,
            isPro,
            message: "Plano cacheado com sucesso"
        });
    } catch (error) {
        console.error("Erro ao cachear plano:", error);
        return NextResponse.json(
            { error: "Erro ao cachear plano" },
            { status: 500 }
        );
    }
}
