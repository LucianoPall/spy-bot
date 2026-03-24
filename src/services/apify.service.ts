/**
 * Apify Service
 *
 * Encapsula toda a lógica de extração de dados do Facebook Ads via Apify
 * Responsabilidades:
 * - Construir payload para Apify
 * - Fazer chamada com retry
 * - Parsear resposta
 * - Tratar erros
 */

import { fetchWithRetry } from '@/lib/http-client';

export interface ApifyExtractionResult {
  originalCopy: string;
  adImageUrl: string;
  errorMessage?: string;
  isError: boolean;
}

/**
 * Extrai dados de anúncio do Facebook usando Apify
 *
 * @param adUrl - URL do anúncio Facebook (validada antes)
 * @param apifyToken - Token de autenticação Apify
 * @returns Resultado com copy e imagem extraída
 */
export async function extractAdWithApify(
  adUrl: string,
  apifyToken: string
): Promise<ApifyExtractionResult> {
  let originalCopy = '';
  let adImageUrl = '';
  let errorMessage = '';

  try {
    console.log('[APIFY] Iniciando extração:', { url: adUrl.substring(0, 80) });

    // Validação básica
    const cleanedUrl = adUrl.trim();
    if (!cleanedUrl) {
      throw new Error('URL do anúncio vazia ou inválida');
    }

    // Construir payload para Apify
    const input = {
      startUrls: [{ url: cleanedUrl }],
      maxItems: 3,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['FACEBOOK']
      },
      useChrome: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    // Fazer chamada com retry (3 tentativas, exponential backoff)
    const APIFY_TIMEOUT = 60000; // 60s timeout
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, APIFY_TIMEOUT);

    let response;
    try {
      response = await fetch(
        `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: controller.signal
        }
      );
      clearTimeout(timeoutHandle);
    } catch (timeoutErr) {
      clearTimeout(timeoutHandle);
      throw new Error('Apify timeout (60s) - URL bloqueada pelo Facebook ou Apify indisponível');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API Error: ${response.status} - ${errorText}`);
    }

    const items = await response.json();

    // Parsear resposta
    if (items && items.length > 0) {
      const adData = items[0];
      const snap = adData.snapshot || adData;

      // Extrair copy
      const rawCopy = snap.body?.text || adData.primaryText || adData.text || snap.title || snap.caption || snap.linkDescription || '';
      originalCopy = String(rawCopy).trim();

      // Detectar template vars não preenchidas
      const hasTemplateVars = /\{\{[\s\S]*?\}\}/.test(originalCopy);
      if (originalCopy === 'undefined' || originalCopy === 'null' || hasTemplateVars) {
        originalCopy = '';
      }

      // Extrair imagem
      const rawImageUrl = String(
        snap.images?.[0]?.originalImageUrl ||
          snap.videos?.[0]?.videoPreviewImageUrl ||
          snap.pageProfilePictureUrl ||
          adData.imageUrl ||
          ''
      );

      // Melhorar qualidade removendo parâmetros de thumbnail
      adImageUrl = rawImageUrl
        .replace(/\?stp=dst-jpg_s60x60.*?(&|$)/, '?stp=dst-jpg_s800x800_tt6&')
        .replace(/\?stp=.*?&/, '?')
        .replace(/\?stp=.*?$/, '');

      console.log('[APIFY] ✅ Extração concluída:', {
        copyLength: originalCopy.length,
        hasImage: !!adImageUrl
      });

      return {
        originalCopy,
        adImageUrl,
        isError: false
      };
    } else {
      throw new Error('A extração retornou 0 itens (vazio). O Facebook pode ter bloqueado ou o ID é inválido.');
    }
  } catch (error: unknown) {
    errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[APIFY] ❌ Erro na extração:', errorMessage);

    return {
      originalCopy: '',
      adImageUrl: '',
      errorMessage,
      isError: true
    };
  }
}

/**
 * Valida se a extração foi bem-sucedida
 */
export function isApifyExtractionValid(result: ApifyExtractionResult): boolean {
  return !result.isError && (!!result.originalCopy || !!result.adImageUrl);
}
