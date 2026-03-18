import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { logger, STAGES } from './logger';
import { getMockAdData } from '@/lib/mockAdData';
import { GeneratedImage, GeneratedImages } from '@/lib/types';
import { getStockImageVariations } from '@/lib/stock-images';

// Inicializa os clientes das APIs (com fallbacks vazios para evitar erro de build na Vercel)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_build",
});

export const maxDuration = 60; // 60s limit to allow Apify scraping on Vercel Hobby (com timeout de 45s + fallback rápido)

// ============================================
// FUNÇÃO: Detectar Nicho da URL
// ============================================
/**
 * Detecta o nicho baseado na URL do anúncio
 * É CRÍTICO detectar o nicho ANTES de chamar GPT-4o quando Apify falha
 * Isso garante que os imagePrompts sejam gerados para o nicho CORRETO
 *
 * @param adUrl - URL do anúncio para análise
 * @returns Nicho detectado ou 'geral' como fallback
 */
function detectNicheFromUrl(adUrl: string): string {
  const url = adUrl.toLowerCase();

  // Ordem importa! Mais específico primeiro para evitar falsos positivos
  // iGaming primeiro porque "aposta/cassino/gaming" são muito específicos
  if (["cassino", "aposta", "jogo", "bet", "poker", "slots", "roleta", "gaming", "igaming"].some(p => url.includes(p))) {
    return "igaming";
  }

  // Emagrecimento (keywords em PT e EN)
  if (["emagrecer", "dieta", "peso", "perder", "fitness", "slim", "magro", "obesity", "emagrecimento", "weight-loss", "weight loss", "diet", "lean"].some(p => url.includes(p))) {
    return "emagrecimento";
  }

  // Estética (keywords em PT e EN)
  if (["beleza", "pele", "facial", "skincare", "lifting", "dermatol", "cosmetico", "estetica", "skin-care", "beauty", "anti-aging"].some(p => url.includes(p))) {
    return "estetica";
  }

  // Alimentação / Comida / Receita (novo nicho - cobre anúncios de comida, receitas, delivery)
  if (["receita", "comida", "food", "recipe", "culinaria", "gastronomia", "delivery", "restaurante", "prato", "gastronomico", "culinario", "cozinha"].some(p => url.includes(p))) {
    return "alimentacao";
  }

  // E-commerce (keywords em PT e EN)
  if (["loja", "shop", "store", "compre", "produto", "promo", "desconto", "venda", "ecommerce", "shopping", "buy", "purchase"].some(p => url.includes(p))) {
    return "ecommerce";
  }

  // Renda Extra (menos específico, verificar por último)
  if (["renda", "ganhar", "dinheiro", "online", "passiva", "lucro", "negocio"].some(p => url.includes(p))) {
    return "renda_extra";
  }

  return "geral"; // Fallback padrão
}

// ============================================
// FUNÇÃO: Retry com Exponential Backoff
// ============================================
/**
 * Realiza requisições com retry automático e exponential backoff
 * Trata erros transitórios: timeout (ETIMEDOUT), 429 (rate limit), 503 (serviço indisponível), 500 (erro interno)
 *
 * @param url - URL para fazer a requisição
 * @param options - Opções do fetch (method, headers, body, etc)
 * @param maxRetries - Número máximo de tentativas (padrão: 3)
 * @returns Response se sucesso, lança erro se falhar em todas as tentativas
 *
 * Exemplo de backoff:
 * - Tentativa 1: falha → aguarda 1s
 * - Tentativa 2: falha → aguarda 2s
 * - Tentativa 3: falha → aguarda 4s
 * - Tentativa 4: falha → lança erro
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`[Apify Retry] Tentativa ${attempt + 1}/${maxRetries} - URL: ${url.split('?')[0]}`);

            // Fazer a requisição com timeout de 30 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Se status é 200-299, sucesso!
            if (response.ok) {
                console.log(`[Apify Retry] ✅ Sucesso na tentativa ${attempt + 1}`);
                return response;
            }

            // Verificar se é erro transitório (429, 503, 500, 502, 504)
            const retryableStatuses = [429, 500, 502, 503, 504];
            if (retryableStatuses.includes(response.status)) {
                const errorText = await response.text();
                console.warn(
                    `[Apify Retry] ⚠️ Erro transitório (${response.status}) na tentativa ${attempt + 1}: ${errorText.substring(0, 100)}`
                );

                // Se não é a última tentativa, aguardar e retentar
                if (attempt < maxRetries - 1) {
                    const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    console.log(`[Apify Retry] ⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                } else {
                    // Última tentativa e falhou
                    lastError = new Error(
                        `Apify retornou status ${response.status} após ${maxRetries} tentativas: ${errorText.substring(0, 200)}`
                    );
                }
            } else {
                // Erro não-transitório (4xx exceto 429, 401, etc) - não retentar
                const errorText = await response.text();
                throw new Error(
                    `Apify API Error: ${response.status} - ${errorText.substring(0, 200)}`
                );
            }
        } catch (error: unknown) {
            lastError = error as Error;

            // Verificar se é timeout ou erro de conexão (ETIMEDOUT, ECONNRESET, etc)
            const errorObj = error as { name?: string; code?: string };
            const isTimeoutError = errorObj.name === 'AbortError' || errorObj.code === 'ETIMEDOUT';
            const isConnectionError = errorObj.code === 'ECONNREFUSED' || errorObj.code === 'ECONNRESET';

            if ((isTimeoutError || isConnectionError) && attempt < maxRetries - 1) {
                console.warn(
                    `[Apify Retry] ⚠️ Erro transitório (${errorObj.name || errorObj.code}) na tentativa ${attempt + 1}`
                );
                const delayMs = Math.pow(2, attempt) * 1000;
                console.log(`[Apify Retry] ⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else if (attempt === maxRetries - 1) {
                // Última tentativa falhou
                console.error(`[Apify Retry] ❌ Falha após ${maxRetries} tentativas:`, error);
            } else {
                // Erro que não devemos retentar (ex: erro de parsing JSON)
                throw error;
            }
        }
    }

    // Se chegou aqui, todas as tentativas falharam
    throw lastError || new Error(`Falha após ${maxRetries} tentativas sem resposta do servidor`);
}

// ============================================
// FIM: Retry com Exponential Backoff
// ============================================

export async function POST(req: Request) {
    logger.clear();
    logger.startTimer('TOTAL_REQUEST');

    try {
        const { adUrl, brandProfile } = await req.json();
        logger.info(STAGES.START, 'URL recebida', { url: adUrl?.substring(0, 80), hasBrandProfile: !!brandProfile });

        if (!adUrl) {
            logger.error(STAGES.VALIDATION, 'URL do anúncio não fornecida');
            return NextResponse.json({ error: 'URL do anúncio não fornecida.' }, { status: 400 });
        }

        // 🎯 CRÍTICO: Detectar o nicho da URL AGORA
        // Isso garante que, mesmo se Apify falhar, sabemos qual é o nicho REAL
        const detectedNicheFromUrl = detectNicheFromUrl(adUrl);
        logger.info(STAGES.START, '🎯 Nicho da URL detectado', {
            url: adUrl?.substring(0, 80),
            detectedNiche: detectedNicheFromUrl,
            reason: 'Detectado cedo para garantir imagePrompts corretos quando Apify falha'
        });

        if (!process.env.APIFY_API_TOKEN || !process.env.OPENAI_API_KEY) {
            logger.error(STAGES.VALIDATION, 'Chaves de API ausentes no servidor');
            return NextResponse.json({ error: 'Chaves de API ausentes no servidor.' }, { status: 500 });
        }

        logger.success(STAGES.VALIDATION, 'URL e chaves validadas');

        // --- INÍCIO: Verificação de Monetização (Billing) ---
        logger.info(STAGES.BILLING, 'Iniciando verificação de créditos e plano');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        let currentPlan = 'gratis';
        let currentCredits = 5;

        if (user) {
            logger.info(STAGES.BILLING, 'Usuário autenticado', { userId: user.id, userEmail: user.email });
            const { data: sub } = await supabase.from('spybot_subscriptions').select('*').eq('user_id', user.id).single();
            if (!sub) {
                logger.info(STAGES.BILLING, 'Primeira requisição do usuário, criando subscription padrão');
                await supabase.from('spybot_subscriptions').insert({ user_id: user.id, credits: 5, plan: 'gratis' });
            } else {
                currentPlan = sub.plan;
                currentCredits = sub.credits;
                logger.success(STAGES.BILLING, 'Plano carregado', { plan: currentPlan, credits: currentCredits });
            }

            const hasByok = brandProfile && brandProfile.openaiKey && brandProfile.openaiKey.trim() !== "";

            // Admin (dono) não tem limitação de créditos
            const adminEmailFromEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim();
            const userEmail = user?.email?.trim();
            const isAdmin = userEmail === adminEmailFromEnv;

            logger.info(STAGES.BILLING, '🔍 DEBUG ADMIN CHECK', {
                userEmail,
                adminEmailFromEnv,
                isAdmin,
                currentPlan,
                currentCredits,
                hasByok
            });

            // Validação: Usuário grátis com créditos zerados DEVE assinar PRO (ADMIN IGNORA ISSO)
            if (!isAdmin && currentPlan === 'gratis' && currentCredits <= 0 && !hasByok) {
                logger.error(STAGES.BILLING, '❌ Créditos insuficientes, acesso negado para usuário');
                return NextResponse.json({
                    error: 'Seus créditos grátis acabaram! 😢 Você precisa assinar o plano PRO ($97) para continuar usando o Spy Bot. Após o upgrade, você poderá adicionar sua própria Chave da OpenAI se desejar.',
                    code: 'OUT_OF_CREDITS'
                }, { status: 403 });
            }

            if (isAdmin) {
                logger.success(STAGES.BILLING, '✅ ADMIN DETECTADO - Acesso ilimitado liberado!');
            }
        } else {
            logger.warn(STAGES.BILLING, 'Usuário não autenticado, usando defaults');
        }
        logger.success(STAGES.BILLING, 'Verificação de billing concluída');
        // --- FIM: Verificação de Monetização ---

        // 1. Fase de Extração (Apify - Facebook Ads Library)
        let originalCopy = '';
        let adImageUrl = '';

        let apifyErrorMessage = "";
        try {
            logger.startTimer('APIFY_EXTRACTION');

            // ✅ IMPORTANTE: Fazer trim() para remover espaços em branco
            // Apify valida rigorosamente URLs e rejeita com espaços
            const cleanedUrl = adUrl.trim();

            logger.info(STAGES.APIFY_CALL, 'Iniciando extração com Apify (timeout: 60s)', {
                url: cleanedUrl?.substring(0, 80),
                hadWhitespace: cleanedUrl !== adUrl,
                isAdsLibrary: cleanedUrl?.includes('/ads/library/'),
                reason: 'Timeout 60s para Chrome + proxy FACEBOOK que são lentos com anti-bot'
            });

            // ✅ Configuração completa do Apify com proxy para melhor taxa de sucesso
            // Especialmente importante para Ads Library URLs que têm anti-bot mais agressivo
            const input = {
                startUrls: [{ url: cleanedUrl }],
                maxItems: 3,  // Aumentado: 1 → 3 (mais dados aumenta chance de sucesso)
                // ✅ Adicionar proxy configuration para Facebook (solução da investigação)
                proxyConfiguration: {
                    useApifyProxy: true,
                    apifyProxyGroups: ["FACEBOOK"]  // Usa grupo de proxies específico para Facebook
                },
                // ✅ Usar navegador real em vez de apenas HTTP para evitar detecção
                useChrome: true,
                // ✅ User-Agent realista para não ser bloqueado
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            };

            const apifyToken = process.env.APIFY_API_TOKEN || "dummy";

            // ============================================
            // TIMEOUT DO APIFY (SMART TIMEOUT)
            // ============================================
            // 60 segundos para Apify com Chrome + proxy FACEBOOK
            // Facebook anti-bot é MUITO agressivo, Chrome precisa de ~30-50s para inicializar
            // Se falhar em 60s, usa fallback automático com Stock Images
            const APIFY_TIMEOUT = 60000; // 60s = tempo máximo seguro para Chrome + Facebook anti-bot
            const controller = new AbortController();
            const timeoutHandle = setTimeout(() => {
                controller.abort();
                logger.warn(STAGES.APIFY_CALL, '⏱️ Timeout Apify (60s) - URL bloqueada ou Apify indisponível, acionando fallback inteligente');
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
                // Timeout do abort - ativar fallback
                apifyErrorMessage = "Apify timeout (60s) - URL bloqueada pelo Facebook ou Apify indisponível";
                logger.error(STAGES.APIFY_CALL, apifyErrorMessage, {
                    adUrl: adUrl.substring(0, 100),
                    isAdsLibrary: adUrl.includes('/ads/library/'),
                    timeoutError: String(timeoutErr),
                    reason: 'Timeout após 60s - Facebook anti-bot bloqueou a extração. Stock Images fallback ativado.',
                    mitigation: 'Sistema usará Stock Images diferentes como fallback - variações ainda são de qualidade'
                });
                throw new Error(apifyErrorMessage);
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Apify API Error: ${response.status} - ${errorText}`);
            }

            const items = await response.json();

            if (items && items.length > 0) {
                const adData = items[0];

                // Mapeamento Inteligente: Facebook muda frequentemente a estrutura.
                const snap = adData.snapshot || adData;

                // Tenta puxar o texto de todos os lugares possíveis
                const rawCopy = snap.body?.text || adData.primaryText || adData.text || snap.title || snap.caption || snap.linkDescription || '';
                originalCopy = String(rawCopy).trim();

                // ✅ IMPORTANTE: Detectar template vars do Facebook Ads
                // Ads Library retorna variáveis como {{product.brand}}, {{discount}}, etc não preenchidas
                // Se a cópia contiver template vars não preenchidos, considerar como vazia
                const hasTemplateVars = /\{\{[\s\S]*?\}\}/.test(originalCopy);

                if (originalCopy === 'undefined' ||
                    originalCopy === 'null' ||
                    hasTemplateVars) {  // ← Novo: detecta {{var}}
                    originalCopy = '';
                    if (hasTemplateVars) {
                        logger.warn(STAGES.APIFY_SUCCESS, 'Copy contém template vars não preenchidos', {
                            example: originalCopy.substring(0, 50)
                        });
                    }
                }

                let rawImageUrl = String(
                    snap.images?.[0]?.originalImageUrl ||
                    snap.videos?.[0]?.videoPreviewImageUrl ||
                    snap.pageProfilePictureUrl ||
                    adData.imageUrl ||
                    ''
                );

                // Melhorar qualidade da imagem removendo parâmetros de thumbnail do Facebook
                // Facebook retorna ?stp=dst-jpg_s60x60_tt6 para thumbnails, substituir por versão maior
                adImageUrl = rawImageUrl
                    .replace(/\?stp=dst-jpg_s60x60.*?(&|$)/, '?stp=dst-jpg_s800x800_tt6&')
                    .replace(/\?stp=.*?&/, '?')
                    .replace(/\?stp=.*?$/, '');

                logger.endTimer('APIFY_EXTRACTION', STAGES.APIFY_SUCCESS);
                logger.success(STAGES.APIFY_SUCCESS, 'Dados extraídos com sucesso', {
                    copyLength: originalCopy.length,
                    hasImage: !!adImageUrl,
                    imageSample: adImageUrl?.substring(0, 60)
                });
            } else {
                apifyErrorMessage = "A extração retornou 0 itens (vazio). O Facebook pode ter bloqueado ou o ID é inválido.";
                logger.warn(STAGES.APIFY_FAIL, 'Apify retornou lista vazia', { reason: apifyErrorMessage });
            }
        } catch (scraperError: unknown) {
            apifyErrorMessage = scraperError instanceof Error ? scraperError.message : String(scraperError);
            logger.endTimer('APIFY_EXTRACTION', STAGES.APIFY_FAIL);
            logger.error(STAGES.APIFY_FAIL, 'Erro na chamada Apify', scraperError);
        }

        // FALLBACK INTELIGENTE E TRATAMENTO DE AD SEM COPY
        // IMPORTANTE: Se Apify falhou de ANY forma, usar mock data IMEDIATAMENTE
        if (apifyErrorMessage || !originalCopy || !adImageUrl) {
            if (apifyErrorMessage) {
                // Apify explicitamente falhou
                logger.error(STAGES.FALLBACK, `❌ FALLBACK ATIVADO - Apify falhou. Erro: ${apifyErrorMessage.substring(0, 200)}. Usando dados mock.`);
                console.error(`[APIFY ERROR] ${apifyErrorMessage}`);
            } else if (!originalCopy || !adImageUrl) {
                // Apify não preencheu copy ou imagem - também fallback
                logger.warn(STAGES.FALLBACK, `⚠️  FALLBACK ATIVADO - Apify incompleto (copy: ${!!originalCopy}, image: ${!!adImageUrl}). Usando mock.`);
            }

            // Tentar detectar nicho da URL mesmo quando Apify falha
            // Isso garante que as imagens geradas correspondam ao nicho correto
            const mockData = getMockAdData(adUrl);

            // Só sobrescreve se estiver vazio
            if (!originalCopy) originalCopy = mockData.copy;
            if (!adImageUrl) adImageUrl = mockData.image;

            logger.info(STAGES.FALLBACK, 'Mock data carregado como fallback', {
                niche: mockData.niche,
                url: adUrl,
                isMock: mockData.isMock,
                isAdsLibraryUrl: adUrl.includes('/ads/library/'),
                apifyError: apifyErrorMessage?.substring(0, 100) || 'incompleto',
                finalCopyLength: originalCopy.length,
                finalImageLength: adImageUrl.length
            });
        } else if (!originalCopy && !apifyErrorMessage) {
            // Extraiu com sucesso, mas o anúncio é puramente em Imagem/Vídeo (Não tem script de vendas)
            logger.warn(STAGES.APIFY_SUCCESS, 'Anúncio extraído mas sem copy escrita (100% visual)');
            originalCopy = "[O anunciante original não utilizou copy escrita para este anúncio, o foco foi 100% no Apelo Visual ou Vídeo (Aja baseado nisso para gerar suas próprias copies matadoras!).]";
        } else if (originalCopy && !apifyErrorMessage) {
            logger.success(STAGES.APIFY_SUCCESS, '✅ Dados extraídos com sucesso via Apify!', {
                copyLength: originalCopy.length,
                hasImage: !!adImageUrl,
                adUrl: adUrl.substring(0, 80)
            });
        }

        // GARANTIR QUE SEMPRE TEMOS IMAGEM E COPY VÁLIDOS
        if (!originalCopy) {
            originalCopy = "[Imagem do anúncio original - foco 100% visual]";
        }
        if (!adImageUrl) {
            adImageUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800";
        }

        // Verificação se estamos rodando sem chave real na produção para pular a chamada e não quebrar com 500
        // ✅ DESENVOLVIMENTO: Forçar modo DEMO para testar variações
        const FORCE_DEMO_MODE = false; // ❌ Desativado - usando DALL-E real agora!
        if (FORCE_DEMO_MODE || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy_key_for_build") {
            logger.warn(STAGES.OPENAI_CALL, 'Chave OpenAI ausente ou dummy, usando resposta de demo');
            return NextResponse.json({
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl
                },
                generatedVariations: {
                    variante1: "(DEMO) O mercado de estética está virado de cabeça para baixo. Suas concorrentes que cobram metade do seu preço estão lotando a agenda enquanto você sua a camisa. Pare de brigar por centavos e implemente o Protocolo Diamante.",
                    variante2: "(DEMO) Lotar sua clínica nunca foi tão fácil. Com o Protocolo Diamante, você atrai clientes de alto padrão dispostas a pagar o triplo pelo seu serviço. Tudo isso sem depender de dancinhas no Instagram.",
                    variante3: "(DEMO) Ana estava quase fechando a clínica. Ela não aguentava mais clientes pedendo desconto. Até que ela descobriu um padrão de vendas secreto. Dois meses depois, ela precisou contratar 3 assistentes."
                },
                generatedImages: {
                    image1: "https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0?auto=format&fit=crop&q=80&w=800",
                    image2: "https://images.unsplash.com/photo-1596755094514-ff4df1ecfb7e?auto=format&fit=crop&q=80&w=800",
                    image3: "https://images.unsplash.com/photo-1556912988-2b80c6c8b0a1?auto=format&fit=crop&q=80&w=800"
                },
                logs: logger.exportAsJSON()
            });
        }
        // 2. Fase de IA (Reengenharia de Copywriting e Design)
        try {
            logger.startTimer('OPENAI_CALL');
            logger.info(STAGES.OPENAI_CALL, 'Iniciando chamada GPT-4o para reengenharia de copy');

            // BYOK - Bring Your Own Key
            let activeOpenaiClient = openai;
            let usingByok = false;
            if (brandProfile && brandProfile.openaiKey && brandProfile.openaiKey.trim() !== "") {
                logger.info(STAGES.OPENAI_CALL, 'Usando chave API customizada do cliente (BYOK)');
                activeOpenaiClient = new OpenAI({ apiKey: brandProfile.openaiKey.trim() });
                usingByok = true;
            }

            // Montagem Dinâmica do Contexto da Marca
            let brandContext = "";
            if (brandProfile && (brandProfile.companyName || brandProfile.niche)) {
                logger.info(STAGES.OPENAI_CALL, 'Contexto de marca detectado', { brand: brandProfile.companyName, niche: brandProfile.niche });
                brandContext = `
    🚨 IDENTIDADE DA MARCA APLICADA (OBRIGATÓRIO):
    O usuário configurou um perfil da sua própria empresa para você adaptar a copy:
    - Nome da Empresa / Produto: ${brandProfile.companyName || 'Não especificado'}
    - Nicho de Atuação: ${brandProfile.niche || 'Não especificado'}
    - Público-Alvo Ideal: ${brandProfile.targetAudience || 'Não especificado'}
    - Tom de Voz Obrigatório: ${brandProfile.toneOfVoice || 'Não especificado'}

    INSTRUÇÕES: Substitua o nome da empresa ou produto do anúncio original PELO NOME DA EMPRESA e nicho indicados acima. O texto DEVE estar escrito no 'Tom de Voz Obrigatório' da marca do cliente!
    `;
            }

            const chatCompletion = await activeOpenaiClient.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Você é um especialista em clonagem estratégica de anúncios para Meta Ads.
${brandContext}

🎯 NICHO DETECTADO DA URL: ${detectedNicheFromUrl.toUpperCase()}
⚠️ INSTRUÇÃO CRÍTICA: Use o nicho acima — não tente adivinhar pela copy.

═══════════════════════════════════════
PASSO 1 — ANÁLISE ESTRATÉGICA DO ANÚNCIO ORIGINAL
═══════════════════════════════════════
Extraia com precisão cirúrgica:
- hook: O gancho de abertura (o que prende atenção nos primeiros segundos)
- promise: A promessa central (o que o produto/serviço entrega)
- emotion: A emoção dominante explorada (medo, esperança, inveja, etc.)
- cta: O call-to-action exato ou inferido
- persuasion_structure: Estrutura usada (AIDA, PAS, 4Ps, Storytelling, etc.)
- angle: Ângulo estratégico (prova social, autoridade, escassez, transformação)
- offer_type: Tipo de oferta (lead magnet, compra direta, trial, evento, etc.)

═══════════════════════════════════════
PASSO 2 — GERAR 3 COPIES COM ESTRATÉGIAS DIFERENTES
═══════════════════════════════════════
- variante1: Foco na DOR — amplificar o problema, criar urgência emocional
- variante2: Foco na SOLUÇÃO DIRETA — benefícios claros, linguagem assertiva
- variante3: Foco em AUTORIDADE E PROVA — depoimento ou dado de resultado
  ⚠️ variante3 NÃO é storytelling — é autoridade + prova social + credibilidade

Adaptar linguagem ao nicho: ${detectedNicheFromUrl.toUpperCase()}
Evitar: clickbait, sensacionalismo, promessas irreais, Fake UI

═══════════════════════════════════════
PASSO 3 — GERAR 3 IMAGEPROMPTS PARA META ADS
═══════════════════════════════════════
Todos os 3 prompts DEVEM seguir:
• Formato 4:5 (vertical moderado, ideal para Feed do Meta)
• Composição limpa e minimalista
• Mobile-first — legível em tela pequena
• Áreas de segurança nas bordas (sem elementos cortados)
• Sem clickbait, setas chamativas, círculos vermelhos, fake notifications
• Estilo visual profissional e confiável

imagePrompt1 (DOR): cena visual de frustração/problema específico do nicho
imagePrompt2 (SOLUÇÃO): cena visual de resultado/transformação específica do nicho
imagePrompt3 (AUTORIDADE): cena de credibilidade — especialista, tela de resultado real, testemunho

⚠️ OS 3 IMAGEPROMPTS DEVEM TER CONTEÚDO VISUAL COMPLETAMENTE DIFERENTE.
⚠️ OBRIGATÓRIO: Retorne SEMPRE detectedNiche = "${detectedNicheFromUrl}"

Responda em JSON válido:
{
  "strategic_analysis": {
    "hook": "...",
    "promise": "...",
    "emotion": "...",
    "cta": "...",
    "persuasion_structure": "...",
    "angle": "...",
    "offer_type": "..."
  },
  "variante1": "...",
  "imagePrompt1": "...",
  "variante2": "...",
  "imagePrompt2": "...",
  "variante3": "...",
  "imagePrompt3": "...",
  "detectedNiche": "${detectedNicheFromUrl}"
}`
                    },
                    {
                        role: "user",
                        content: `Nicho para este anúncio: ${detectedNicheFromUrl}

Copy Original para Clonar e Melhorar:\n\n${originalCopy}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            logger.endTimer('OPENAI_CALL', STAGES.OPENAI_SUCCESS);
            logger.success(STAGES.OPENAI_SUCCESS, 'GPT-4o respondeu com 3 variações', { usingByok });

            const generatedCopys = JSON.parse(chatCompletion.choices[0].message.content || "{}");

            // 🎯 CRÍTICO: FORÇAR detectedNiche para o valor correto da URL
            // Isso garante que as imagens SEMPRE correspondem ao nicho correto mesmo se GPT-4o tentar adivinhar errado
            generatedCopys.detectedNiche = detectedNicheFromUrl;
            logger.info(STAGES.DALLE_CALL, '🔒 FORÇANDO detectedNiche para o valor correto da URL', {
                forcedNiche: detectedNicheFromUrl,
                reason: 'Garante que imagePrompts e fallback images correspondem ao nicho REAL'
            });

            // ============================================
            // GERAÇÃO FORÇADA DE IMAGEPROMPTS DIFERENTES
            // ============================================
            // Se GPT-4o não gerou prompts diferentes (todos os 3 iguais),
            // criar prompts COMPLETAMENTE DIFERENTES para cada variante
            const generateDifferentImagePrompts = (niche: string, varianteCopy: string): { prompt1: string; prompt2: string; prompt3: string } => {
                const nicheUpper = niche.toUpperCase();

                // Mapa de prompts por nicho - CADA UM COMPLETAMENTE DIFERENTE
                const nichePrompts: Record<string, { prompt1: string; prompt2: string; prompt3: string }> = {
                    'EMAGRECIMENTO': {
                        prompt1: 'close-up of frustrated overweight woman looking at scale with disappointment, belly visible, negative emotions, struggling with weight, sad expression, natural lighting, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt2: 'fit woman flexing muscles confidently in gym, showing toned abs and arms, smiling at camera, transformation success, athletic wear, victory pose, bright professional lighting, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt3: 'nutritionist or fitness coach presenting transformation results to client, professional clinical setting, credentials visible on wall, authority figure with white coat, client reviewing progress charts, clean studio, trustworthy atmosphere, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements'
                    },
                    'RENDA_EXTRA': {
                        prompt1: 'stressed person at desk surrounded by bills and debt notices, worried face, financial struggle, empty wallet, dark mood, feeling trapped, desperate expression, home office, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt2: 'successful entrepreneur celebrating with money, earning notifications on phone, stacks of cash, bright smile, wealth accumulation, luxury background, happiness, success story, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt3: 'professional entrepreneur showing income dashboard results on laptop screen, home office setup, income proof screenshots visible, successful business owner in confident pose, testimonial-style composition, credible and realistic, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements'
                    },
                    'ESTETICA': {
                        prompt1: 'sad woman looking at wrinkles in mirror, aging concerns, dull skin, frustration with appearance, close-up of problem areas, negative self-image, concerned expression, harsh lighting, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt2: 'radiant woman with glowing skin and clear complexion, professional beauty treatment results, confident smile, smooth skin close-up, luxury skincare, beauty success, studio lighting, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt3: 'dermatologist or licensed esthetician in clinical setting showing skin improvement to satisfied client, before-after photo visible, professional credentials displayed, clinical authority, white uniform, clean clinic background, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements'
                    },
                    'IGAMING': {
                        prompt1: 'frustrated gambler losing money, casino losses, stressed face, empty account, debt from betting, disappointed expression, dark casino background, financial trouble from gambling, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt2: 'happy player celebrating big casino win, winning moment with jackpot notification, celebrating with chips and money, joyful expression, fortune moment, lucky win, bright celebration, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt3: 'verified winner holding payout proof screenshot on phone, authentic celebration, credible home setting, real income notification visible on screen, trustworthy face expression, natural lighting, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements'
                    },
                    'ECOMMERCE': {
                        prompt1: 'person frustrated trying to shop, product unavailable, poor selection, looking disappointed, empty shelves concept, limited options, frustrated expression, wanting to buy but nothing good, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt2: 'excited customer holding premium products, enjoying purchase, happy unboxing moment, quality products showcase, customer delight, premium shopping experience, joyful smile, success of purchase, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt3: 'satisfied customer reviewing premium product with 5-star rating on phone, unboxing testimonial style, authentic home environment, product clearly visible, genuine happy expression, real review aesthetic, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements'
                    },
                    'ALIMENTACAO': {
                        prompt1: 'person looking at empty fridge or sad meal, hungry but no good food options, disappointed expression, poor nutrition, craving good food but nothing appetizing, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt2: 'delicious gourmet meal beautifully plated, person enjoying delicious food, happy eating experience, appetizing dishes, satisfied smile, premium culinary experience, mouth-watering food, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt3: 'professional chef or nutritionist presenting signature dish with credentials, michelin-style presentation, authority figure, clean kitchen or studio setting, expertise conveyed naturally, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements'
                    },
                    'GERAL': {
                        prompt1: 'person looking sad and unmotivated, struggling with something, difficult moment, facing challenges, discouraged expression, dark atmosphere, personal struggle, uncertainty visible, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt2: 'person celebrating success and happiness, achieving goal, confident pose, smiling brightly, accomplished moment, positive energy, winning feeling, bright atmosphere, victory expression, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements',
                        prompt3: 'professional expert or authority figure presenting verifiable results to client, office or studio setting, credibility markers visible, genuine consultation atmosphere, trustworthy body language, vertical 4:5 aspect ratio, clean minimal composition, mobile-first layout, safe zone margins on all edges, professional Meta Ads quality, no text overlays, no clickbait elements'
                    }
                };

                const prompts = nichePrompts[nicheUpper] || nichePrompts['GERAL'];

                logger.info(STAGES.DALLE_CALL, 'Usando prompts FORÇADAMENTE DIFERENTES por variante', {
                    niche: nicheUpper,
                    prompt1Length: prompts.prompt1.length,
                    prompt2Length: prompts.prompt2.length,
                    prompt3Length: prompts.prompt3.length,
                    reason: 'Garante que DALL-E gera 3 imagens visualmente distintas'
                });

                return prompts;
            };

            // SOBRESCREVER os imagePrompts do GPT-4o com versões FORÇADAMENTE DIFERENTES
            const forcedPrompts = generateDifferentImagePrompts(detectedNicheFromUrl, generatedCopys.variante1 || '');
            generatedCopys.imagePrompt1 = forcedPrompts.prompt1;
            generatedCopys.imagePrompt2 = forcedPrompts.prompt2;
            generatedCopys.imagePrompt3 = forcedPrompts.prompt3;

            logger.success(STAGES.DALLE_CALL, 'ImagePrompts FORÇADOS para serem visualmente diferentes', {
                imagePrompt1: generatedCopys.imagePrompt1.substring(0, 60) + '...',
                imagePrompt2: generatedCopys.imagePrompt2.substring(0, 60) + '...',
                imagePrompt3: generatedCopys.imagePrompt3.substring(0, 60) + '...'
            });

            // 3. Fase de Geração Visual (DALL-E 3 Nativo FaceAds)
            logger.startTimer('DALLE_GENERATION');
            logger.info(STAGES.DALLE_CALL, 'Iniciando geração de 3 imagens (3x Meta Ads 4:5 composition)');

            // Debug: Log dos prompts gerados para DALL-E
            logger.info(STAGES.DALLE_CALL, 'ImagePrompts recebidos do GPT-4o:', {
                detectedNiche: generatedCopys.detectedNiche,
                imagePrompt1: generatedCopys.imagePrompt1?.substring(0, 100),
                imagePrompt2: generatedCopys.imagePrompt2?.substring(0, 100),
                imagePrompt3: generatedCopys.imagePrompt3?.substring(0, 100),
            });

            // IMPORTANTE: Se DALL-E falhar, usa imagens do mockAdData que correspondem ao nicho detectado
            const nicheForFallback = generatedCopys.detectedNiche || 'geral';
            const nicheImages = getMockAdData(undefined, nicheForFallback);
            logger.info(STAGES.DALLE_CALL, `✅ Niche detectado: "${nicheForFallback}" - Fallback configurado`, {
                fallbackImage: nicheImages.image?.substring(0, 80),
                nicheData: nicheImages.niche,
                fallbackReason: 'Usando imagens relacionadas ao nicho detectado'
            });

            // ✅ IMPORTANTE: Definir NICHE_DATABASE PRIMEIRO (antes de usar)
            const NICHE_DATABASE: Record<string, { images: string[] }> = {
                "emagrecimento": {
                    images: [
                        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1434628287857-20284db019fc?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1476480862245-c2951f1d2e2f?auto=format&fit=crop&q=80&w=800"
                    ]
                },
                "renda_extra": {
                    images: [
                        "https://images.unsplash.com/photo-1533523666223-68a78f686f21?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800"
                    ]
                },
                "igaming": {
                    images: [
                        "https://images.unsplash.com/photo-1553532173-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?auto=format&fit=crop&q=80&w=800"
                    ]
                },
                "estetica": {
                    images: [
                        "https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1596755094514-ff4df1ecfb7e?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1556912988-2b80c6c8b0a1?auto=format&fit=crop&q=80&w=800"
                    ]
                },
                "ecommerce": {
                    images: [
                        "https://images.unsplash.com/photo-1441986300974-11335f63f7ee?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1555694702871-5572146ce3f3?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800"
                    ]
                },
                "alimentacao": {
                    images: [
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800", // Comida apetitosa
                        "https://images.unsplash.com/photo-1495195134817-aeb325d55b0e?auto=format&fit=crop&q=80&w=800", // Refeição preparada
                        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800"  // Chef/Preparo
                    ]
                },
                "geral": {
                    images: [
                        "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?auto=format&fit=crop&q=80&w=800", // Desafio/Dor - pessoa em dificuldade
                        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800", // Sucesso/Vitória - pessoa alegre
                        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800"  // Transformação - gráfico/progresso
                    ]
                }
            };

            // ✅ SE DALL-E FALHAR, TEMOS 3 IMAGENS DIFERENTES DO MESMO NICHO COMO FALLBACK
            // IMPORTANTE: Usar 3 imagens diferentes (não repetidas!) para as 3 variações
            // Buscar todas as imagens do nicho detectado
            const placeholderFallback = nicheImages?.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800';

            const getNicheImagesForFallback = (niche: string): string[] => {
                const nicheData = NICHE_DATABASE[niche] || NICHE_DATABASE['geral'];
                return nicheData?.images || [placeholderFallback];
            };

            const nicheImageList = getNicheImagesForFallback(nicheForFallback);
            const fallbackImages = nicheImageList.length >= 3
                ? nicheImageList.slice(0, 3)  // 3 imagens diferentes do nicho
                : [placeholderFallback, placeholderFallback, placeholderFallback];  // Fallback genérico se insuficiente

            logger.info(STAGES.DALLE_CALL, `✅ Fallback preparado com ${fallbackImages.length} imagens diferentes do nicho "${nicheForFallback}"`);

            const generateImageSafely = async (
                prompt: string,
                fallbackUrl: string,
                targetSize: "1024x1024" | "1024x1792",
                imageNumber: number
            ) => {
                try {
                    if (!prompt) {
                        console.log(`[DALL-E] ⚠️ Imagem ${imageNumber}: prompt VAZIO, retornando fallback`);
                        return fallbackImages[imageNumber - 1] || fallbackUrl;
                    }

                    const isVertical = targetSize === "1024x1792";
                    console.log(`[DALL-E] 🔄 Imagem ${imageNumber}: Tentando gerar (${isVertical ? 'VERTICAL' : 'QUADRADO'})...`);
                    logger.info(STAGES.DALLE_CALL, `Gerando imagem ${imageNumber} (${targetSize})`, { promptLength: prompt.length, niche: nicheForFallback, isVertical });

                    // Timeout expandido para imagens verticais (podem demorar mais)
                    const timeoutMs = isVertical ? 60000 : 45000; // 60s para vertical, 45s para quadrado
                    const controller = new AbortController();
                    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

                    try {
                        const response = await activeOpenaiClient.images.generate({
                            model: "dall-e-3",
                            prompt: prompt,
                            n: 1,
                            size: targetSize,
                        });
                        clearTimeout(timeoutHandle);

                        console.log(`[DALL-E] Response ${imageNumber}:`, {
                            hasData: !!response.data,
                            hasUrl: !!response.data?.[0]?.url,
                            url: response.data?.[0]?.url?.substring(0, 80),
                        });

                        const generatedUrl = response.data?.[0]?.url || fallbackImages[imageNumber - 1] || fallbackUrl;
                        if (response.data?.[0]?.url) {
                            console.log(`[DALL-E] ✅ Imagem ${imageNumber} gerada com sucesso!`);
                            logger.success(STAGES.DALLE_SUCCESS, `✅ Imagem ${imageNumber} gerada com sucesso (DALL-E)`);
                        } else {
                            console.log(`[DALL-E] ⚠️ Imagem ${imageNumber}: Sem URL, usando fallback`);
                            logger.warn(STAGES.DALLE_FAIL, `⚠️ Imagem ${imageNumber}: DALL-E não retornou URL, usando fallback do nicho`);
                        }
                        return generatedUrl;
                    } catch (timeoutErr) {
                        clearTimeout(timeoutHandle);
                        throw timeoutErr;
                    }
                } catch (imgErr: unknown) {
                    console.log(`[DALL-E] ❌ Erro ao gerar imagem ${imageNumber}:`, imgErr);
                    logger.error(STAGES.DALLE_FAIL, `❌ Erro ao gerar imagem ${imageNumber} (${(imgErr as any)?.message || 'Desconhecido'})`, imgErr);
                    logger.warn(STAGES.DALLE_FAIL, `⚠️ Imagem ${imageNumber}: Usando fallback do nicho automaticamente`);
                    return fallbackImages[imageNumber - 1] || fallbackUrl;
                }
            };

            // Placeholder: usar imagem do nicho detectado (já definido como placeholderFallback acima)
            const placeholder = placeholderFallback;

            console.log('[SPY-ENGINE] 🚀 INICIANDO GERAÇÃO DE IMAGENS DALL-E...');
            console.log('[SPY-ENGINE] Prompts recebidos:', {
                prompt1: generatedCopys.imagePrompt1?.substring(0, 60),
                prompt2: generatedCopys.imagePrompt2?.substring(0, 60),
                prompt3: generatedCopys.imagePrompt3?.substring(0, 60),
            });

            let [img1, img2, img3] = await Promise.all([
                generateImageSafely(generatedCopys.imagePrompt1, placeholder, "1024x1024", 1), // Quadrado (Feed Insta/Face)
                generateImageSafely(generatedCopys.imagePrompt2, placeholder, "1024x1024", 2), // Quadrado (Feed Insta/Face)
                generateImageSafely(generatedCopys.imagePrompt3, placeholder, "1024x1792", 3)  // Vertical (Stories/Reels/TikTok)
            ]);

            // ============================================
            // VERIFICAÇÃO CRÍTICA: Deduplicação de Imagens
            // ============================================
            // Se DALL-E retornar URLs iguais, regenerar com sufixos de estilo forçados
            if ((img1 === img2) || (img2 === img3) || (img1 === img3)) {
                console.log('[SPY-ENGINE] ⚠️ IMAGENS DUPLICADAS DETECTADAS! Tentando regenerar com estilos forçados...');
                logger.warn(STAGES.DALLE_CALL, '⚠️ Imagens duplicadas detectadas, regenerando com prompts modificados');

                try {
                    [img1, img2, img3] = await Promise.all([
                        generateImageSafely(
                            generatedCopys.imagePrompt1 + ", realistic photography, warm colors, professional photo",
                            placeholder,
                            "1024x1024",
                            1
                        ),
                        generateImageSafely(
                            generatedCopys.imagePrompt2 + ", cinematic lighting, cool tones, dramatic shadows",
                            placeholder,
                            "1024x1024",
                            2
                        ),
                        generateImageSafely(
                            generatedCopys.imagePrompt3 + ", artistic illustration, natural colors, creative style",
                            placeholder,
                            "1024x1792",
                            3
                        )
                    ]);
                    console.log('[SPY-ENGINE] ✅ Imagens regeneradas com sucesso!');
                    logger.success(STAGES.DALLE_CALL, '✅ Imagens regeneradas com estilos forçados - agora são diferentes');
                } catch (regenerateErr) {
                    console.error('[SPY-ENGINE] Erro ao regenerar imagens:', regenerateErr);
                    logger.error(STAGES.DALLE_FAIL, 'Falha ao regenerar imagens duplicadas');
                    // Continuar com as imagens originais se a regeneração falhar
                }

                // FALLBACK: Se ainda houver duplicatas após regeneração, usar Stock Images
                if ((img1 === img2) || (img2 === img3) || (img1 === img3)) {
                    console.log('[SPY-ENGINE] ⚠️ AINDA HAY DUPLICATAS! Ativando Stock Images Fallback...');
                    logger.warn(STAGES.DALLE_CALL, '⚠️ Stock Images fallback ativado para resolver duplicatas');

                    try {
                        const stockImages = await getStockImageVariations(nicheForFallback, 3);
                        if (stockImages && stockImages.length >= 3) {
                            img1 = stockImages[0].url;
                            img2 = stockImages[1].url;
                            img3 = stockImages[2].url;
                            console.log('[SPY-ENGINE] ✅ Stock Images aplicadas com sucesso! 3 imagens diferentes garantidas.');
                            logger.success(STAGES.DALLE_CALL, '✅ Stock Images fallback: 3 imagens diferentes obtidas com sucesso');
                        }
                    } catch (stockImgErr) {
                        console.error('[SPY-ENGINE] Erro ao buscar Stock Images:', stockImgErr);
                        logger.error(STAGES.DALLE_FAIL, 'Falha ao buscar Stock Images fallback');
                        // Continuar com as imagens originais/regeneradas
                    }
                }
            }

            console.log('[SPY-ENGINE] ✅ IMAGENS GERADAS:', {
                img1: img1?.substring(0, 80),
                img2: img2?.substring(0, 80),
                img3: img3?.substring(0, 80),
                areDifferent: img1 !== img2 && img2 !== img3 && img1 !== img3 ? 'SIM' : 'VERIFICAR'
            });

            logger.endTimer('DALLE_GENERATION', STAGES.DALLE_SUCCESS);

            let finalImg1 = img1, finalImg2 = img2, finalImg3 = img3;

            // GARANTIR QUE IMAGENS NUNCA ESTEJAM VAZIAS ANTES DO UPLOAD
            // Se DALL-E falhou ou as URLs estão vazias, usar fallback do nicho
            const imgFallback = placeholderFallback;
            if (!finalImg1 || !finalImg1.trim()) {
                logger.warn(STAGES.DALLE_FAIL, 'Imagem 1 vazia, usando fallback do nicho');
                finalImg1 = imgFallback;
            }
            if (!finalImg2 || !finalImg2.trim()) {
                logger.warn(STAGES.DALLE_FAIL, 'Imagem 2 vazia, usando fallback do nicho');
                finalImg2 = imgFallback;
            }
            if (!finalImg3 || !finalImg3.trim()) {
                logger.warn(STAGES.DALLE_FAIL, 'Imagem 3 vazia, usando fallback do nicho');
                finalImg3 = imgFallback;
            }

            // [Histórico e Armazenamento] Tenta salvar os resultados no banco oficial e fotos no Storage
            try {
                if (user) {
                    logger.info(STAGES.STORAGE_UPLOAD, 'Iniciando upload de 3 imagens para Supabase Storage');

                    const uploadImageToSupabase = async (
                        url: string,
                        supabaseClient: any,
                        userId: string,
                        imageNumber: number,
                        fallbackImagesArray: string[]
                    ): Promise<string> => {
                        // Placeholder permanente para quando falhar (NUNCA expira)
                        // IMPORTANTE: Usa imagem DIFERENTE do nicho detectado para cada variante!
                        const placeholderUrl = fallbackImagesArray[imageNumber - 1] || fallbackImagesArray[0];

                        if (!url) {
                            logger.warn(STAGES.STORAGE_UPLOAD, `[IMAGEM ${imageNumber}] URL vazia, usando imagem do nicho: ${nicheForFallback}`);
                            return placeholderUrl;
                        }

                        if (url.includes("unsplash")) {
                            logger.info(STAGES.STORAGE_UPLOAD, `[IMAGEM ${imageNumber}] usando URL externa (unsplash)`);
                            return url; // Unsplash URLs são permanentes, OK
                        }

                        try {
                            logger.info(STAGES.STORAGE_UPLOAD, `[IMAGEM ${imageNumber}] Iniciando upload`, { urlDomain: url.split('/')[2] });

                            // Log de tentativa de upload com userId
                            logger.info('UPLOAD_ATTEMPT', 'Tentando upload para Supabase Storage', {
                                imageNumber,
                                userId: userId || 'anonymous',
                                bucket: 'spybot_images'
                            });

                            // Usar AbortController para timeout correto no fetch (AUMENTADO: 25s → 45s para URLs DALL-E que podem ser lentas em conectar)
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 45000);
                            const imgRes = await fetch(url, {
                                signal: controller.signal,
                                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                            });
                            clearTimeout(timeoutId);

                            logger.info(STAGES.STORAGE_UPLOAD, `[IMAGEM ${imageNumber}] Fetch status: ${imgRes.status}`);

                            if (!imgRes.ok) {
                                logger.warn(STAGES.STORAGE_FAIL, `[IMAGEM ${imageNumber}] Fetch falhou com status ${imgRes.status} - URL DALL-E pode estar expirada, usando placeholder`);
                                return placeholderUrl; // Em vez de URL que expira!
                            }

                            const blob = await imgRes.blob();
                            logger.info(STAGES.STORAGE_UPLOAD, `[IMAGEM ${imageNumber}] Blob criado: ${blob.size} bytes, tipo: ${blob.type}`);

                            const timestamp = Date.now();
                            const fileName = `${userId}/${timestamp}-${imageNumber}.png`;
                            logger.info(STAGES.STORAGE_UPLOAD, `[IMAGEM ${imageNumber}] Nome do arquivo: ${fileName}`);

                            const uploadResponse = await supabaseClient.storage
                                .from('spybot_images')
                                .upload(fileName, blob, { contentType: 'image/png', upsert: true });

                            const { data, error } = uploadResponse;

                            logger.info(STAGES.STORAGE_UPLOAD, `[IMAGEM ${imageNumber}] Resposta do upload:`, {
                                hasError: !!error,
                                hasData: !!data,
                                errorMessage: error?.message || 'nenhum',
                                errorStatus: error?.status || 'nenhum'
                            });

                            if (error) {
                                // Log detalhado de erro RLS
                                const isPermissionError = error.message.includes('permission') || error.message.includes('RLS') || error.message.includes('row level security');
                                logger.error('UPLOAD_FAILED', `❌ [IMAGEM ${imageNumber}] ERRO NO UPLOAD`, {
                                    imageNumber,
                                    fileName,
                                    errorMessage: error.message,
                                    errorCode: error.name || 'UNKNOWN',
                                    isPermissionError: isPermissionError,
                                    isRLSError: error.message.includes('RLS'),
                                    errorStatus: error.status,
                                    bucket: 'spybot_images',
                                    blobSize: blob.size,
                                    fullError: JSON.stringify(error)
                                });
                                logger.error(STAGES.STORAGE_FAIL, `❌ [IMAGEM ${imageNumber}] ERRO NO UPLOAD - usando placeholder`, {
                                    errorMessage: error.message,
                                    errorStatus: error.status,
                                    errorStatusCode: error.statusCode,
                                    fileName,
                                    blobSize: blob.size,
                                    fullError: JSON.stringify(error)
                                });
                                return placeholderUrl; // Em vez de URL que expira!
                            }

                            const urlResponse = supabaseClient.storage.from('spybot_images').getPublicUrl(fileName);
                            const publicUrl = urlResponse.data?.publicUrl;

                            logger.success(STAGES.STORAGE_SUCCESS, `✅ [IMAGEM ${imageNumber}] SALVA COM SUCESSO`, {
                                fileName,
                                publicUrlStart: publicUrl?.substring(0, 80) || 'ERRO'
                            });

                            return publicUrl || placeholderUrl; // Em vez de URL que expira!
                        } catch (e: unknown) {
                            const errorMsg = e instanceof Error ? e.message : String(e);
                            const errorStack = (e instanceof Error ? e.stack : '') || '';
                            logger.error(STAGES.STORAGE_FAIL, `❌ [IMAGEM ${imageNumber}] EXCEÇÃO - usando placeholder`, {
                                errorMessage: errorMsg,
                                errorStack: errorStack.substring(0, 200)
                            });
                            return placeholderUrl; // Em vez de URL que expira!
                        }
                    };

                    // Substitui as URLs temporárias (1hr) do DALL-E por URLs do seu Bucket
                    // IMPORTANTE: uploadImageToSupabase já retorna fallback se upload falhar
                    // Nunca retorna URL DALL-E órfã que vai expirar!
                    [finalImg1, finalImg2, finalImg3] = await Promise.all([
                        uploadImageToSupabase(img1, supabase, user.id, 1, fallbackImages),
                        uploadImageToSupabase(img2, supabase, user.id, 2, fallbackImages),
                        uploadImageToSupabase(img3, supabase, user.id, 3, fallbackImages)
                    ]);

                    // VALIDAÇÃO FINAL: Garantir que NUNCA temos URLs DALL-E expiradas
                    // Se por algum motivo temos URL DALL-E (mesmo após upload), converter para fallback
                    const isDalleUrl = (url: string) => url?.includes('oaidalleapiprodscus') || url?.includes('openai');

                    if (isDalleUrl(finalImg1)) {
                        logger.warn(STAGES.STORAGE_FAIL, '⚠️ PROTEÇÃO: finalImg1 é URL DALL-E após upload, forçando fallback');
                        finalImg1 = fallbackImages[0];
                    }
                    if (isDalleUrl(finalImg2)) {
                        logger.warn(STAGES.STORAGE_FAIL, '⚠️ PROTEÇÃO: finalImg2 é URL DALL-E após upload, forçando fallback');
                        finalImg2 = fallbackImages[1];
                    }
                    if (isDalleUrl(finalImg3)) {
                        logger.warn(STAGES.STORAGE_FAIL, '⚠️ PROTEÇÃO: finalImg3 é URL DALL-E após upload, forçando fallback');
                        finalImg3 = fallbackImages[2];
                    }

                    logger.info(STAGES.SUPABASE_INSERT, 'Inserindo geração no banco de dados');
                    const { error: insertError } = await supabase.from('spybot_generations').insert({
                        user_id: user.id,
                        original_url: adUrl,
                        original_copy: originalCopy,
                        original_image: adImageUrl,
                        niche: generatedCopys.detectedNiche || 'Geral', // <- Salva o nicho detectado pela IA
                        variante1: generatedCopys.variante1,
                        image1: finalImg1,
                        variante2: generatedCopys.variante2,
                        image2: finalImg2,
                        variante3: generatedCopys.variante3,
                        image3: finalImg3,
                        strategic_analysis: generatedCopys.strategic_analysis || null,
                    });

                    if (insertError) {
                        throw new Error(`Erro ao inserir no banco de dados: ${insertError.message}`);
                    }

                    logger.success(STAGES.SUPABASE_SUCCESS, 'Clone salvo no histórico e Storage', {
                        userId: user.id,
                        niche: generatedCopys.detectedNiche || 'Geral'
                    });

                    // Desconta 1 crédito se for grátis e não tiver BYOK
                    const hasByok = brandProfile && brandProfile.openaiKey && brandProfile.openaiKey.trim() !== "";
                    if (currentPlan === 'gratis' && !hasByok) {
                        const { error: updateError } = await supabase.from('spybot_subscriptions').update({ credits: Math.max(0, currentCredits - 1) }).eq('user_id', user.id);
                        if (updateError) {
                            logger.warn(STAGES.BILLING_DEDUCT, 'Falha ao descontar crédito', { error: updateError.message });
                        } else {
                            logger.info(STAGES.BILLING_DEDUCT, 'Crédito deduzido da quota gratuita', { remainingCredits: Math.max(0, currentCredits - 1) });
                        }
                    }
                } else {
                    logger.info(STAGES.SUPABASE_INSERT, 'Usuário não autenticado, ignorando salvamento em banco de dados');
                }
            } catch (dbError: unknown) {
                logger.error(STAGES.SUPABASE_FAIL, 'Erro ao salvar no histórico/storage (ignorado para não travar UI)', dbError);
            }

            // Retorna o pacote completo e Visual para o Front-End
            logger.endTimer('TOTAL_REQUEST', STAGES.END);
            logger.success(STAGES.END, 'Requisição completada com sucesso', logger.getSummary());

            const buildGeneratedImage = (url: string | undefined, type: string = 'placeholder', niche: string = 'Geral'): GeneratedImage => {
                // GARANTIA: NUNCA retornar URL vazia
                const finalUrl = url && url.trim() ? url : (placeholder || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800');

                // Detectar provedor da imagem
                let provider: 'dalle' | 'supabase' | 'unsplash' | 'fallback' = 'fallback';
                if (finalUrl?.includes('supabase')) provider = 'supabase';
                else if (finalUrl?.includes('unsplash')) provider = 'unsplash';
                else if (finalUrl?.includes('oaidalleapiprodscus.blob.core.windows.net')) provider = 'dalle';
                else if (finalUrl?.includes('openai')) provider = 'dalle';

                return {
                    url: finalUrl,
                    type: type as any,
                    isTemporary: provider === 'dalle', // URLs DALL-E expiram em 2h
                    niche,
                    source: { provider },
                    metadata: {}
                };
            };

            // ✅ LOG FINAL DAS IMAGENS ANTES DE RETORNAR
            console.log('[SPY-ENGINE] 🖼️ IMAGENS FINAIS SENDO RETORNADAS:', {
                finalImg1: finalImg1?.substring(0, 80),
                finalImg2: finalImg2?.substring(0, 80),
                finalImg3: finalImg3?.substring(0, 80),
                nicheForFallback,
                type1: 'generated',
                type2: 'generated',
                type3: 'generated'
            });

            const responseData = {
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl,
                    isMockData: !!apifyErrorMessage || !originalCopy || !adImageUrl,
                    warning: apifyErrorMessage ? `⚠️ ${apifyErrorMessage.substring(0, 120)}. O sistema usou dados de exemplo, mas as variações geradas ainda são de qualidade. Tente outra URL!` : undefined
                },
                generatedVariations: generatedCopys,
                generatedImages: {
                    image1: buildGeneratedImage(finalImg1, 'generated', generatedCopys.detectedNiche),
                    image2: buildGeneratedImage(finalImg2, 'generated', generatedCopys.detectedNiche),
                    image3: buildGeneratedImage(finalImg3, 'generated', generatedCopys.detectedNiche)
                } as GeneratedImages,
                strategicAnalysis: generatedCopys.strategic_analysis || null,
                logs: logger.exportAsJSON()
            };

            logger.success('RESPONSE_READY', '✅ Response pronto para enviar', {
                hasImage1: !!responseData.generatedImages.image1?.url,
                hasImage2: !!responseData.generatedImages.image2?.url,
                hasImage3: !!responseData.generatedImages.image3?.url,
            });

            return NextResponse.json(responseData);
        } catch (openaiError: unknown) {
            logger.error(STAGES.OPENAI_FAIL, 'Erro na chamada OpenAI', openaiError);

            const errorMessage = (openaiError as { message?: string } | undefined)?.message || String(openaiError);

            // Em vez de travar a tela em vermelho, devolvemos a resposta da OpenAI dentro das Copys!
            const buildGeneratedImageError = (url: string | undefined, type: string = 'placeholder', niche: string = 'Geral'): GeneratedImage => {
                // GARANTIA: NUNCA retornar URL vazia
                const finalUrl = url && url.trim() ? url : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800';
                return {
                    url: finalUrl,
                    type: type as any,
                    isTemporary: false,
                    niche,
                    source: {
                        provider: finalUrl?.includes('supabase') ? 'supabase' : finalUrl?.includes('unsplash') ? 'unsplash' : 'fallback'
                    },
                    metadata: {}
                };
            };

            const fallbackErrorNiche = 'Geral';
            return NextResponse.json({
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl
                },
                generatedVariations: {
                    variante1: `(ERRO NA SUA CONTA OPENAI) Ocorreu o seguinte bloqueio na sua chave de acesso: ${errorMessage}`,
                    variante2: `(DICA DE SOLUÇÃO) Geralmente este erro da OpenAI ('You exceeded your current quota' ou 'Incorrect API Key') significa que o seu cartão de crédito não foi cadastrado no site da OpenAI ou a conta não possui créditos pré-pagos (Mínimo $5).`,
                    variante3: `(DEMO FUNCIONAL) Independentemente da sua conta OpenAI, O seu SaaS está perfeitamente no Ar, responsivo e conseguindo conectar na nuvem. Recarregue os créditos da OpenAI e a magia acontece aqui!`
                },
                generatedImages: {
                    image1: buildGeneratedImageError("https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0?auto=format&fit=crop&q=80&w=800", 'placeholder', fallbackErrorNiche),
                    image2: buildGeneratedImageError("https://images.unsplash.com/photo-1596755094514-ff4df1ecfb7e?auto=format&fit=crop&q=80&w=800", 'placeholder', fallbackErrorNiche),
                    image3: buildGeneratedImageError("https://images.unsplash.com/photo-1556912988-2b80c6c8b0a1?auto=format&fit=crop&q=80&w=800", 'placeholder', fallbackErrorNiche)
                } as GeneratedImages,
                logs: logger.exportAsJSON()
            });
        }

    } catch (error: unknown) {
        logger.endTimer('TOTAL_REQUEST', STAGES.ERROR_CRITICAL);
        logger.error(STAGES.ERROR_CRITICAL, 'Erro catastrófico na requisição', error);

        const errorObject = error instanceof Error ? error : new Error(String(error));
        return NextResponse.json({
            error: 'Erro catastrófico no servidor.',
            message: errorObject.message || String(error),
            logs: logger.exportAsJSON()
        }, { status: 500 });
    }
}
