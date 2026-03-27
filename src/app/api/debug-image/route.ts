import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ensureError } from '@/lib/types-common';

interface TestDetail {
  status?: number;
  statusText?: string;
  contentType?: string | null;
  success: boolean;
  error?: string;
  errorName?: string;
  [key: string]: unknown;
}

interface DebugImageResult {
  url: string;
  hostname: string;
  urlType: {
    isSupabaseUrl: boolean;
    isDalleUrl: boolean;
    isUnsplashUrl: boolean;
    isOther: boolean;
  };
  tests: Record<string, TestDetail>;
  summary?: {
    headSuccess?: boolean;
    getSuccess?: boolean;
    apiSuccess?: boolean;
    totalSuccess?: boolean;
    recommendations: string[];
  };
}

/**
 * Endpoint de debugging para diagnosticar problemas de carregamento de imagens
 * Testa uma URL e retorna detalhes sobre o sucesso ou falha
 * AUTENTICADO: Requer usuário logado (evita abuso)
 */
export async function GET(request: Request) {
    // Verificar autenticação
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized - Authentication required' },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json({
                status: 'error',
                message: 'URL é obrigatória',
                example: '/api/debug-image?url=https://example.com/image.jpg'
            }, { status: 400 });
        }

        const decodedUrl = decodeURIComponent(imageUrl);
        const urlObj = new URL(decodedUrl);

        console.log('[DEBUG-IMAGE] Testando URL:', {
            url: decodedUrl.substring(0, 150),
            hostname: urlObj.hostname,
            protocol: urlObj.protocol,
            pathname: urlObj.pathname.substring(0, 100)
        });

        // Test 1: Detectar tipo de URL
        const isSupabaseUrl = urlObj.hostname.includes('supabase.co');
        const isDalleUrl = decodedUrl.includes('oaidalleapiprodscus.blob.core.windows.net');
        const isUnsplashUrl = urlObj.hostname.includes('unsplash.com');

        const result: DebugImageResult = {
            url: decodedUrl.substring(0, 150),
            hostname: urlObj.hostname,
            urlType: {
                isSupabaseUrl,
                isDalleUrl,
                isUnsplashUrl,
                isOther: !isSupabaseUrl && !isDalleUrl && !isUnsplashUrl
            },
            tests: {}
        };

        // Test 2: Tentar HEAD request
        try {
            console.log('[DEBUG-IMAGE] Test HEAD request...');
            const headController = new AbortController();
            const headTimeoutId = setTimeout(() => headController.abort(), 15000);

            const headResponse = await fetch(decodedUrl, {
                method: 'HEAD',
                headers: { 'User-Agent': 'SpyBot-Debug/1.0' },
                signal: headController.signal
            });

            clearTimeout(headTimeoutId);

            result.tests.headRequest = {
                status: headResponse.status,
                statusText: headResponse.statusText,
                contentType: headResponse.headers.get('content-type'),
                contentLength: headResponse.headers.get('content-length'),
                cacheControl: headResponse.headers.get('cache-control'),
                success: headResponse.ok
            };
        } catch (e: unknown) {
            const error = ensureError(e);
            result.tests.headRequest = {
                error: error.message,
                errorName: error.name,
                success: false
            };
        }

        // Test 3: Tentar GET request (download pequeno)
        try {
            console.log('[DEBUG-IMAGE] Test GET request...');
            const getController = new AbortController();
            const getTimeoutId = setTimeout(() => getController.abort(), 15000);

            const getResponse = await fetch(decodedUrl, {
                method: 'GET',
                headers: { 'User-Agent': 'SpyBot-Debug/1.0', 'Accept': 'image/*' },
                signal: getController.signal
            });

            clearTimeout(getTimeoutId);

            const blob = await getResponse.blob();

            result.tests.getRequest = {
                status: getResponse.status,
                statusText: getResponse.statusText,
                contentType: getResponse.headers.get('content-type'),
                blobSize: blob.size,
                blobType: blob.type,
                success: getResponse.ok && blob.size > 0
            };
        } catch (e: unknown) {
            const error = ensureError(e);
            result.tests.getRequest = {
                error: error.message,
                errorName: error.name,
                success: false
            };
        }

        // Test 4: Testar através do endpoint /api/get-image
        try {
            console.log('[DEBUG-IMAGE] Test /api/get-image endpoint...');
            const apiController = new AbortController();
            const apiTimeoutId = setTimeout(() => apiController.abort(), 15000);

            const apiResponse = await fetch(
                `/api/get-image?url=${encodeURIComponent(decodedUrl)}`,
                {
                    method: 'GET',
                    signal: apiController.signal
                }
            );

            clearTimeout(apiTimeoutId);

            result.tests.apiGetImage = {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                contentType: apiResponse.headers.get('content-type'),
                xFallback: apiResponse.headers.get('X-Fallback'),
                success: apiResponse.ok
            };
        } catch (e: unknown) {
            const error = ensureError(e);
            result.tests.apiGetImage = {
                error: error.message,
                errorName: error.name,
                success: false
            };
        }

        // Resumo final
        const headOk = (result.tests.headRequest as TestDetail | undefined)?.success;
        const getOk = (result.tests.getRequest as TestDetail | undefined)?.success;
        const apiOk = (result.tests.apiGetImage as TestDetail | undefined)?.success;

        result.summary = {
            headSuccess: headOk,
            getSuccess: getOk,
            apiSuccess: apiOk,
            totalSuccess: headOk && getOk && apiOk,
            recommendations: []
        };

        if (!headOk) {
            result.summary.recommendations.push('HEAD request falhou - verificar se URL é válida e acessível');
        }

        if (!getOk && headOk) {
            result.summary.recommendations.push('HEAD passou mas GET falhou - possível problema de CORS ou content-type');
        }

        if (!apiOk) {
            result.summary.recommendations.push('API /api/get-image falhou - verificar logs do servidor');
        }

        if (isSupabaseUrl && !getOk) {
            result.summary.recommendations.push('URL Supabase falhou - verificar RLS policies do bucket spybot_images');
            result.summary.recommendations.push('Solução: Ir ao Supabase Dashboard > Storage > spybot_images > Policies > Enable public read access');
        }

        console.log('[DEBUG-IMAGE] Resultado final:', result.summary);

        return NextResponse.json(result);

    } catch (error: unknown) {
        const err = ensureError(error);
        console.error('[DEBUG-IMAGE] Erro crítico:', err);
        return NextResponse.json({
            status: 'error',
            message: err.message,
            stack: err.stack?.substring(0, 200)
        }, { status: 500 });
    }
}
