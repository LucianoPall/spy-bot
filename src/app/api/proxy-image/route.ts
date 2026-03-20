import { NextResponse } from 'next/server';

/**
 * Função de retry com exponential backoff (compartilhada)
 * Trata erros transitórios: timeout, 429, 503, etc.
 * ✅ MELHORADO: Timeout estendido para URLs DALL-E
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 5
): Promise<Response> {
  let lastError: Error | null = null;

  // Detectar se é DALL-E para timeout maior
  const isDalleUrl = url?.includes('oaidalleapiprodscus.blob.core.windows.net');
  const timeoutMs = isDalleUrl ? 60000 : 30000; // 60s para DALL-E, 30s para outros

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Se OK, retorna
      if (response.ok) {
        console.log(`[fetchWithRetry] ✅ Sucesso na tentativa ${attempt + 1}/${maxRetries}`);
        return response;
      }

      // Se erro transitório, tenta novamente
      const retryableStatuses = [429, 500, 502, 503, 504];
      if (retryableStatuses.includes(response.status) && attempt < maxRetries - 1) {
        console.log(`[fetchWithRetry] ⚠️ Status ${response.status}, tentando novamente...`);
        const backoff = Math.pow(2, attempt) * 1000; // Exponential: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error: any) {
      lastError = error;

      // Se timeout ou erro de conexão, tenta novamente
      const isTimeoutError = error?.name === 'AbortError' || error?.message?.includes('timeout');
      if (isTimeoutError && attempt < maxRetries - 1) {
        console.log(`[fetchWithRetry] ⏱️ Timeout na tentativa ${attempt + 1}, tentando novamente...`);
        const backoff = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
    }
  }

  console.error(`[fetchWithRetry] ❌ Falha após ${maxRetries} tentativas:`, lastError?.message);
  throw lastError || new Error('Todas as tentativas falharam');
}

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
    } catch (error: any) {
        console.error('[proxy-image] ❌ ERRO:', {
            message: error.message,
            url: imageUrl?.substring(0, 80) + '...',
            code: error.code,
            statusCode: error.statusCode
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
