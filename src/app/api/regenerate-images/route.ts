import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Endpoint para regenerar imagens de clones antigos
 * Se imagens expiram (URLs DALL-E), este endpoint:
 * 1. Faz re-download das imagens
 * 2. Envia para Supabase Storage (permanente)
 * 3. Atualiza o banco com URLs novas
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { generationId } = await request.json();

        if (!generationId) {
            return NextResponse.json({ error: 'generationId é obrigatório' }, { status: 400 });
        }

        // Buscar a geração
        const { data: generation, error: fetchError } = await supabase
            .from('spybot_generations')
            .select('*')
            .eq('id', generationId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !generation) {
            return NextResponse.json({ error: 'Geração não encontrada' }, { status: 404 });
        }

        console.log('[REGENERATE-IMAGES] Processando geração', { id: generationId });

        // Função auxiliar para fazer upload
        const uploadImageToSupabase = async (imageUrl: string, imageName: string): Promise<string | null> => {
            try {
                if (!imageUrl || !imageUrl.includes('http')) return null;

                // Skip se já é Supabase (já está permanente)
                if (imageUrl.includes('supabase')) {
                    console.log(`[REGENERATE] Imagem ${imageName} já é permanente (Supabase)`);
                    return imageUrl;
                }

                console.log(`[REGENERATE] Fazendo download de ${imageName}...`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                const response = await fetch(imageUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
                if (!response.ok) {
                    console.warn(`[REGENERATE] Download falhou para ${imageName}`);
                    return null;
                }

                const buffer = await response.arrayBuffer();
                const fileName = `${user.id}/${Date.now()}_${imageName}_recovered.png`;

                console.log(`[REGENERATE] Upload de ${imageName}...`);

                const { data, error: uploadError } = await supabase
                    .storage
                    .from('spybot_images')
                    .upload(fileName, buffer, {
                        contentType: 'image/png',
                        cacheControl: '31536000',
                        upsert: false
                    });

                if (uploadError || !data) {
                    console.warn(`[REGENERATE] Upload falhou para ${imageName}`, uploadError);
                    return null;
                }

                const { data: publicData } = supabase
                    .storage
                    .from('spybot_images')
                    .getPublicUrl(data.path);

                const publicUrl = publicData?.publicUrl;
                console.log(`[REGENERATE] ✅ ${imageName} recuperada permanentemente`);
                return publicUrl || null;
            } catch (err) {
                console.error(`[REGENERATE] Erro com ${imageName}`, err);
                return null;
            }
        };

        // Re-fazer upload das 3 imagens em paralelo
        const [newImage1, newImage2, newImage3] = await Promise.all([
            uploadImageToSupabase(generation.image1, 'image1'),
            uploadImageToSupabase(generation.image2, 'image2'),
            uploadImageToSupabase(generation.image3, 'image3')
        ]);

        // Atualizar no banco apenas se conseguiu fazer upload
        const updateData: Record<string, string> = {};
        if (newImage1) updateData.image1 = newImage1;
        if (newImage2) updateData.image2 = newImage2;
        if (newImage3) updateData.image3 = newImage3;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Não foi possível recuperar nenhuma imagem',
                generation
            });
        }

        const { data: updated, error: updateError } = await supabase
            .from('spybot_generations')
            .update(updateData)
            .eq('id', generationId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('[REGENERATE] Erro ao atualizar banco', updateError);
            return NextResponse.json({
                success: false,
                message: 'Erro ao atualizar banco de dados',
                recovered: updateData
            }, { status: 500 });
        }

        console.log('[REGENERATE] ✅ Imagens recuperadas com sucesso', { generationId });

        return NextResponse.json({
            success: true,
            message: 'Imagens recuperadas com sucesso',
            recovered: updateData,
            generation: updated
        });

    } catch (error: unknown) {
        console.error('[REGENERATE-IMAGES] Erro crítico', error);
        return NextResponse.json({
            error: 'Erro ao regenerar imagens',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
