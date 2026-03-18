/**
 * Stock Images Fallback - Integração com Unsplash API
 *
 * Quando DALL-E gera 3 imagens iguais, este módulo busca imagens diferentes
 * do Unsplash como fallback automático, garantindo variedade visual.
 *
 * Suporte para nichos: igaming, emagrecimento, estética, geral, renda_extra, ecommerce
 */

interface StockImage {
  url: string;
  title: string;
  author: string;
}

// Mapeamento de nichos para queries do Unsplash
const NICHE_QUERIES: Record<string, string[]> = {
  igaming: ['casino', 'poker', 'gaming', 'slots', 'betting'],
  emagrecimento: ['weight loss', 'fitness', 'diet', 'slim', 'healthy lifestyle'],
  estetica: ['beauty', 'skincare', 'facial', 'cosmetics', 'anti-aging'],
  geral: ['marketing', 'business', 'success', 'professional', 'digital'],
  renda_extra: ['online business', 'work from home', 'income', 'entrepreneur', 'digital marketing'],
  ecommerce: ['shopping', 'e-commerce', 'store', 'products', 'retail'],
};

// Fallback interno: imagens padrão se Unsplash falhar
const FALLBACK_STOCK_IMAGES: Record<string, StockImage[]> = {
  igaming: [
    {
      url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1024&h=1024&fit=crop',
      title: 'Gaming Setup',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1538481143235-398ae6f95ba3?w=1024&h=1024&fit=crop',
      title: 'Laptop Gaming',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1515182629504-727d4753751d?w=1024&h=1024&fit=crop',
      title: 'Technology Success',
      author: 'Unsplash',
    },
  ],
  emagrecimento: [
    {
      url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1024&h=1024&fit=crop',
      title: 'Fitness',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1024&h=1024&fit=crop',
      title: 'Health',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1513722032312-6288e444f620?w=1024&h=1024&fit=crop',
      title: 'Athlete',
      author: 'Unsplash',
    },
  ],
  estetica: [
    {
      url: 'https://images.unsplash.com/photo-1570545338838-8f93b44ee089?w=1024&h=1024&fit=crop',
      title: 'Beauty',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1599927953362-7ea89f1b41b0?w=1024&h=1024&fit=crop',
      title: 'Skincare',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1631730486063-8d2c0c5f1f61?w=1024&h=1024&fit=crop',
      title: 'Cosmetics',
      author: 'Unsplash',
    },
  ],
  renda_extra: [
    {
      url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1024&h=1024&fit=crop',
      title: 'Startup',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1024&h=1024&fit=crop',
      title: 'Online Business',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1024&h=1024&fit=crop',
      title: 'Digital Marketing',
      author: 'Unsplash',
    },
  ],
  ecommerce: [
    {
      url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1024&h=1024&fit=crop',
      title: 'Shopping',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1505869412519-c82dcf6ded7f?w=1024&h=1024&fit=crop',
      title: 'Products',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1441986300352-7e3dee05ae6e?w=1024&h=1024&fit=crop',
      title: 'Retail',
      author: 'Unsplash',
    },
  ],
  geral: [
    {
      url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1024&h=1024&fit=crop',
      title: 'Success',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1024&h=1024&fit=crop',
      title: 'Business',
      author: 'Unsplash',
    },
    {
      url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1024&h=1024&fit=crop',
      title: 'Professional',
      author: 'Unsplash',
    },
  ],
};

/**
 * Busca imagens diferentes do Unsplash baseado no nicho
 * Com fallback automático para imagens pré-configuradas
 *
 * @param niche - Nicho do anúncio (igaming, emagrecimento, estética, geral, renda_extra, ecommerce)
 * @param count - Número de imagens a retornar (padrão: 3)
 * @returns Array com URLs de imagens diferentes
 */
export async function getStockImageVariations(
  niche: string = 'geral',
  count: number = 3
): Promise<StockImage[]> {
  try {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;

    // Se não tem chave, usar fallback imediato
    if (!apiKey) {
      console.warn('[STOCK-IMAGES] Sem UNSPLASH_ACCESS_KEY, usando fallback local');
      return getFallbackImages(niche, count);
    }

    // Obter queries para o nicho
    const queries = NICHE_QUERIES[niche] || NICHE_QUERIES['geral'];

    // Fazer requisições em paralelo para diferentes queries
    const promises = queries.slice(0, count).map((query) =>
      fetchUnsplashImage(apiKey, query)
    );

    const results = await Promise.all(promises);
    const successResults = results.filter((r) => r !== null) as StockImage[];

    // Se conseguiu pelo menos 1 imagem, retornar (pode ser menos que count)
    if (successResults.length > 0) {
      console.log(
        `[STOCK-IMAGES] ✅ Obtidas ${successResults.length} imagens do Unsplash para nicho: ${niche}`
      );

      // Se não conseguiu o count completo, completar com fallback
      if (successResults.length < count) {
        const fallbackRemaining = getFallbackImages(niche, count - successResults.length);
        return successResults.concat(fallbackRemaining);
      }

      return successResults;
    }

    // Se Unsplash falhou completamente, usar fallback
    console.warn(`[STOCK-IMAGES] ⚠️ Falha ao buscar do Unsplash, usando fallback para nicho: ${niche}`);
    return getFallbackImages(niche, count);
  } catch (error) {
    console.error('[STOCK-IMAGES] Erro ao buscar imagens:', error);
    return getFallbackImages(niche, count);
  }
}

/**
 * Busca uma imagem única do Unsplash
 * @internal
 */
async function fetchUnsplashImage(
  apiKey: string,
  query: string
): Promise<StockImage | null> {
  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${apiKey}&w=1024`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.warn(`[STOCK-IMAGES] Status ${response.status} ao buscar Unsplash para: ${query}`);
      return null;
    }

    const data = (await response.json()) as {
      urls?: { regular?: string };
      description?: string;
      alt_description?: string;
      user?: { name?: string };
    };

    if (!data.urls?.regular) {
      console.warn(`[STOCK-IMAGES] Resposta inválida do Unsplash para: ${query}`);
      return null;
    }

    // Formatar URL para tamanho 1024x1024
    const imageUrl = `${data.urls.regular}&w=1024&h=1024&fit=crop`;

    return {
      url: imageUrl,
      title: data.description || data.alt_description || query,
      author: data.user?.name || 'Unsplash',
    };
  } catch (error) {
    console.error(`[STOCK-IMAGES] Erro ao buscar imagem para "${query}":`, error);
    return null;
  }
}

/**
 * Retorna imagens pré-configuradas como fallback
 * @internal
 */
function getFallbackImages(niche: string, count: number): StockImage[] {
  const fallbackList = FALLBACK_STOCK_IMAGES[niche] || FALLBACK_STOCK_IMAGES['geral'];

  // Embaralhar para variedade
  const shuffled = [...fallbackList].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, Math.min(count, shuffled.length));
}
