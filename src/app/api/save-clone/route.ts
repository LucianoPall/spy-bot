import { NextResponse } from 'next/server';
import { ensureError } from '@/lib/types-common';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const {
            url,
            originalCopy,
            originalImage,
            variante1,
            variante2,
            variante3,
            image1,
            image2,
            image3,
            strategicAnalysis,
        } = body;

        // Salvar no banco de dados
        const { data, error } = await supabase
            .from('spybot_generations')
            .insert({
                user_id: user.id,
                original_url: url,
                original_copy: originalCopy,
                original_image: originalImage,
                variante1,
                variante2,
                variante3,
                image1,
                image2,
                image3,
                strategic_analysis: strategicAnalysis || null,
            })
            .select();

        if (error) {
            console.error('Erro ao salvar clone:', error);
            return NextResponse.json({ error: 'Erro ao salvar clone' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Clone salvo com sucesso!',
            data,
        });
    } catch (err: unknown) {
        const error = ensureError(err);
        console.error('Erro na API save-clone:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao salvar clone' },
            { status: 500 }
        );
    }
}
