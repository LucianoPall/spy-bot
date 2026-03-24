import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não autenticado' },
                { status: 401 }
            );
        }

        const adminEmail = process.env.ADMIN_EMAIL;

        // Verificar se é o admin
        if (user.email !== adminEmail) {
            return NextResponse.json(
                { error: 'Você não é o admin. Seu email: ' + user.email },
                { status: 403 }
            );
        }

        // Atualizar ou criar subscription como PRO
        const { data, error } = await supabase
            .from('spybot_subscriptions')
            .upsert(
                {
                    user_id: user.id,
                    plan: 'pro',
                    credits: 999,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'user_id' }
            );

        if (error) {
            console.error('Erro ao atualizar subscription:', error);
            return NextResponse.json(
                { error: 'Erro ao configurar admin: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '✅ Admin configurado com sucesso!',
            data: {
                userId: user.id,
                email: user.email,
                plan: 'pro',
                credits: 999
            }
        });
    } catch (error: unknown) {
        console.error('Erro crítico:', error);
        return NextResponse.json(
            { error: 'Erro no servidor' },
            { status: 500 }
        );
    }
}
