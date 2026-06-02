/**
 * Spy Engine API — Route Handler (REFACTORED)
 *
 * Orquestra os 5 services para processar anúncios Facebook
 * Pipeline:
 *   1. Validação + Niche detection
 *   2. Rate limiting check
 *   3. Billing validation
 *   4. Apify extraction
 *   5. Copy variations (Claude Sonnet 4.6)
 *   6. Images (Pollinations.ai / Flux)
 *   7. Storage upload
 *   8. Database save
 *   9. Response format
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger, STAGES } from './logger';
import { getMockAdData } from '@/lib/mockAdData';
import { GeneratedImages } from '@/lib/types';
import { detectNicheWithScores, getNicheConfidencePercentage } from '@/lib/niche-detection';
import { getNichePromptContext } from '@/lib/niche-prompts';
import { scrapeLandingForNicheContext, normalizeLandingUrl } from '@/lib/landing-page-scraper';
import { detectAdultContent, ADULT_CONTENT_BLOCK_MESSAGE, type ContentSafetyCheck } from '@/lib/content-safety';
import type { SupabaseClient } from '@supabase/supabase-js';
import { refundOnApifyFailure, refundOnOpenAIFailure } from './validation-refund';
import { checkRateLimit, getLimitForRoute } from '@/lib/rate-limiter';
import { validateFacebookAdUrl, validateApifyCompatibility } from '@/lib/validation';
import {
  extractAdWithApify,
  generateCopyVariations,
  classifyNiche,
  generateAdImages,
  generateSingleImage,
  loadUserBilling,
  uploadImageToSupabase
} from '@/services';
import { deductCredit } from '@/services/billing.service';
import { sendCloneGeneratedEmail, sendLowCreditsEmail } from '@/services/email.service';
import { getNotificationPrefs } from '@/lib/notification-prefs';

// 120s: criativos gráficos usam gptimage (~15-20s/imagem) + visão + copy.
export const maxDuration = 120;

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
    const { adUrl, brandProfile, manualCopy, manualImage, isManualInput, userProvidedNiche } = await req.json();
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

    // Validar URL do Facebook apenas quando NÃO for input manual
    if (adUrl && !usingManualInput) {
      const urlValidation = validateFacebookAdUrl(adUrl);
      if (!urlValidation.valid) {
        logger.error(STAGES.VALIDATION, 'URL inválida', { error: urlValidation.error });
        return NextResponse.json(
          { error: `URL inválida: ${urlValidation.error}` },
          { status: 400 }
        );
      }

      // Validar compatibilidade com Apify (apenas aviso, não bloqueia)
      const apifyCompat = validateApifyCompatibility(adUrl);
      if (apifyCompat.warning) {
        logger.warn(STAGES.VALIDATION, `⚠️ ${apifyCompat.warning}`);
        if (apifyCompat.recommendation) {
          logger.info(STAGES.VALIDATION, `💡 ${apifyCompat.recommendation}`);
        }
      }
    }

    // FAL_KEY é opcional: o serviço de imagem degrada graciosamente para stock (Unsplash).
    if (!process.env.APIFY_API_TOKEN || !process.env.ANTHROPIC_API_KEY) {
      logger.error(STAGES.VALIDATION, 'Chaves de API ausentes');
      return NextResponse.json({ error: 'Chaves de API ausentes no servidor.' }, { status: 500 });
    }

    logger.success(STAGES.VALIDATION, 'Validação OK');

    // ========== CONTENT SAFETY — CAMADA 1 (pré-Apify, só URL) ==========
    // Bloqueia conteúdo adulto já pela URL, antes de gastar recursos.
    if (adUrl && !usingManualInput) {
      const layer1Check = detectAdultContent({ url: adUrl });
      if (layer1Check.blocked) {
        logger.warn(STAGES.VALIDATION, '🛡️ Conteúdo adulto bloqueado (Camada 1 — URL)', {
          reason: layer1Check.reason,
          matches: layer1Check.matches
        });
        await logBlockedContent(supabase, {
          userId,
          adUrl,
          layer: 1,
          check: layer1Check,
          traceId
        });
        return NextResponse.json(
          {
            ...ADULT_CONTENT_BLOCK_MESSAGE,
            traceId,
            blockedLayer: 1
          },
          { status: 400 }
        );
      }
    }

    // ========== NICHE DETECTION (inicial, só URL / manual copy) ==========
    const initialNicheDetection = usingManualInput
      ? detectNicheWithConfidence('manual://provided', manualCopy)
      : detectNicheWithConfidence(adUrl);
    let detectedNiche = initialNicheDetection.niche;

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
    let adLinkUrl: string | undefined;
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

        // Fallback com suporte para nicho fornecido pelo usuário
        const mockData = getMockAdData(adUrl, userProvidedNiche || detectedNiche);
        originalCopy = mockData.copy;
        adImageUrl = mockData.image;
        logger.warn(STAGES.FALLBACK, '⚠️ Usando mock data');
      } else {
        originalCopy = apifyResult.originalCopy;
        adImageUrl = apifyResult.adImageUrl;
        adLinkUrl = apifyResult.adLinkUrl;
        logger.success(STAGES.APIFY_SUCCESS, '✅ Extração concluída');
      }
    }

    // Fallback apenas para copy (imagem original será gerada com DALL-E se vazia)
    if (!originalCopy) {
      const mockData = getMockAdData(adUrl, detectedNiche);
      originalCopy = mockData.copy;
    }

    // Aviso quando Apify retornou copy muito curto (provável fragmento/botão)
    if (!usingManualInput && originalCopy.length > 0 && originalCopy.length < 30) {
      logger.warn(STAGES.APIFY_SUCCESS, `⚠️ Copy extraído muito curto (${originalCopy.length} chars) — pode ser fragmento/botão`, {
        copyPreview: originalCopy
      });
    }

    // ========== CONTENT SAFETY — CAMADA 2 (pós-Apify, URL + copy) ==========
    // Segunda linha de defesa: agora temos copy extraído, pode pegar casos
    // que a URL crua não denunciava (ex: domínio genérico com conteúdo adulto).
    const layer2Check = detectAdultContent({
      url: adUrl,
      copy: originalCopy + ' ' + (adLinkUrl || '')
    });
    if (layer2Check.blocked) {
      logger.warn(STAGES.APIFY_SUCCESS, '🛡️ Conteúdo adulto bloqueado (Camada 2 — copy extraído)', {
        reason: layer2Check.reason,
        matches: layer2Check.matches,
        copyPreview: originalCopy.substring(0, 100)
      });
      await logBlockedContent(supabase, {
        userId,
        adUrl,
        layer: 2,
        check: layer2Check,
        copyPreview: originalCopy.substring(0, 200),
        traceId
      });
      return NextResponse.json(
        {
          ...ADULT_CONTENT_BLOCK_MESSAGE,
          traceId,
          blockedLayer: 2
        },
        { status: 400 }
      );
    }

    // ========== NICHE REFINEMENT (URL + copy real) ==========
    // Re-detectar usando URL + copy extraído — URL do Ads Library (?id=NNN) não tem keywords,
    // então a detecção inicial quase sempre cai em "geral". Com copy real extraído (Apify ou manual),
    // refinamos pra pegar o nicho verdadeiro.
    let currentConfidence = initialNicheDetection.confidencePercent;

    if (userProvidedNiche) {
      // Usuário forçou nicho manualmente → respeitar (skip refinamento automático)
      if (userProvidedNiche !== detectedNiche) {
        logger.info(STAGES.VALIDATION, '🎯 Nicho fornecido pelo usuário (override)', {
          de: detectedNiche,
          para: userProvidedNiche
        });
        detectedNiche = userProvidedNiche;
        currentConfidence = 100;
      }
    } else if (originalCopy) {
      const refined = detectNicheWithConfidence(adUrl || 'manual://provided', originalCopy);
      if (
        refined.niche !== detectedNiche &&
        refined.confidencePercent > currentConfidence
      ) {
        logger.info(STAGES.VALIDATION, '🔄 Nicho refinado após extração do copy', {
          de: `${detectedNiche} (${currentConfidence}%)`,
          para: `${refined.niche} (${refined.confidencePercent}%)`
        });
        detectedNiche = refined.niche;
        currentConfidence = refined.confidencePercent;
      } else if (refined.confidencePercent > currentConfidence) {
        // Mesmo nicho mas confiança maior — atualizar rastreamento
        currentConfidence = refined.confidencePercent;
      }
    }

    // ========== LANDING PAGE FALLBACK (sinal fraco) ==========
    // Se depois do Apify a confiança ainda tá baixa ou o copy é fragmento/URL,
    // visita a landing page de destino pra enriquecer o contexto.
    // Só roda quando NÃO tem userProvidedNiche e quando o sinal atual é fraco.
    const shouldTryLanding =
      !userProvidedNiche &&
      !usingManualInput &&
      (currentConfidence < 40 || originalCopy.length < 30);

    if (shouldTryLanding) {
      // Candidatos de URL pra visitar: adLinkUrl do Apify → copy (se parecer URL/domínio)
      const landingCandidate =
        normalizeLandingUrl(adLinkUrl) ||
        normalizeLandingUrl(originalCopy);

      if (landingCandidate) {
        logger.info(STAGES.VALIDATION, '🌐 Sinal fraco — visitando landing page pra enriquecer contexto', {
          url: landingCandidate,
          confiancaAtual: `${currentConfidence}%`,
          copyLength: originalCopy.length
        });

        const scrape = await scrapeLandingForNicheContext(landingCandidate);
        if (scrape.success && scrape.text) {
          logger.info(STAGES.VALIDATION, '🌐 Landing scrapeada com sucesso', {
            chars: scrape.text.length
          });

          // Re-detectar usando URL + copy + landing text
          const enrichedText = `${originalCopy} ${scrape.text}`;
          const landingRefined = detectNicheWithConfidence(
            adUrl || landingCandidate,
            enrichedText
          );

          if (landingRefined.confidencePercent > currentConfidence) {
            logger.info(STAGES.VALIDATION, '🔄 Nicho refinado via landing page', {
              de: `${detectedNiche} (${currentConfidence}%)`,
              para: `${landingRefined.niche} (${landingRefined.confidencePercent}%)`
            });
            detectedNiche = landingRefined.niche;
            currentConfidence = landingRefined.confidencePercent;
          } else {
            logger.info(STAGES.VALIDATION, 'ℹ️ Landing não melhorou confiança — mantendo nicho atual');
          }
        } else {
          logger.warn(STAGES.VALIDATION, '⚠️ Falha no fallback de landing — mantendo nicho atual', {
            reason: scrape.reason
          });
        }
      } else {
        logger.info(STAGES.VALIDATION, 'ℹ️ Sinal fraco mas sem URL de landing disponível');
      }
    }

    // ========== NICHE FALLBACK VIA CLAUDE ==========
    // A detecção por palavra-chave costuma dar match 0 em anúncios reais → "geral".
    // Quando isso acontece (e o usuário não forçou nicho), classificamos via Claude
    // a partir do copy real — muito mais confiável.
    if (!userProvidedNiche && detectedNiche === 'geral' && originalCopy && originalCopy.length >= 20) {
      const claudeNiche = await classifyNiche(originalCopy);
      if (claudeNiche && claudeNiche !== 'geral') {
        logger.info(STAGES.VALIDATION, '🤖 Nicho classificado via Claude (keyword falhou)', {
          de: detectedNiche,
          para: claudeNiche
        });
        detectedNiche = claudeNiche;
      }
    }

    // ========== COPY VARIATIONS (Claude Sonnet 4.6) ==========
    logger.info(STAGES.OPENAI_CALL, 'Gerando variações (Claude)');
    const contextPrompt = getNichePromptContext(detectedNiche);
    const openaiResult = await generateCopyVariations(
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

    // Imagem REAL do anúncio original (do Apify/manual), capturada ANTES de
    // eventualmente gerarmos uma substituta — usada como referência de estilo
    // na geração das variações (clonar a "pegada" do criativo vencedor).
    const referenceImageUrl = adImageUrl || undefined;

    // ========== ORIGINAL IMAGE GENERATION ==========
    // Quando não há imagem original (ex: modo manual sem URL), gera uma com Pollinations
    // baseada no copy original — fica no lugar da imagem do anúncio real
    if (!adImageUrl) {
      logger.info(STAGES.DALLE_CALL, '🎨 Sem imagem original — gerando com Pollinations baseado no copy');
      try {
        const originalPrompt = `Professional social media advertisement image for the following offer: "${originalCopy.substring(0, 300)}". Clean, modern, high quality photography, suitable for Facebook/Instagram ads. No text overlays.`;

        const generatedUrl = await generateSingleImage(originalPrompt, 'square');

        if (generatedUrl) {
          if (user) {
            const uploadResult = await uploadImageToSupabase(generatedUrl, supabase, user.id, 0);
            adImageUrl = uploadResult.url;
          } else {
            adImageUrl = generatedUrl;
          }
          logger.success(STAGES.DALLE_SUCCESS, '✅ Imagem original gerada com Pollinations');
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.warn(STAGES.DALLE_CALL, `⚠️ Falha ao gerar imagem original (${errMsg}) — usando stock image`);
        // Fallback: usa imagem stock do Unsplash se o Pollinations falhar
        const { getStockImageVariations } = await import('@/lib/stock-images');
        const fallback = await getStockImageVariations(detectedNiche, 1);
        adImageUrl = fallback[0]?.url || '';
      }
    }

    // ========== IMAGES (Pollinations.ai / Flux) ==========
    // Cada imagem casa com o ângulo da sua variante (dor/solução/prova) e replica
    // o estilo visual do anúncio original (referenceImageUrl) quando disponível.
    logger.info(STAGES.DALLE_CALL, 'Gerando imagens (Pollinations)');
    const dalleResult = await generateAdImages(
      detectedNiche,
      openaiResult.variations,
      referenceImageUrl
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

        // Retry para imagens que falharam no upload (ainda com URL temporária)
        const imageKeys = ['image1', 'image2', 'image3'] as const;
        for (let i = 0; i < results.length; i++) {
          if (!results[i].uploaded && results[i].isTemporary) {
            logger.warn(STAGES.STORAGE_FAIL, `⚠️ Imagem ${i + 1} falhou no upload, retentando...`);
            try {
              const retryResult = await uploadImageToSupabase(
                dalleResult.images[imageKeys[i]],
                supabase, user.id, i + 1
              );
              if (retryResult.uploaded) {
                results[i] = retryResult;
              }
            } catch { /* manter resultado original */ }
          }
        }

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
          original_copy: originalCopy,
          original_image: adImageUrl,
          original_url: adUrl || null,
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
          await deductCredit(supabase, user.id, currentPlan, currentCredits);
          currentCredits = Math.max(0, currentCredits - 1);
        }

        logger.success(STAGES.SUPABASE_SUCCESS, '✅ Dados salvos em DB');

        // ========== NOTIFICAÇÕES POR EMAIL (best-effort, não bloqueia) ==========
        try {
          const prefs = getNotificationPrefs(user.user_metadata);

          if (user.email && prefs.emailNewClones) {
            await sendCloneGeneratedEmail(user.email, { niche: detectedNiche, adUrl });
          }

          // Alerta de créditos baixos: dispara UMA vez, ao chegar no último crédito.
          // (gratis é decrementado acima, então passa por currentCredits === 1 só uma vez.)
          if (
            user.email &&
            prefs.lowCreditsAlert &&
            currentPlan === 'gratis' &&
            currentCredits === 1
          ) {
            await sendLowCreditsEmail(user.email, { creditsRemaining: currentCredits });
          }
        } catch {
          logger.warn(STAGES.SUPABASE_FAIL, '⚠️ Falha ao enviar notificação por email');
        }
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

/**
 * Registra tentativa bloqueada na tabela de auditoria.
 * Nunca lança — se a tabela não existir ou Supabase estiver fora,
 * só loga warning e segue. O bloqueio HTTP acontece de qualquer jeito.
 */
async function logBlockedContent(
  supabase: SupabaseClient,
  entry: {
    userId?: string;
    adUrl?: string | null;
    layer: 1 | 2;
    check: ContentSafetyCheck;
    copyPreview?: string;
    traceId: string;
  }
): Promise<void> {
  try {
    await supabase.from('spybot_blocked_content').insert({
      user_id: entry.userId || null,
      ad_url: entry.adUrl || null,
      layer: entry.layer,
      reason: entry.check.reason || 'unknown',
      matches: entry.check.matches,
      copy_preview: entry.copyPreview || null,
      trace_id: entry.traceId
    });
  } catch (err) {
    // Graceful: auditoria não bloqueia a response
    logger.warn(STAGES.SUPABASE_FAIL, '⚠️ Falha ao registrar auditoria de bloqueio', {
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
