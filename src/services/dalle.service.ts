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
import { log } from '@/lib/logger';

export interface DALLEGenerationResult {
  images: {
    image1: string;
    image2: string;
    image3: string;
  };
  isError: boolean;
  errorMessage?: string;
  source?: 'dalle' | 'unsplash' | 'fallback'; // Rastrear qual método foi usado
  metadata?: {
    attemptedDalle: boolean;
    dalleErrorCount: number;
    imageStatus: ('dalle' | 'unsplash' | 'fallback')[];
  };
}

/**
 * Gera prompts de imagem dinâmicos customizados por nicho e copy
 * Cria prompts específicos para cada variante ao invés de usar prompts estáticos
 */
async function generateImagePrompts(
  openaiClient: OpenAI,
  niche: string,
  variantCopy: string
): Promise<string[]> {
  // Fallback para prompts estáticos caso OpenAI falhe
  const staticPrompts: Record<string, string[]> = {
    'emagrecimento': [
      `Professional fitness transformation image - highlighting the specific benefits of losing weight, before and after visual, fit body, health focus, motivational, realistic photography, high quality, bright lighting`,
      `Healthy lifestyle image - person showcasing their fitness achievement, energetic, confident, vibrant colors, summer vibes, motivation, professional photography`,
      `Weight loss success portrait - happy smiling person showing their transformation results, confident expression, healthy glow, modern aesthetic`
    ],
    'renda_extra': [
      `Professional working from home setup - person on laptop earning passive income, coffee, modern workspace, productivity, success indicators, bright modern office`,
      `Digital entrepreneur image - successful person at desk showing their earnings, multiple screens, business growth charts, wealth building, professional atmosphere`,
      `Passive income concept - person celebrating their earnings, money management, financial growth, professional business illustration, modern design`
    ],
    'igaming': [
      `Exciting gaming interface screenshot - colorful slots, cards, gaming platform showing big wins, dynamic, engaging, professional casino aesthetic`,
      `Winning moment - celebration image of a big victory in gaming, excitement, victory, bright colors, energetic mood, modern digital art`,
      `Gaming platform dashboard - clean, professional, user-friendly interface with gaming elements, showing winning potential, modern UI design, attractive layout`
    ],
    'estetica': [
      `Professional skincare facial treatment - showing the specific benefits mentioned, before and after beauty transformation, glowing skin, spa aesthetic, luxury feel, professional lighting`,
      `Beauty product showcase - elegant cosmetics display related to the treatment mentioned, professional skincare routine, fresh glowing skin, modern minimalist aesthetic`,
      `Facial rejuvenation concept - anti-aging transformation matching the benefits, youthful skin glow, luxury beauty brand aesthetic, professional photography`
    ],
    'ecommerce': [
      `Professional product display - elegant shopping scene featuring the specific products or benefits, attractive merchandise, modern retail environment, customer shopping, bright lighting`,
      `Online store hero image - diverse products showcasing the main offer, shopping bag, e-commerce vibes, modern marketplace aesthetic, professional photography`,
      `Successful shopping experience - happy customer with products matching the offer, delivery box, satisfaction, convenient shopping, modern e-commerce aesthetic`
    ],
    'alimentacao': [
      `Professional healthy food photography - fresh organic ingredients related to the specific meal or benefit, colorful meal prep, restaurant quality presentation, appetizing composition`,
      `Gourmet food delivery concept - beautifully plated meal matching the offer, food packaging, fresh ingredients, warm lighting, professional food photography`,
      `Nutrition and wellness image - balanced diet showcase matching the specific benefits, superfoods, healthy eating lifestyle, vibrant colors, clean aesthetic`
    ],
    'geral': [
      `Professional business success image - highlighting the specific benefit mentioned, growth chart, productivity, modern corporate environment, professional atmosphere, bright modern design`,
      `Digital marketing concept - professional person with technology achieving the specific goal, growth metrics, business growth, modern aesthetic, professional photography`,
      `Success and achievement visual - showing the specific achievement mentioned, motivational image, professional success, modern business, bright colors, inspiring composition`
    ]
  };

  try {
    // Gerar 3 prompts dinâmicos usando OpenAI
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating detailed image prompts for DALL-E that match the specific offer/benefit mentioned in marketing copy.

Create 3 distinct, professional image prompts based on the given copy. Each prompt should:
1. Reference the specific benefit or offer mentioned in the copy
2. Be visually compelling and relevant to the niche
3. Use descriptive language suitable for DALL-E
4. Be different from each other (showing different angles or aspects of the offer)
5. Include style hints like "professional photography", "modern aesthetic", "high quality", etc.

Format your response as a JSON array with exactly 3 prompts:
["prompt1", "prompt2", "prompt3"]`
        },
        {
          role: 'user',
          content: `Niche: ${niche}
Copy: ${variantCopy.substring(0, 300)}

Generate 3 image prompts that specifically relate to the benefits/offer in this copy. Make them visually distinct and compelling for DALL-E.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length === 3) {
        log.info('DALLE', 'Prompts dinâmicos gerados com sucesso');
        return parsed.map(p => String(p));
      }
    }

    log.warn('DALLE', 'Falha ao parsear prompts dinâmicos, usando fallback estático');
  } catch (error) {
    log.warn('DALLE', 'Erro ao gerar prompts dinâmicos',
      error instanceof Error ? error.message : String(error));
  }

  // Fallback: usar prompts estáticos
  return staticPrompts[niche] || staticPrompts['geral'];
}

/**
 * Gera 3 imagens com DALL-E com suporte a retry automático e fallback dinâmico
 *
 * @param openaiClient - Cliente OpenAI configurado
 * @param niche - Nicho detectado (para customizar prompts)
 * @param variantCopy - Uma das variações de copy (para contexto)
 * @returns URLs das 3 imagens ou fallback stock images com rastreamento de fonte
 */
export async function generateImagesWithDALLE(
  openaiClient: OpenAI,
  niche: string,
  variantCopy: string
): Promise<DALLEGenerationResult> {
  const imageStatus: ('dalle' | 'unsplash' | 'fallback')[] = [];
  let dalleErrorCount = 0;

  try {
    log.info('DALLE', 'Iniciando geração de 3 imagens', { niche });

    // Prompts customizados e dinâmicos baseado na copy fornecida
    const imagePrompts = await generateImagePrompts(openaiClient, niche, variantCopy);

    // Gerar 3 imagens em paralelo - allSettled para não perder tudo se 1 falhar
    const imageGenerations = [
      generateSingleImage(openaiClient, imagePrompts[0], '1024x1024', 'square'),
      generateSingleImage(openaiClient, imagePrompts[1], '1024x1024', 'square'),
      generateSingleImage(openaiClient, imagePrompts[2], '1024x1792', 'vertical')
    ];

    const settled = await Promise.allSettled(imageGenerations);

    // Preparar URLs com rastreamento de fonte
    const urls: string[] = [];
    const dalleFailures: number[] = [];

    // Para cada resultado, usar a imagem gerada ou preparar fallback
    settled.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        urls[i] = result.value.url;
        imageStatus[i] = 'dalle';
        log.info('DALLE', `✅ Imagem ${i + 1} gerada com sucesso via DALLE`);
      } else {
        dalleErrorCount++;
        dalleFailures.push(i);
        log.warn('DALLE', `❌ Imagem ${i + 1} falhou via DALLE`, result.reason?.message);
      }
    });

    // Se todos falharam, usar fallback dinâmico do Unsplash
    if (dalleFailures.length === 3) {
      log.warn('DALLE', 'Todas as 3 imagens DALLE falharam, usando Unsplash dinâmico');
      const unsplashImages = await getStockImageVariations(niche, 3);
      return {
        images: {
          image1: unsplashImages[0].url,
          image2: unsplashImages[1].url,
          image3: unsplashImages[2].url
        },
        isError: true,
        errorMessage: 'Todas as gerações DALLE falharam, usando Unsplash',
        source: 'unsplash',
        metadata: {
          attemptedDalle: true,
          dalleErrorCount: 3,
          imageStatus: ['unsplash', 'unsplash', 'unsplash']
        }
      };
    }

    // Se alguns falharam, completar com Unsplash dinâmico
    if (dalleFailures.length > 0) {
      log.info('DALLE', `${dalleFailures.length} imagem(ns) falhou, buscando do Unsplash dinâmico`);
      const unsplashImages = await getStockImageVariations(niche, dalleFailures.length);

      dalleFailures.forEach((failIndex, idx) => {
        urls[failIndex] = unsplashImages[idx].url;
        imageStatus[failIndex] = 'unsplash';
        log.info('DALLE', `🔄 Imagem ${failIndex + 1} completada via Unsplash (dinâmico)`);
      });
    }

    // Validar que não há duplicatas (importante para variedade)
    const uniqueUrls = new Set(urls);

    if (uniqueUrls.size < 3) {
      log.warn('DALLE', '⚠️ Imagens duplicadas detectadas, regenerando com fallback');
      const freshFallback = await getStockImageVariations(niche, 3);
      return {
        images: {
          image1: freshFallback[0].url,
          image2: freshFallback[1].url,
          image3: freshFallback[2].url
        },
        isError: false,
        source: 'fallback',
        metadata: {
          attemptedDalle: true,
          dalleErrorCount: 3,
          imageStatus: ['fallback', 'fallback', 'fallback']
        }
      };
    }

    const allSucceeded = settled.every(r => r.status === 'fulfilled');
    const source: 'dalle' | 'unsplash' | 'fallback' = allSucceeded ? 'dalle' : 'unsplash';

    if (allSucceeded) {
      log.info('DALLE', '✅ 3 imagens geradas com sucesso via DALLE');
    } else {
      log.info('DALLE', `✅ Geração concluída: ${3 - dalleErrorCount} DALLE + ${dalleErrorCount} Unsplash`);
    }

    return {
      images: {
        image1: urls[0],
        image2: urls[1],
        image3: urls[2]
      },
      isError: false,
      source,
      metadata: {
        attemptedDalle: true,
        dalleErrorCount,
        imageStatus
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('DALLE', 'Erro crítico na geração de imagens', errorMessage);

    // Fallback final para stock images do Unsplash
    try {
      const fallbackImages = await getStockImageVariations(niche, 3);
      log.info('DALLE', '⚠️ Usando fallback final com Unsplash dinâmico');

      return {
        images: {
          image1: fallbackImages[0].url,
          image2: fallbackImages[1].url,
          image3: fallbackImages[2].url
        },
        isError: true,
        errorMessage,
        source: 'fallback',
        metadata: {
          attemptedDalle: true,
          dalleErrorCount: 3,
          imageStatus: ['fallback', 'fallback', 'fallback']
        }
      };
    } catch (fallbackError) {
      log.error('DALLE', 'Falha no fallback final também', fallbackError);
      throw new Error(`Falha crítica: geração DALLE e fallback Unsplash falharam. Original: ${errorMessage}`);
    }
  }
}

/**
 * Gera uma imagem com retry automático, timeout robusto e tratamento de erro
 * Tenta até 2 vezes antes de falhar
 */
async function generateSingleImage(
  openaiClient: OpenAI,
  prompt: string,
  size: '1024x1024' | '1024x1792',
  format: 'square' | 'vertical'
): Promise<{ url: string }> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.info('DALLE', `Tentativa ${attempt}/${maxRetries} para gerar imagem (${format})`);

      // Timeout mais conservador: 90s para vertical, 70s para square
      const timeoutMs = format === 'vertical' ? 90000 : 70000;

      try {
        const dallePromise = openaiClient.images.generate({
          model: 'dall-e-3',
          prompt,
          size,
          quality: 'standard',
          n: 1
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms na geração de imagem`)), timeoutMs)
        );

        const response = await Promise.race([dallePromise, timeoutPromise]);

        // Validar resposta
        if (!response || typeof response !== 'object' || !('data' in response)) {
          throw new Error('DALL-E retornou resposta inválida');
        }

        const data = (response as { data?: Array<{ url?: string }> }).data;
        if (!data?.[0]?.url) {
          throw new Error('DALL-E não retornou URL válida');
        }

        log.info('DALLE', `✅ Imagem gerada com sucesso (${format}) na tentativa ${attempt}`);
        return { url: data[0].url };
      } catch (timeoutError) {
        throw new Error(
          `Timeout/falha na requisição DALLE: ${timeoutError instanceof Error ? timeoutError.message : String(timeoutError)}`
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      log.warn('DALLE', `❌ Tentativa ${attempt}/${maxRetries} falhou`, {
        format,
        erro: lastError.message,
        tentandoNovamente: attempt < maxRetries
      });

      // Aguardar 2 segundos antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Todas as tentativas falharam
  const errorMsg = lastError?.message || 'Erro desconhecido na geração de imagem';
  log.error('DALLE', `Falha após ${maxRetries} tentativas`, { format, erro: errorMsg });
  throw new Error(`Erro ao gerar imagem (${format}): ${errorMsg}`);
}

/**
 * Valida se a geração foi bem-sucedida
 */
export function isDALLEGenerationValid(result: DALLEGenerationResult): boolean {
  return !!result.images.image1 && !!result.images.image2 && !!result.images.image3;
}
