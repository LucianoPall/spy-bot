import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Endpoint para limpar TODOS os clones do usuário
 * Deleta registros do banco de dados e imagens do Storage
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        // 1. Buscar todos os clones do usuário para deletar imagens
        const { data: clones, error: fetchError } = await supabase
            .from('spybot_generations')
            .select('id, image1, image2, image3')
            .eq('user_id', user.id);

        if (fetchError) {
            console.error("Erro ao buscar clones:", fetchError);
            return NextResponse.json(
                { error: "Erro ao buscar clones" },
                { status: 500 }
            );
        }

        // 2. Deletar imagens do Storage
        if (clones && clones.length > 0) {
            for (const clone of clones) {
                // Deletar imagens do Storage (se existirem)
                const filesToDelete = [];

                if (clone.image1 && clone.image1.includes('supabase')) {
                    const filename = clone.image1.split('/').pop();
                    if (filename) filesToDelete.push(filename);
                }
                if (clone.image2 && clone.image2.includes('supabase')) {
                    const filename = clone.image2.split('/').pop();
                    if (filename) filesToDelete.push(filename);
                }
                if (clone.image3 && clone.image3.includes('supabase')) {
                    const filename = clone.image3.split('/').pop();
                    if (filename) filesToDelete.push(filename);
                }

                // Deletar em batch se houver arquivos
                if (filesToDelete.length > 0) {
                    const { error: deleteStorageError } = await supabase.storage
                        .from('spybot_images')
                        .remove(filesToDelete);

                    if (deleteStorageError) {
                        console.error("Erro ao deletar imagens do storage:", deleteStorageError);
                        // Continua mesmo se falhar (imagens orphadas é melhor que crash)
                    }
                }
            }
        }

        // 3. Deletar todos os registros de clones do usuário
        const { error: deleteError } = await supabase
            .from('spybot_generations')
            .delete()
            .eq('user_id', user.id);

        if (deleteError) {
            console.error("Erro ao deletar clones:", deleteError);
            return NextResponse.json(
                { error: "Erro ao deletar clones" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `✅ ${clones?.length || 0} clone(s) deletado(s) com sucesso!`,
            deletedCount: clones?.length || 0
        });

    } catch (error) {
        console.error("Erro em /api/clear-clones:", error);
        return NextResponse.json(
            { error: "Erro ao limpar clones" },
            { status: 500 }
        );
    }
}
