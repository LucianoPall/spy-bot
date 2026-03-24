/**
 * Storage Service
 *
 * Encapsula toda a lógica de upload de imagens para Supabase Storage
 * Responsabilidades:
 * - Download de imagens (DALL-E, Unsplash)
 * - Upload para Supabase Storage
 * - Validação de URLs
 * - Retry com backoff
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
  url: string;
  provider: 'supabase' | 'dalle' | 'unsplash' | 'fallback';
  isTemporary: boolean;
  errorMessage?: string;
}

/**
 * Upload de imagem para Supabase Storage
 * Tentará fazer download e armazenar localmente
 *
 * @param imageUrl - URL da imagem (DALL-E, Unsplash, etc)
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @param imageNumber - Número da imagem (1, 2 ou 3)
 * @returns URL final da imagem no Supabase
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  supabase: SupabaseClient,
  userId: string,
  imageNumber: number
): Promise<UploadResult> {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.warn('[STORAGE] URL inválida:', imageUrl);
      return {
        url: imageUrl || 'https://images.unsplash.com/photo-1470711324350-e58093e67289?w=800',
        provider: 'fallback',
        isTemporary: false
      };
    }

    // Validar URL
    try {
      new URL(imageUrl);
    } catch {
      console.warn('[STORAGE] URL malformada:', imageUrl);
      return {
        url: imageUrl,
        provider: 'fallback',
        isTemporary: false
      };
    }

    console.log('[STORAGE] Iniciando upload:', { imageNumber, urlPrefix: imageUrl.substring(0, 50) });

    // Fazer download com retry
    let imageBlob: Blob | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(imageUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'SpyBot/1.0' }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          imageBlob = await response.blob();
          break;
        }
      } catch (downloadError) {
        console.warn(`[STORAGE] Tentativa ${attempt + 1} falhou:`, downloadError);
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    // Se não conseguiu download, retornar URL original
    if (!imageBlob) {
      console.warn('[STORAGE] Falha no download, usando URL original');
      return {
        url: imageUrl,
        provider: detectImageProvider(imageUrl),
        isTemporary: true
      };
    }

    // Upload para Supabase
    const fileName = `${userId}/${Date.now()}-image${imageNumber}.png`;

    const { data, error: uploadError } = await supabase.storage
      .from('spybot_images')
      .upload(fileName, imageBlob, {
        cacheControl: '31536000', // 1 ano
        upsert: false
      });

    if (uploadError) {
      console.warn('[STORAGE] Erro no upload:', uploadError);
      return {
        url: imageUrl,
        provider: detectImageProvider(imageUrl),
        isTemporary: true
      };
    }

    // Gerar URL pública
    const { data: publicUrlData } = supabase.storage
      .from('spybot_images')
      .getPublicUrl(fileName);

    const finalUrl = publicUrlData?.publicUrl || imageUrl;

    console.log('[STORAGE] ✅ Upload bem-sucedido:', { fileName, url: finalUrl.substring(0, 60) });

    return {
      url: finalUrl,
      provider: 'supabase',
      isTemporary: false
    };
  } catch (error) {
    console.error('[STORAGE] Erro crítico:', error);

    return {
      url: imageUrl || 'https://images.unsplash.com/photo-1470711324350-e58093e67289?w=800',
      provider: detectImageProvider(imageUrl),
      isTemporary: true
    };
  }
}

/**
 * Detecta qual é o provider da imagem pela URL
 */
function detectImageProvider(
  url: string
): 'dalle' | 'unsplash' | 'supabase' | 'fallback' {
  if (!url) return 'fallback';

  if (url.includes('oaidalleapiprodscus')) return 'dalle';
  if (url.includes('unsplash.com')) return 'unsplash';
  if (url.includes('supabase')) return 'supabase';

  return 'fallback';
}

/**
 * Valida se o resultado do upload é válido
 */
export function isUploadValid(result: UploadResult): boolean {
  return !!result.url && result.url.trim().length > 0;
}

/**
 * Formata múltiplos uploads para resposta
 */
export function formatUploadResults(
  image1: UploadResult,
  image2: UploadResult,
  image3: UploadResult
) {
  return {
    image1: {
      url: image1.url,
      type: 'square' as const,
      isTemporary: image1.isTemporary,
      provider: image1.provider
    },
    image2: {
      url: image2.url,
      type: 'square' as const,
      isTemporary: image2.isTemporary,
      provider: image2.provider
    },
    image3: {
      url: image3.url,
      type: 'vertical' as const,
      isTemporary: image3.isTemporary,
      provider: image3.provider
    }
  };
}
