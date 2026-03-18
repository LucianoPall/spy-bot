import { NextResponse } from 'next/server';

/**
 * Função de retry com exponential backoff
 * Trata erros transitórios: timeout, 429, 503, etc.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 5
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Aumentado: 15s → 30s

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Se OK, retorna
      if (response.ok) {
        return response;
      }

      // Se erro transitório, tenta novamente
      const retryableStatuses = [429, 500, 502, 503, 504];
      if (retryableStatuses.includes(response.status) && attempt < maxRetries - 1) {
        const backoff = Math.pow(2, attempt) * 1000; // Exponential: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error: any) {
      lastError = error;

      // Se timeout ou erro de conexão, tenta novamente
      const isTimeoutError = error.name === 'AbortError' || error.message?.includes('timeout');
      if (isTimeoutError && attempt < maxRetries - 1) {
        const backoff = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
    }
  }

  throw lastError || new Error('Todas as tentativas falharam');
}

/**
 * Route Handler para carregar imagens com retry e fallback
 * Otimizado para o HistoryCard com cache inteligente
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');
        const cacheKey = searchParams.get('cache');

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'URL é obrigatória' },
                { status: 400 }
            );
        }

        // Validação de origin (segurança)
        const allowedOrigins = [
            'images.unsplash.com',
            'supabase.co',
            'googleapis.com',
            'cloudflare.com',
            'oaidalleapiprodscus.blob.core.windows.net',
            'facebook.com',
            'fbcdn.net'
        ];

        const urlObj = new URL(imageUrl);
        const isAllowedOrigin = allowedOrigins.some(origin =>
            urlObj.hostname.includes(origin)
        );

        if (!isAllowedOrigin) {
            return NextResponse.json(
                { error: 'Origin não permitido' },
                { status: 403 }
            );
        }

        // Retry com backoff exponencial (5 tentativas com 30s timeout)
        try {
            const response = await fetchWithRetry(
                imageUrl,
                {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'SpyBot/1.0',
                        'Accept': 'image/*'
                    }
                },
                5
            );

            if (!response.headers.get('content-type')?.includes('image')) {
                throw new Error('Resposta não é uma imagem válida');
            }

            const headers = new Headers(response.headers);
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');

            const blob = await response.blob();
            return new NextResponse(blob, {
                status: 200,
                headers
            });
        } catch (error: any) {
            console.warn('⚠️ [GET-IMAGE] Erro ao carregar imagem original:', {
                url: imageUrl.substring(0, 80) + '...',
                error: error.message,
                hint: 'Tentando fallback Unsplash...'
            });
        }

        // Fallback: Unsplash permanente
        const placeholderUrl = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200';
        try {
            const fallbackResponse = await fetchWithRetry(
                placeholderUrl,
                { method: 'GET', headers: { 'User-Agent': 'SpyBot/1.0' } },
                2
            );

            const blob = await fallbackResponse.blob();
            return new NextResponse(blob, {
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'X-Fallback': 'placeholder'
                }
            });
        } catch (e) {
            console.error('❌ [GET-IMAGE] Erro ao carregar fallback também:', e);
        }

        return NextResponse.json(
            { error: 'Não foi possível carregar a imagem (fallback também falhou)' },
            { status: 500 }
        );

    } catch (error) {
        console.error('Erro em /api/get-image:', error);
        return NextResponse.json(
            { error: 'Erro ao processar imagem' },
            { status: 500 }
        );
    }
}
