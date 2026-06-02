/**
 * Image Service (Pollinations.ai + prompts via Claude Haiku)
 *
 * Substitui o serviço Gemini/fal.ai. Responsabilidades:
 * - Gerar prompts de imagem dinâmicos por nicho/copy usando Claude Haiku 4.5
 * - Gerar 3 imagens via Pollinations.ai (Flux por baixo), em paralelo — GRÁTIS, sem chave
 * - Fallback gracioso para stock images (Unsplash) quando o Pollinations falha
 * - Garantir variedade (sem duplicatas)
 *
 * Pollinations expõe a imagem numa URL GET (gera sob demanda). Aqui fazemos o
 * fetch no servidor e devolvemos uma data URL (data:image/...;base64,...):
 * - assim confirmamos que a geração funcionou (senão caímos no Unsplash)
 * - o consumidor já sabe lidar: usuário logado → uploadImageToSupabase faz fetch
 *   da data URL e sobe pro Storage; anônimo → a data URL é exibida direto no <img>
 *
 * Mantém a forma de retorno compatível com o consumidor (route.ts usa
 * result.images.{image1,image2,image3}).
 *
 * Opcional: POLLINATIONS_TOKEN (env) eleva o rate limit em produção.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getStockImageVariations } from '@/lib/stock-images';
import { log } from '@/lib/logger';

export interface ImageGenerationResult {
  images: {
    image1: string;
    image2: string;
    image3: string;
  };
  isError: boolean;
  errorMessage?: string;
  source?: 'pollinations' | 'unsplash' | 'fallback';
  metadata?: {
    attemptedPollinations: boolean;
    pollinationsErrorCount: number;
    imageStatus: ('pollinations' | 'unsplash' | 'fallback')[];
  };
}

const PROMPT_MODEL = 'claude-haiku-4-5';
// API nova do Pollinations (gen.pollinations.ai). Geração exige API key.
// Chave secreta (sk_) = SEM rate limit (server-side). Pega em enter.pollinations.ai.
const POLLINATIONS_BASE = 'https://gen.pollinations.ai/image';
const POLLINATIONS_MODEL = 'flux';      // fotos realistas (rápido/barato; ruim com texto)
const TEXT_MODEL = 'gptimage';          // criativos gráficos COM texto (mais lento/caro, texto nítido)
const POLLINATIONS_TIMEOUT_MS = 60000;  // gptimage demora ~15-20s/imagem

// ---------- Anthropic client (lazy) ----------
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY não configurada no servidor');
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// Prompts estáticos de fallback por nicho (usados se o Claude falhar)
const STATIC_PROMPTS: Record<string, string[]> = {
  emagrecimento: [
    'Professional fitness transformation photo, fit healthy body, motivational, bright lighting, high quality realistic photography',
    'Healthy lifestyle image, confident energetic person, vibrant colors, summer vibes, professional photography',
    'Weight loss success portrait, happy smiling person, healthy glow, modern aesthetic, professional photography'
  ],
  renda_extra: [
    'Person working from home on laptop earning income, modern workspace, coffee, productivity, bright modern office, professional photography',
    'Successful digital entrepreneur at desk, multiple screens, business growth charts, professional atmosphere',
    'Passive income concept, person celebrating earnings, financial growth, modern professional illustration'
  ],
  igaming: [
    'Exciting colorful gaming interface, slots and cards, big wins, dynamic professional casino aesthetic',
    'Celebration of a big win, excitement, victory, bright energetic colors, modern digital art',
    'Clean professional gaming dashboard UI, user-friendly, attractive layout, modern design'
  ],
  estetica: [
    'Professional skincare facial treatment, glowing skin, spa aesthetic, luxury feel, professional lighting',
    'Elegant cosmetics product showcase, skincare routine, fresh glowing skin, minimalist aesthetic',
    'Facial rejuvenation concept, youthful skin glow, luxury beauty brand aesthetic, professional photography'
  ],
  ecommerce: [
    'Professional product display, attractive merchandise, modern retail environment, bright lighting',
    'Online store hero image, diverse products, shopping bag, modern marketplace aesthetic',
    'Happy customer with products, delivery box, satisfaction, modern e-commerce aesthetic'
  ],
  alimentacao: [
    'Professional healthy food photography, fresh organic ingredients, restaurant quality presentation, appetizing',
    'Beautifully plated gourmet meal, food packaging, fresh ingredients, warm lighting, professional food photography',
    'Nutrition and wellness image, balanced diet, superfoods, vibrant colors, clean aesthetic'
  ],
  geral: [
    'Professional business success image, growth chart, productivity, modern corporate environment, bright design',
    'Digital marketing concept, professional person with technology, business growth, modern aesthetic',
    'Success and achievement visual, motivational, professional, modern business, bright colors'
  ]
};

const IMAGE_PROMPT_TOOL: Anthropic.Tool = {
  name: 'submit_image_prompts',
  description: 'Submete 3 prompts de imagem distintos e detalhados (em inglês) para um gerador de imagens.',
  input_schema: {
    type: 'object',
    properties: {
      prompts: {
        type: 'array',
        description: 'Exatamente 3 prompts de imagem, em inglês, visualmente distintos entre si.',
        items: { type: 'string' }
      }
    },
    required: ['prompts']
  }
};

const PROMPT_SYSTEM = `You are an expert at writing detailed image-generation prompts (for diffusion / image models like Flux) for high-converting Facebook/Instagram ads.

Write EXACTLY 3 photorealistic image prompts. They share the same visual STYLE but each shows a CLEARLY DIFFERENT scene, subject and composition — they must NOT look like 3 versions of the same photo.

ANGLES (each prompt = a distinct moment of the customer journey):
- Prompt 1 — PAIN / PROBLEM: a relatable person experiencing the frustration/struggle the offer solves (e.g. tired, overwhelmed, stuck), in an everyday setting. Tasteful, empathetic, never depressing or graphic.
- Prompt 2 — SOLUTION / RESULT: a DIFFERENT scene showing the happy outcome / the solution in joyful action — transformation, relief, success. Bright and aspirational.
- Prompt 3 — AUTHORITY / PROOF: a DIFFERENT scene conveying credibility — a confident expert/professional, a trusted environment, or a satisfied community/social-proof vibe.

CRITICAL — the 3 images MUST be visually distinct from each other:
- Different subjects, poses, settings, framing and composition in each.
- Vary the shot type across the three (e.g. close emotional portrait / wide lifestyle scene / medium professional shot).
- Do NOT reuse the same person, pose, location or layout across prompts.

Each prompt MUST:
1. Reference the specific benefit/offer from its matching copy.
2. Be relevant to the niche and written in English with quality hints ("professional photography", "high quality", "sharp focus").
3. Be well-framed: keep the subject fully inside the frame with comfortable headroom and margins — NOT a tight crop that cuts off the head, face or body at the edges. Balanced, centered composition with breathing room.

REFERENCE STYLE: When a reference style is provided, replicate only its visual TREATMENT — color palette, lighting, color grade, photographic quality and overall mood — so all 3 feel like the same winning campaign. Do NOT copy its exact subject or composition; keep each scene distinct as required above.

FACEBOOK AD POLICY — STRICT (never violate):
- NEVER include text, words, captions, numbers, watermarks, or logos in the image.
- NEVER "before/after" comparisons or split images.
- NEVER negative body image, body-shaming, weight scales, close-ups of body parts, skin/health conditions, or implied "ideal body". For weight-loss/health niches, depict lifestyle, emotion and activity — NOT bodies.
- No nudity, no shocking/gory/sensational content, no depicted medical claims.
- Keep imagery suitable for a broad audience and compliant with Meta Advertising Standards.

Always respond by calling the submit_image_prompts tool with exactly 3 prompts (order: pain, solution, authority) — never free text.`;

export interface AdVariants {
  variante1: string;
  variante2: string;
  variante3: string;
}

type AllowedMedia = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
const ALLOWED_MEDIA: AllowedMedia[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
// Limite de segurança para o base64 enviado à Anthropic (~5MB é o teto da API).
const MAX_REFERENCE_BYTES = 4_500_000;

/**
 * Converte uma URL de imagem numa fonte de imagem BASE64 para análise por visão.
 *
 * IMPORTANTE: usamos base64 (não `{type:'url'}`) porque o fetch de imagem da
 * Anthropic respeita o robots.txt, e o CDN do Facebook bloqueia (erro 400). Ao
 * baixar a imagem aqui no servidor e mandar os bytes, contornamos isso.
 * Retorna null se não for imagem suportada, exceder o tamanho, ou falhar.
 */
async function fetchImageAsBase64Source(url: string): Promise<Anthropic.ImageBlockParam['source'] | null> {
  // data URL → já é base64, só parsear
  if (url.startsWith('data:')) {
    const m = url.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
    if (!m) return null;
    return { type: 'base64', media_type: m[1] as AllowedMedia, data: m[2] };
  }
  if (!/^https?:\/\//i.test(url)) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'SpyBot/1.0' } });
    if (!res.ok) return null;

    const rawType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    if (!rawType.startsWith('image/')) return null;
    const media_type: AllowedMedia = ALLOWED_MEDIA.includes(rawType as AllowedMedia)
      ? (rawType as AllowedMedia)
      : 'image/jpeg';

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_REFERENCE_BYTES) return null;

    return { type: 'base64', media_type, data: buffer.toString('base64') };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface ReferenceAnalysis {
  type: 'photo' | 'graphic';
  profile: string;
}

const REFERENCE_TOOL: Anthropic.Tool = {
  name: 'submit_reference_analysis',
  description: 'Classifica o criativo de anúncio (foto vs gráfico) e descreve seu estilo visual.',
  input_schema: {
    type: 'object',
    properties: {
      creative_type: {
        type: 'string',
        enum: ['photo', 'graphic'],
        description: 'photo = fotografia realista de pessoas/produto/cena. graphic = peça de design com TEXTO/headline, botões (CTA), cards, ícones (estilo Canva/UI).'
      },
      style: {
        type: 'string',
        description: 'Descrição do tratamento visual para replicar (paleta de cores, fundo, iluminação, tipografia geral, estilo de botões/cards, mood). Em inglês, 3-4 frases. NÃO transcreva o texto exato do criativo.'
      }
    },
    required: ['creative_type', 'style']
  }
};

/**
 * Analisa a imagem do anúncio original (visão, Claude Haiku): classifica se é
 * FOTO ou GRÁFICO-com-texto e descreve o estilo visual — para replicar a mesma
 * pegada do criativo que já está escalando. Retorna null se falhar/sem imagem.
 */
async function analyzeReference(imageUrl: string): Promise<ReferenceAnalysis | null> {
  const source = await fetchImageAsBase64Source(imageUrl);
  if (!source) return null;

  try {
    const message = await getAnthropic().messages.create(
      {
        model: PROMPT_MODEL,
        max_tokens: 400,
        tools: [REFERENCE_TOOL],
        tool_choice: { type: 'tool', name: 'submit_reference_analysis' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source },
              {
                type: 'text',
                text: 'Analise este criativo de anúncio do Facebook. Decida se é uma FOTO realista ou um GRÁFICO desenhado (com texto/headline, botões, cards). Depois descreva o estilo visual para replicar. Não transcreva o texto exato.'
              }
            ]
          }
        ]
      },
      { timeout: 20000 }
    );

    const toolBlock = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const input = toolBlock?.input as { creative_type?: string; style?: string } | undefined;
    if (!input?.style) return null;

    const type: ReferenceAnalysis['type'] = input.creative_type === 'graphic' ? 'graphic' : 'photo';
    log.info('IMAGE', 'Referência analisada (visão)', { type, chars: input.style.length });
    return { type, profile: input.style.trim() };
  } catch (error) {
    log.warn('IMAGE', 'Falha ao analisar referência', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Gera 3 prompts via Claude Haiku — um por ângulo (dor, solução, prova), cada um
 * casado com o copy da sua variante e, quando disponível, replicando o estilo
 * visual do anúncio original. Fallback para prompts estáticos se falhar.
 */
/** Chama o Haiku para gerar 3 prompts via tool. Retorna null se falhar. */
async function runPromptTool(systemPrompt: string, userContent: string): Promise<string[] | null> {
  const message = await getAnthropic().messages.create(
    {
      model: PROMPT_MODEL,
      max_tokens: 1100,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      tools: [IMAGE_PROMPT_TOOL],
      tool_choice: { type: 'tool', name: 'submit_image_prompts' },
      messages: [{ role: 'user', content: userContent }]
    },
    { timeout: 25000 }
  );
  const toolBlock = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  const prompts = (toolBlock?.input as { prompts?: unknown })?.prompts;
  if (Array.isArray(prompts) && prompts.length >= 3) {
    return prompts.slice(0, 3).map((p) => String(p));
  }
  return null;
}

/**
 * Prompts para criativos FOTOGRÁFICOS (Flux). 3 cenas distintas por ângulo.
 */
async function generatePhotoPrompts(
  niche: string,
  variants: AdVariants,
  styleProfile: string
): Promise<string[]> {
  try {
    const refBlock = styleProfile
      ? `REFERENCE STYLE (replicate this exact visual style in all 3 prompts):\n${styleProfile}\n\n`
      : '';
    const userContent =
      `${refBlock}Niche: ${niche}\n\n` +
      `Copy for prompt 1 (PAIN angle): ${variants.variante1.substring(0, 350)}\n` +
      `Copy for prompt 2 (SOLUTION angle): ${variants.variante2.substring(0, 350)}\n` +
      `Copy for prompt 3 (AUTHORITY/PROOF angle): ${variants.variante3.substring(0, 350)}\n\n` +
      `Write the 3 image prompts (pain, solution, authority) and call submit_image_prompts.`;

    const prompts = await runPromptTool(PROMPT_SYSTEM, userContent);
    if (prompts) {
      log.info('IMAGE', `Prompts de FOTO gerados via Claude Haiku${styleProfile ? ' (com estilo de referência)' : ''}`);
      return prompts;
    }
    log.warn('IMAGE', 'Claude não retornou 3 prompts — usando estáticos');
  } catch (error) {
    log.warn('IMAGE', 'Erro ao gerar prompts de foto', error instanceof Error ? error.message : String(error));
  }
  return STATIC_PROMPTS[niche] || STATIC_PROMPTS.geral;
}

const GRAPHIC_PROMPT_SYSTEM = `You are an expert at writing prompts for an image model that renders DESIGNED social-media ad GRAPHICS WITH CRISP, READABLE TEXT in Brazilian Portuguese — like a marketer's high-converting Canva creative.

Write EXACTLY 3 prompts (order: pain, solution, authority). For EACH prompt:
1. Distill the matching copy into a SHORT punchy Brazilian Portuguese HEADLINE (max ~8 words). Put it in the prompt inside quotes for the model to render literally.
2. Include a short call-to-action button label in Portuguese, in quotes (e.g. "Quero agora").
3. Describe the graphic design: background, color scheme, centered layout, optional comparison cards or bullet points or icons, and button style — replicate the REFERENCE DESIGN style when provided.
4. Explicitly demand: crisp, sharp, perfectly spelled, highly readable text; clean modern professional layout; flat design / UI aesthetic.

The 3 graphics MUST differ in headline and angle (pain → problem question, solution → benefit/result, authority → proof/credibility) but share the same design style.

POLICY: correct Portuguese spelling is mandatory; no misleading claims, no before/after, no body-shaming, no nudity, no real brand logos.

Always call submit_image_prompts with exactly 3 prompts.`;

/**
 * Prompts para criativos GRÁFICOS COM TEXTO (gptimage). Cada prompt embute um
 * headline curto (destilado do copy) + CTA, replicando o design da referência.
 */
async function generateGraphicPrompts(
  niche: string,
  variants: AdVariants,
  designProfile: string
): Promise<string[] | null> {
  try {
    const refBlock = designProfile
      ? `REFERENCE DESIGN (replicate this exact design style in all 3):\n${designProfile}\n\n`
      : '';
    const userContent =
      `${refBlock}Niche: ${niche}\n\n` +
      `Copy for graphic 1 (PAIN angle): ${variants.variante1.substring(0, 400)}\n` +
      `Copy for graphic 2 (SOLUTION angle): ${variants.variante2.substring(0, 400)}\n` +
      `Copy for graphic 3 (AUTHORITY/PROOF angle): ${variants.variante3.substring(0, 400)}\n\n` +
      `Write the 3 graphic-design prompts (each with a short PT headline + CTA in quotes) and call submit_image_prompts.`;

    const prompts = await runPromptTool(GRAPHIC_PROMPT_SYSTEM, userContent);
    if (prompts) {
      log.info('IMAGE', 'Prompts GRÁFICOS (com texto) gerados via Claude Haiku');
      return prompts;
    }
    log.warn('IMAGE', 'Claude não retornou 3 prompts gráficos');
  } catch (error) {
    log.warn('IMAGE', 'Erro ao gerar prompts gráficos', error instanceof Error ? error.message : String(error));
  }
  return null;
}

type ImageAspect = 'square' | 'portrait';

// Tamanhos recomendados pelo Meta para anúncios de feed:
// - 1:1 (quadrado) = 1080x1080
// - 4:5 (vertical de feed) = 1080x1350  → bate com o container aspect-[4/5] da UI (sem corte)
const ASPECT_SIZE: Record<ImageAspect, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 }
};

/**
 * Monta a URL do Pollinations para um prompt. Seed aleatório garante variedade
 * (evita imagens idênticas mesmo com prompts parecidos).
 */
function buildPollinationsUrl(prompt: string, aspect: ImageAspect, model: string): string {
  const { width, height } = ASPECT_SIZE[aspect];
  const seed = Math.floor(Math.random() * 1_000_000);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model,
    seed: String(seed)
  });
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
}

const POLLINATIONS_MAX_ATTEMPTS = 3;
// Status que valem retry: 429 (rate limit) e 5xx (instabilidade).
// 402 NÃO entra: na API nova (gen.pollinations.ai) 402 = saldo de pollen insuficiente
// — retry só desperdiçaria tempo (não adiciona saldo). Falha rápido → fallback Unsplash.
const POLLINATIONS_RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Faz UMA tentativa de fetch no Pollinations. Retorna a data URL ou lança um
 * Error com `.retryable` indicando se vale a pena tentar de novo.
 */
async function fetchPollinationsOnce(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), POLLINATIONS_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'User-Agent': 'SpyBot/1.0' };
    if (process.env.POLLINATIONS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.POLLINATIONS_TOKEN}`;
    }

    const response = await fetch(url, { signal: controller.signal, headers });
    if (!response.ok) {
      const err = new Error(`Pollinations HTTP ${response.status}`) as Error & { retryable?: boolean };
      err.retryable = POLLINATIONS_RETRY_STATUS.has(response.status);
      throw err;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Pollinations retornou conteúdo não-imagem (${contentType})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new Error('Pollinations retornou imagem vazia');
    }

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Gera UMA imagem via Pollinations, com retry + backoff em rate limit (402/429)
 * e instabilidade (5xx). Retorna uma data URL (base64). Lança após esgotar as
 * tentativas (para acionar o fallback Unsplash em generateAdImages).
 */
export async function generateSingleImage(
  prompt: string,
  aspect: ImageAspect = 'square',
  model: string = POLLINATIONS_MODEL
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= POLLINATIONS_MAX_ATTEMPTS; attempt++) {
    // Seed novo a cada tentativa evita resposta cacheada de um erro anterior.
    const url = buildPollinationsUrl(prompt, aspect, model);
    try {
      return await fetchPollinationsOnce(url);
    } catch (error) {
      lastError = error;
      const retryable = (error as { retryable?: boolean })?.retryable ?? false;
      if (!retryable || attempt === POLLINATIONS_MAX_ATTEMPTS) {
        break;
      }
      // Backoff: ~1.5s, 3s, 4.5s + jitter aleatório — dá tempo da janela de
      // rate limit liberar e desincroniza retentativas concorrentes (evita
      // que as 3 imagens colidam de novo no mesmo instante).
      const waitMs = 1500 * attempt + Math.floor(Math.random() * 1000);
      log.warn('IMAGE', `Pollinations rate limit/instável (tentativa ${attempt}/${POLLINATIONS_MAX_ATTEMPTS}), aguardando ${waitMs}ms`);
      await sleep(waitMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Gera 3 imagens (2 quadradas + 1 vertical) via Pollinations, com fallback Unsplash
 * e checagem de duplicatas. Mesmo contrato de saída usado pelo route.ts.
 *
 * @param niche - Nicho detectado
 * @param variants - As 3 variações de copy (cada imagem casa com seu ângulo: dor/solução/prova)
 * @param referenceImageUrl - (opcional) imagem do anúncio original, p/ replicar o estilo via visão
 */
export async function generateAdImages(
  niche: string,
  variants: AdVariants,
  referenceImageUrl?: string
): Promise<ImageGenerationResult> {
  const imageStatus: ('pollinations' | 'unsplash' | 'fallback')[] = [];
  let pollinationsErrorCount = 0;

  try {
    log.info('IMAGE', 'Iniciando geração de 3 imagens (Pollinations)', { niche, hasReference: !!referenceImageUrl });

    // Analisa o anúncio original (quando há referência): tipo (foto/gráfico) + estilo
    const reference = referenceImageUrl ? await analyzeReference(referenceImageUrl) : null;
    const isGraphic = reference?.type === 'graphic';
    const profile = reference?.profile ?? '';

    // Gráfico-com-texto → gptimage + prompts com headline/CTA; senão → Flux fotográfico.
    // Se a geração de prompts gráficos falhar, cai no fluxo fotográfico (seguro).
    const graphicPrompts = isGraphic ? await generateGraphicPrompts(niche, variants, profile) : null;
    const useGraphic = !!graphicPrompts;
    const prompts = graphicPrompts ?? (await generatePhotoPrompts(niche, variants, profile));
    const model = useGraphic ? TEXT_MODEL : POLLINATIONS_MODEL;

    log.info('IMAGE', `Modo de geração: ${useGraphic ? 'GRÁFICO (gptimage)' : 'FOTO (flux)'}`);

    // Gráficos de feed costumam ser quadrados; fotos mantêm 2 quadradas + 1 vertical.
    const aspects: ImageAspect[] = useGraphic ? ['square', 'square', 'square'] : ['square', 'square', 'portrait'];

    const settled = await Promise.allSettled([
      generateSingleImage(prompts[0], aspects[0], model),
      generateSingleImage(prompts[1], aspects[1], model),
      generateSingleImage(prompts[2], aspects[2], model)
    ]);

    const urls: string[] = [];
    const failures: number[] = [];

    settled.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        urls[i] = res.value;
        imageStatus[i] = 'pollinations';
        log.info('IMAGE', `✅ Imagem ${i + 1} gerada via Pollinations`);
      } else {
        pollinationsErrorCount++;
        failures.push(i);
        log.warn('IMAGE', `❌ Imagem ${i + 1} falhou no Pollinations`, res.reason?.message);
      }
    });

    // Todas falharam → Unsplash dinâmico
    if (failures.length === 3) {
      log.warn('IMAGE', 'Todas as imagens Pollinations falharam, usando Unsplash');
      const stock = await getStockImageVariations(niche, 3);
      return {
        images: { image1: stock[0].url, image2: stock[1].url, image3: stock[2].url },
        isError: true,
        errorMessage: 'Todas as gerações Pollinations falharam, usando Unsplash',
        source: 'unsplash',
        metadata: { attemptedPollinations: true, pollinationsErrorCount: 3, imageStatus: ['unsplash', 'unsplash', 'unsplash'] }
      };
    }

    // Algumas falharam → completar com Unsplash
    if (failures.length > 0) {
      const stock = await getStockImageVariations(niche, failures.length);
      failures.forEach((failIndex, idx) => {
        urls[failIndex] = stock[idx].url;
        imageStatus[failIndex] = 'unsplash';
        log.info('IMAGE', `🔄 Imagem ${failIndex + 1} completada via Unsplash`);
      });
    }

    // Sem duplicatas (variedade)
    if (new Set(urls).size < 3) {
      log.warn('IMAGE', '⚠️ Imagens duplicadas — regenerando via Unsplash');
      const fresh = await getStockImageVariations(niche, 3);
      return {
        images: { image1: fresh[0].url, image2: fresh[1].url, image3: fresh[2].url },
        isError: false,
        source: 'fallback',
        metadata: { attemptedPollinations: true, pollinationsErrorCount, imageStatus: ['fallback', 'fallback', 'fallback'] }
      };
    }

    const allSucceeded = settled.every((r) => r.status === 'fulfilled');
    return {
      images: { image1: urls[0], image2: urls[1], image3: urls[2] },
      isError: false,
      source: allSucceeded ? 'pollinations' : 'unsplash',
      metadata: { attemptedPollinations: true, pollinationsErrorCount, imageStatus }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('IMAGE', 'Erro crítico na geração de imagens', errorMessage);

    try {
      const fallback = await getStockImageVariations(niche, 3);
      return {
        images: { image1: fallback[0].url, image2: fallback[1].url, image3: fallback[2].url },
        isError: true,
        errorMessage,
        source: 'fallback',
        metadata: { attemptedPollinations: true, pollinationsErrorCount: 3, imageStatus: ['fallback', 'fallback', 'fallback'] }
      };
    } catch (fallbackError) {
      log.error('IMAGE', 'Falha no fallback Unsplash também', fallbackError);
      throw new Error(`Falha crítica: Pollinations e Unsplash falharam. Original: ${errorMessage}`);
    }
  }
}

/**
 * Valida se a geração foi bem-sucedida
 */
export function isImageGenerationValid(result: ImageGenerationResult): boolean {
  return !!result.images.image1 && !!result.images.image2 && !!result.images.image3;
}
