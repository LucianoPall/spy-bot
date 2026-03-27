/**
 * Spy Engine API — Route Handler (REFACTORED)
 *
 * Orquestra os 5 services para processar anúncios Facebook
 * Pipeline:
 *   1. Validação + Niche detection
 *   2. Rate limiting check
 *   3. Billing validation
 *   4. Apify extraction
 *   5. OpenAI variations
 *   6. DALL-E images
 *   7. Storage upload
 *   8. Database save
 *   9. Response format
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { logger, STAGES } from './logger';
import { getMockAdData } from '@/lib/mockAdData';
import { GeneratedImages } from '@/lib/types';
import { detectNicheWithScores, getNicheConfidencePercentage } from '@/lib/niche-detection';
import { getNichePromptContext } from '@/lib/niche-prompts';
import { refundOnApifyFailure, refundOnOpenAIFailure } from './validation-refund';
import { checkRateLimit, getLimitForRoute } from '@/lib/rate-limiter';
import { validateFacebookAdUrl } from '@/lib/validation';
import {
  extractAdWithApify,
  generateCopyVariations,
  generateImagesWithDALLE,
  loadUserBilling,
  uploadImageToSupabase
} from '@/services';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

export const maxDuration = 60;

/**
 * Detecta nicho usando sistema de scores
 */
function detectNicheWithConfidence(adUrl: string, copy: string = '') {
  const scores = detectNicheWithScores(adUrl, copy);
  const confidence = getNicheConfidencePercentage(scores);

  logger.info(STAGES.START, '🎯 Detecção de Nicho', {
    nicho: scores.primary.niche,
    confianca: `${confidence}%`,
    keywords: scores.keywords.slice(0, 5)
  });

  return {
    niche: scores.primary.niche,
    confidence: scores.primary.confidence,
    confidencePercent: confidence
  };
}

/**
 * POST /api/spy-engine
 * Processa anúncio Facebook e gera variações
 */
export async function POST(req: Request) {
  // Generate correlation ID for this request
  const traceId = crypto.randomUUID();

  logger.clear();
  logger.startTimer('TOTAL_REQUEST');

  try {
    const { adUrl, brandProfile, manualCopy, manualImage, isManualInput } = await req.json();
    const usingManualInput = isManualInput && manualCopy;

    // Get user for context
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Set logger context with traceId and userId
    logger.setContext(traceId, userId);

    logger.info(STAGES.START, 'Requisição recebida', {
      url: adUrl?.substring(0, 80),
      usingManualInput,
      hasBrandProfile: !!brandProfile
    });

    // ========== VALIDAÇÃO ==========
    if (!adUrl && !usingManualInput) {
      logger.error(STAGES.VALIDATION, 'URL não fornecida');
      return NextResponse.json({ error: 'URL do anúncio não fornecida.' }, { status: 400 });
    }

    // Validar URL do Facebook (proteção contra DoS e injeção)
    if (adUrl) {
      const urlValidation = validateFacebookAdUrl(adUrl);
      if (!urlValidation.valid) {
        logger.error(STAGES.VALIDATION, 'URL inválida', { error: urlValidation.error });
        return NextResponse.json(
          { error: `URL inválida: ${urlValidation.error}` },
          { status: 400 }
        );
      }
    }

    if (!process.env.APIFY_API_TOKEN || !process.env.OPENAI_API_KEY) {
      logger.error(STAGES.VALIDATION, 'Chaves de API ausentes');
      return NextResponse.json({ error: 'Chaves de API ausentes no servidor.' }, { status: 500 });
    }

    logger.success(STAGES.VALIDATION, 'Validação OK');

    // ========== NICHE DETECTION ==========
    const initialNicheDetection = usingManualInput
      ? detectNicheWithConfidence('manual://provided', manualCopy)
      : detectNicheWithConfidence(adUrl);
    const detectedNiche = initialNicheDetection.niche;

    // ========== AUTH + RATE LIMIT ==========
    let currentPlan = 'gratis';
    let currentCredits = 5;

    if (user) {
      logger.info(STAGES.BILLING, 'Usuário autenticado', { userId: user.id });

      // Rate limit check
      const limit = getLimitForRoute('/api/spy-engine');
      const rateLimitResult = await checkRateLimit(user.id, '/api/spy-engine', limit);

      if (!rateLimitResult.allowed) {
        logger.warn(STAGES.BILLING, '⚠️ Rate limit excedido');
        return NextResponse.json(
          { error: 'Too Many Requests', message: `Limite de ${limit} req/min atingido` },
          { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
        );
      }

      // Billing info
      const billing = await loadUserBilling(supabase, user.id, user.email || '', user.email === process.env.ADMIN_EMAIL);
      currentPlan = billing.plan;
      currentCredits = billing.credits;

      if (!billing.canUseService) {
        logger.error(STAGES.BILLING, '❌ Acesso bloqueado - sem créditos');
        return NextResponse.json(
          { error: 'OUT_OF_CREDITS', message: 'Você atingiu o limite de requisições grátis.' },
          { status: 403 }
        );
      }
    }

    logger.success(STAGES.BILLING, 'Billing OK', { plan: currentPlan, credits: currentCredits });

    // ========== APIFY EXTRACTION ==========
    logger.info(STAGES.APIFY_CALL, 'Iniciando extração');
    let originalCopy = '';
    let adImageUrl = '';
    let apifyErrorMessage = '';

    if (usingManualInput) {
      originalCopy = manualCopy.trim();
      adImageUrl = manualImage || '';
      logger.success(STAGES.APIFY_SUCCESS, '✅ Dados manuais carregados');
    } else {
      const apifyResult = await extractAdWithApify(adUrl, process.env.APIFY_API_TOKEN || '');

      if (apifyResult.isError) {
        apifyErrorMessage = apifyResult.errorMessage || 'Erro desconhecido';
        if (user && currentPlan === 'gratis') {
          await refundOnApifyFailure(user.id, apifyErrorMessage);
        }

        // Fallback
        const mockData = getMockAdData(adUrl, detectedNiche);
        originalCopy = mockData.copy;
        adImageUrl = mockData.image;
        logger.warn(STAGES.FALLBACK, '⚠️ Usando mock data');
      } else {
        originalCopy = apifyResult.originalCopy;
        adImageUrl = apifyResult.adImageUrl;
        logger.success(STAGES.APIFY_SUCCESS, '✅ Extração concluída');
      }
    }

    // Fallback se ainda vazio
    if (!originalCopy || !adImageUrl) {
      const mockData = getMockAdData(adUrl, detectedNiche);
      if (!originalCopy) originalCopy = mockData.copy;
      if (!adImageUrl) adImageUrl = mockData.image;
    }

    // ========== OPENAI VARIATIONS ==========
    logger.info(STAGES.OPENAI_CALL, 'Gerando variações');
    const contextPrompt = getNichePromptContext(detectedNiche);
    const openaiResult = await generateCopyVariations(
      openai,
      originalCopy,
      detectedNiche,
      contextPrompt
    );

    if (openaiResult.isError) {
      const errorMsg = openaiResult.errorMessage || 'Erro OpenAI';
      if (user && currentPlan === 'gratis') {
        await refundOnOpenAIFailure(user.id, errorMsg);
      }
    }

    logger.success(STAGES.OPENAI_SUCCESS, '✅ Variações geradas');

    // ========== DALLE IMAGES ==========
    logger.info(STAGES.DALLE_CALL, 'Gerando imagens');
    const dalleResult = await generateImagesWithDALLE(
      openai,
      detectedNiche,
      openaiResult.variations.variante1
    );

    logger.success(STAGES.DALLE_SUCCESS, '✅ Imagens geradas');

    // ========== STORAGE UPLOAD ==========
    logger.info(STAGES.DALLE_CALL, 'Uploadando imagens');
    let uploadedImage1 = dalleResult.images.image1;
    let uploadedImage2 = dalleResult.images.image2;
    let uploadedImage3 = dalleResult.images.image3;

    if (user) {
      try {
        const results = await Promise.all([
          uploadImageToSupabase(dalleResult.images.image1, supabase, user.id, 1),
          uploadImageToSupabase(dalleResult.images.image2, supabase, user.id, 2),
          uploadImageToSupabase(dalleResult.images.image3, supabase, user.id, 3)
        ]);

        uploadedImage1 = results[0].url;
        uploadedImage2 = results[1].url;
        uploadedImage3 = results[2].url;
        logger.success(STAGES.STORAGE_SUCCESS, '✅ Upload concluído');
      } catch (uploadError) {
        logger.warn(STAGES.STORAGE_FAIL, '⚠️ Erro no upload, usando URLs originais');
      }
    }

    // ========== DATABASE SAVE ==========
    if (user) {
      try {
        await supabase.from('spybot_generations').insert({
          user_id: user.id,
          original_ad_copy: originalCopy,
          original_ad_image: adImageUrl,
          variante1: openaiResult.variations.variante1,
          variante2: openaiResult.variations.variante2,
          variante3: openaiResult.variations.variante3,
          image1: uploadedImage1,
          image2: uploadedImage2,
          image3: uploadedImage3,
          niche: detectedNiche,
          strategic_analysis: openaiResult.strategicAnalysis,
          created_at: new Date().toISOString()
        });

        // Deduzir crédito apenas se sucesso e plano gratis
        if (currentPlan === 'gratis') {
          const newCredits = Math.max(0, currentCredits - 1);
          await supabase
            .from('spybot_subscriptions')
            .update({ credits: newCredits })
            .eq('user_id', user.id);
          currentCredits = newCredits;
        }

        logger.success(STAGES.SUPABASE_SUCCESS, '✅ Dados salvos em DB');
      } catch (dbError) {
        logger.warn(STAGES.SUPABASE_FAIL, '⚠️ Erro ao salvar em DB');
      }
    }

    // ========== RESPONSE ==========
    const generatedImages: GeneratedImages = {
      image1: {
        url: uploadedImage1,
        type: 'generated',
        isTemporary: false,
        niche: detectedNiche,
        source: { provider: detectProvider(uploadedImage1) },
        metadata: { retryCount: 0, uploadDuration: 0 }
      },
      image2: {
        url: uploadedImage2,
        type: 'generated',
        isTemporary: false,
        niche: detectedNiche,
        source: { provider: detectProvider(uploadedImage2) },
        metadata: { retryCount: 0, uploadDuration: 0 }
      },
      image3: {
        url: uploadedImage3,
        type: 'generated',
        isTemporary: false,
        niche: detectedNiche,
        source: { provider: detectProvider(uploadedImage3) },
        metadata: { retryCount: 0, uploadDuration: 0 }
      }
    };

    logger.endTimer('TOTAL_REQUEST', STAGES.END);

    const responseData = {
      success: true,
      traceId, // Include correlation ID for client tracking
      originalAd: {
        copy: originalCopy,
        image: adImageUrl
      },
      generatedVariations: {
        variante1: openaiResult.variations.variante1,
        variante2: openaiResult.variations.variante2,
        variante3: openaiResult.variations.variante3
      },
      generatedImages,
      strategicAnalysis: openaiResult.strategicAnalysis,
      niche: detectedNiche,
      creditsRemaining: user ? currentCredits : undefined,
      logs: logger.exportAsJSON()
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    logger.error(STAGES.ERROR_CRITICAL, 'Erro crítico', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: errorMessage, logs: logger.exportAsJSON() },
      { status: 500 }
    );
  }
}

/**
 * Detecta provider da imagem pela URL
 */
function detectProvider(url: string): 'dalle' | 'supabase' | 'unsplash' | 'fallback' {
  if (url.includes('oaidalleapiprodscus')) return 'dalle';
  if (url.includes('unsplash.com')) return 'unsplash';
  if (url.includes('supabase')) return 'supabase';
  return 'fallback';
}
