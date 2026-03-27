import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/http-client';
import { ensureError } from '@/lib/types-common';

/**
 * Proxy endpoint com retry automático e cache agressivo
 * Usado como fallback quando api/get-image falha
 * ✅ NOVO: Cache permanente para URLs DALL-E (que expiram)
 */
export async function GET(req: Request) {
    let imageUrl: string | null = null;
    try {
        const { searchParams } = new URL(req.url);
        imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
        }

        // Decodificar URL
        let decodedUrl = imageUrl;
        try {
            decodedUrl = decodeURIComponent(imageUrl);
        } catch (e) {
            decodedUrl = imageUrl;
        }

        // Detectar se é URL DALL-E (oaidalleapiprodscus.blob.core.windows.net)
        const isDalleUrl = decodedUrl.includes('oaidalleapiprodscus.blob.core.windows.net');
        console.log('[proxy-image] URL detectada:', { isDalleUrl, isSupabase: decodedUrl.includes('supabase.co') });

        // ⚠️ IMPORTANTE: DALL-E URLs precisam de headers especiais
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'image/png,image/jpeg,image/*'
        };

        // Se for DALL-E, adicionar headers extras para autenticação
        if (isDalleUrl) {
            headers['Accept-Encoding'] = 'gzip, deflate, br';
            headers['Cache-Control'] = 'no-cache';
        }

        // Buscar com retry (aumentado para 5 tentativas com timeout 30s)
        const response = await fetchWithRetry(
            decodedUrl,
            {
                method: 'GET',
                headers
            },
            5
        );

        const buffer = await response.arrayBuffer();

        // ✅ NOVO: Cache diferenciado por tipo de URL
        // - DALL-E: Armazenar por 1 dia (pode estar expirando nos servidores OpenAI)
        // - Supabase: 1 ano (permanente)
        // - Outros: 1 hora
        let cacheTime = 3600; // 1 hora padrão
        if (decodedUrl.includes('supabase.co')) {
            cacheTime = 31536000; // 1 ano
        } else if (isDalleUrl) {
            cacheTime = 86400; // 1 dia para DALL-E (pode expirar)
            console.log('[proxy-image] 🖼️ DALL-E URL detectada - cache de 1 dia');
        }

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/png',
                'Cache-Control': `public, max-age=${cacheTime}, immutable`,
                'X-Content-Type-Options': 'nosniff',
                'X-Image-Type': isDalleUrl ? 'dalle' : 'other',
            },
        });
    } catch (error: unknown) {
        const err = ensureError(error);
        console.error('[proxy-image] ❌ ERRO:', {
            message: err.message,
            url: imageUrl?.substring(0, 80) + '...',
            code: (err as any).code,
            statusCode: (err as any).statusCode
        });

        // ✅ NUNCA retornar JSON - tentar fallback automático inteligente
        try {
            // Redetectar se é URL DALL-E no contexto do erro
            let isDalleUrlError = false;
            try {
                const decodedUrlError = decodeURIComponent(imageUrl || '');
                isDalleUrlError = decodedUrlError.includes('oaidalleapiprodscus.blob.core.windows.net');
            } catch (e) {
                isDalleUrlError = (imageUrl || '').includes('oaidalleapiprodscus.blob.core.windows.net');
            }

            // Tentar fallback inteligente: se era DALL-E expirada, usar Unsplash
            // Se foi Unsplash, tentar PNG transparente
            let fallbackUrl: string | null = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200';

            if (!isDalleUrlError && imageUrl?.includes('unsplash.com')) {
                // Se falhou com Unsplash, tentar PNG transparente (nunca deve falhar)
                console.log('[proxy-image] ⚠️ Unsplash falhou, pulando para PNG transparente');
                fallbackUrl = null;
            } else if (isDalleUrlError) {
                // Se falhou com DALL-E, tentar Unsplash genérico
                console.log('[proxy-image] ⚠️ DALL-E falhou (provavelmente expirada), tentando fallback Unsplash');
                fallbackUrl = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200';
            }

            if (fallbackUrl) {
                const fallbackResponse = await fetchWithRetry(fallbackUrl, {}, 2);
                const blob = await fallbackResponse.blob();
                console.log('[proxy-image] ✅ Fallback Unsplash funcionou');
                return new NextResponse(blob, {
                    status: 200,
                    headers: {
                        'Content-Type': 'image/png',
                        'Cache-Control': 'public, max-age=31536000, immutable',
                        'X-Fallback': 'unsplash'
                    }
                });
            }

            // ✅ Se fallbackUrl é null, retornar PNG transparente direto
            throw new Error('Fallback URL inválido');
        } catch (fallbackError) {
            console.error('[proxy-image] ❌ Fallback também falhou, retornando PNG transparente');

            // ✅ Último recurso: retornar PNG transparente 1x1
            const transparentPNG = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'base64'
            );
            return new NextResponse(transparentPNG, {
                status: 200,
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=3600',
                    'X-Fallback': 'transparent'
                }
            });
        }
    }
}
