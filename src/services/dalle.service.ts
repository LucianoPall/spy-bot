/**
 * DALL-E Service
 *
 * Encapsula toda a lógica de geração de imagens via DALL-E
 * Responsabilidades:
 * - Construir prompts de imagem por niche
 * - Chamar DALL-E com retry
 * - Validar URLs de imagem
 * - Fallback para stock images
 */

import OpenAI from 'openai';
import { getStockImageVariations } from '@/lib/stock-images';

export interface DALLEGenerationResult {
  images: {
    image1: string;
    image2: string;
    image3: string;
  };
  isError: boolean;
  errorMessage?: string;
}

/**
 * Gera prompts de imagem customizados por nicho
 */
function generateImagePrompts(niche: string, variantCopy: string): string[] {
  const nichePrompts: Record<string, string[]> = {
    'Emagrecimento': [
      `Professional fitness transformation image - before and after visual showing dramatic weight loss progress, fit body, health focus, motivational, realistic photography, high quality, bright lighting`,
      `Healthy lifestyle image - person exercising on beach, energetic, fit, vibrant colors, summer vibes, motivation, professional photography`,
      `Weight loss success portrait - happy smiling person showing their fitness achievement, confident expression, healthy glow, modern aesthetic`
    ],
    'Renda Extra': [
      `Professional working from home setup - person on laptop, coffee, modern workspace, productivity, success indicators, bright modern office`,
      `Digital entrepreneur image - successful person at desk, multiple screens, business growth charts, wealth building, professional atmosphere`,
      `Passive income concept - cash flow diagram, money management, financial growth, professional business illustration, modern design`
    ],
    'iGaming': [
      `Exciting gaming interface screenshot - colorful slots, cards, gaming platform design, dynamic, engaging, professional casino aesthetic`,
      `Winning moment - celebration image related to gaming, excitement, victory, bright colors, energetic mood, modern digital art`,
      `Gaming platform dashboard - clean, professional, user-friendly interface with gaming elements, modern UI design, attractive layout`
    ],
    'Estética': [
      `Professional skincare facial treatment - before and after beauty transformation, glowing skin, spa aesthetic, luxury feel, professional lighting`,
      `Beauty product showcase - elegant cosmetics display, professional skincare routine, fresh glowing skin, modern minimalist aesthetic`,
      `Facial rejuvenation concept - anti-aging transformation, youthful skin glow, luxury beauty brand aesthetic, professional photography`
    ],
    'E-commerce': [
      `Professional product display - elegant shopping scene, attractive merchandise, modern retail environment, customer shopping, bright lighting`,
      `Online store hero image - diverse products showcasing, shopping bag, e-commerce vibes, modern marketplace aesthetic, professional photography`,
      `Successful shopping experience - happy customer with products, delivery box, satisfaction, convenient shopping, modern e-commerce aesthetic`
    ],
    'Geral': [
      `Professional business success image - growth chart, productivity, modern corporate environment, professional atmosphere, bright modern design`,
      `Digital marketing concept - professional person with technology, growth metrics, business growth, modern aesthetic, professional photography`,
      `Success and achievement visual - motivational image, professional success, modern business, bright colors, inspiring composition`
    ]
  };

  return nichePrompts[niche] || nichePrompts['Geral'];
}

/**
 * Gera 3 imagens com DALL-E
 *
 * @param openaiClient - Cliente OpenAI configurado
 * @param niche - Nicho detectado (para customizar prompts)
 * @param variantCopy - Uma das variações de copy (para contexto)
 * @returns URLs das 3 imagens ou fallback stock images
 */
export async function generateImagesWithDALLE(
  openaiClient: OpenAI,
  niche: string,
  variantCopy: string
): Promise<DALLEGenerationResult> {
  try {
    console.log('[DALLE] Iniciando geração de 3 imagens:', { niche });

    // Prompts customizados por nicho
    const imagePrompts = generateImagePrompts(niche, variantCopy);

    // Gerar 3 imagens em paralelo com timeout individual
    const imageGenerations = [
      generateSingleImage(openaiClient, imagePrompts[0], '1024x1024', 'square'),
      generateSingleImage(openaiClient, imagePrompts[1], '1024x1024', 'square'),
      generateSingleImage(openaiClient, imagePrompts[2], '1024x1792', 'vertical')
    ];

    const results = await Promise.all(imageGenerations);

    // Validar que não há duplicatas
    const urls = results.map(r => r.url);
    const uniqueUrls = new Set(urls);

    if (uniqueUrls.size < 3) {
      console.warn('[DALLE] ⚠️ Imagens duplicadas detectadas, usando fallback');
      const fallbackImages = await getStockImageVariations(niche, 3);
      return {
        images: {
          image1: fallbackImages[0].url,
          image2: fallbackImages[1].url,
          image3: fallbackImages[2].url
        },
        isError: false
      };
    }

    console.log('[DALLE] ✅ 3 imagens geradas com sucesso');

    return {
      images: {
        image1: urls[0],
        image2: urls[1],
        image3: urls[2]
      },
      isError: false
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[DALLE] ❌ Erro na geração de imagens:', errorMessage);

    // Fallback para stock images
    const fallbackImages = await getStockImageVariations(niche, 3);

    return {
      images: {
        image1: fallbackImages[0].url,
        image2: fallbackImages[1].url,
        image3: fallbackImages[2].url
      },
      isError: true,
      errorMessage
    };
  }
}

/**
 * Gera uma imagem com timeout e tratamento de erro
 */
async function generateSingleImage(
  openaiClient: OpenAI,
  prompt: string,
  size: '1024x1024' | '1024x1792',
  format: 'square' | 'vertical'
): Promise<{ url: string }> {
  try {
    const timeoutMs = format === 'vertical' ? 60000 : 45000;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const response = await openaiClient.images.generate({
      model: 'dall-e-3',
      prompt,
      size,
      quality: 'standard',
      n: 1,
      //@ts-ignore - signal não está tipado no SDK
      signal: controller.signal
    });

    clearTimeout(timeoutHandle);

    if (!response.data?.[0]?.url) {
      throw new Error('DALL-E não retornou URL válida');
    }

    return { url: response.data[0].url };
  } catch (error) {
    throw new Error(`Erro ao gerar imagem (${format}): ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Valida se a geração foi bem-sucedida
 */
export function isDALLEGenerationValid(result: DALLEGenerationResult): boolean {
  return !!result.images.image1 && !!result.images.image2 && !!result.images.image3;
}
