import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { logger, STAGES } from './logger';
import { getMockAdData } from '@/lib/mockAdData';

// Inicializa os clientes das APIs (com fallbacks vazios para evitar erro de build na Vercel)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_build",
});

export const maxDuration = 60; // 60s limit to allow Apify scraping on Vercel Hobby

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
            logger.info(STAGES.BILLING, 'Usuário autenticado', { userId: user.id });
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
            const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

            // Validação: Usuário grátis com créditos zerados DEVE assinar PRO
            if (!isAdmin && currentPlan === 'gratis' && currentCredits <= 0 && !hasByok) {
                logger.error(STAGES.BILLING, 'Créditos insuficientes, acesso negado para usuário');
                return NextResponse.json({
                    error: 'Seus créditos grátis acabaram! 😢 Você precisa assinar o plano PRO ($97) para continuar usando o Spy Bot. Após o upgrade, você poderá adicionar sua própria Chave da OpenAI se desejar.',
                    code: 'OUT_OF_CREDITS'
                }, { status: 403 });
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
            logger.info(STAGES.APIFY_CALL, 'Iniciando extração com Apify (tentativa 1-3)', { url: adUrl?.substring(0, 80) });
            const input = {
                startUrls: [{ url: adUrl }],
                maxItems: 1,
            };

            const apifyToken = process.env.APIFY_API_TOKEN || "dummy";
            const response = await fetchWithRetry(
                `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input)
                },
                3 // maxRetries
            );

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

                // Se a cópia for vazia ou 'undefined', mas o JSON chegou, o anúncio não tem copy (só vídeo/imagem)
                if (originalCopy === 'undefined' || originalCopy === 'null') {
                    originalCopy = '';
                }

                adImageUrl = String(
                    snap.images?.[0]?.originalImageUrl ||
                    snap.videos?.[0]?.videoPreviewImageUrl ||
                    snap.pageProfilePictureUrl ||
                    adData.imageUrl ||
                    ''
                );

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
            apifyErrorMessage = (scraperError as { message?: string } | undefined)?.message || String(scraperError);
            logger.endTimer('APIFY_EXTRACTION', STAGES.APIFY_FAIL);
            logger.error(STAGES.APIFY_FAIL, 'Erro na chamada Apify', scraperError);
        }

        // FALLBACK INTELIGENTE E TRATAMENTO DE AD SEM COPY
        if (!originalCopy && apifyErrorMessage) {
            // Se Deu ERRO e não extraiu nada - usar mock data realista
            logger.warn(STAGES.FALLBACK, `Ativando Fallback Mock devido a erro Apify: ${apifyErrorMessage.substring(0, 100)}`);
            const mockData = getMockAdData(adUrl);
            originalCopy = mockData.copy;
            adImageUrl = mockData.image;
            logger.info(STAGES.FALLBACK, 'Mock data carregado com sucesso', { niche: mockData.niche });
        } else if (!originalCopy && !apifyErrorMessage) {
            // Extraiu com sucesso, mas o anúncio é puramente em Imagem/Vídeo (Não tem script de vendas)
            logger.warn(STAGES.APIFY_SUCCESS, 'Anúncio extraído mas sem copy escrita (100% visual)');
            originalCopy = "[O anunciante original não utilizou copy escrita para este anúncio, o foco foi 100% no Apelo Visual ou Vídeo (Aja baseado nisso para gerar suas próprias copies matadoras!).]";
        }

        // Verificação se estamos rodando sem chave real na produção para pular a chamada e não quebrar com 500
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy_key_for_build") {
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
                        content: `Você é um copywriter de elite (nível Russell Brunson). Analise a copy vitoriosa fornecida e recrie em 3 variações exclusivas para alta conversão.
                        Além disso, para CADA variação, forneça um 'imagePrompt' muito bem detalhado em inglês (para o DALL-E 3).
                        ${brandContext}

    🚨 REGRAS DE COMPLIANCE FACEBOOK ADS (EVITAR BLOQUEIOS):
    O 'imagePrompt' DEVE ser 100% "White Hat". É ESTRITAMENTE PROIBIDO descrever imagens com:
    - Antes e Depois (Before/After) de corpos ou resultados.
    - Zoom extremo em partes do corpo ou pele.
    - Promessas irreais de dinheiro, botões falsos (Fake UI) ou conteúdo chocante/sensacionalista.
    - Foco excessivo em características de saúde, emagrecimento ou enriquecimento fácil.
    Gere imagens ilustrativas, metafóricas, limpas, de pessoas felizes ou representações de sucesso/alívio adequadas para as Políticas da Meta.

    Regras da Copy:
    1. Extraia a "Big Idea".
    2. Variante 1 focada em Dor Extrema. (A Imagem será Feed Quadrada 1:1)
    3. Variante 2 foca em Solução Direta. (A Imagem será Feed Quadrada 1:1)
    4. Variante 3 curta Storytelling ou Reels/Story (A Imagem TEM que ser focada em Formato Vertical 9:16)
    5. Adivinhe o Nicho de Mercado deste anúncio em 1 a 3 palavras (ex: Emagrecimento, Renda Extra, iGaming) e retorne na variável 'detectedNiche'.
    Responda em JSON válido no formato: { "variante1": "texto", "imagePrompt1": "texto", "variante2": "texto", "imagePrompt2": "texto", "variante3": "texto", "imagePrompt3": "texto", "detectedNiche": "texto" }`
                    },
                    {
                        role: "user",
                        content: `Copy Original para Clonar e Melhorar:\n\n${originalCopy}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            logger.endTimer('OPENAI_CALL', STAGES.OPENAI_SUCCESS);
            logger.success(STAGES.OPENAI_SUCCESS, 'GPT-4o respondeu com 3 variações', { usingByok });

            const generatedCopys = JSON.parse(chatCompletion.choices[0].message.content || "{}");

            // 3. Fase de Geração Visual (DALL-E 3 Nativo FaceAds)
            logger.startTimer('DALLE_GENERATION');
            logger.info(STAGES.DALLE_CALL, 'Iniciando geração de 3 imagens (2x quadrado 1:1, 1x vertical 9:16)');

            const generateImageSafely = async (
                prompt: string,
                fallbackUrl: string,
                targetSize: "1024x1024" | "1024x1792",
                imageNumber: number
            ) => {
                try {
                    if (!prompt) {
                        logger.warn(STAGES.DALLE_FAIL, `Imagem ${imageNumber}: prompt vazio, usando fallback`);
                        return fallbackUrl;
                    }
                    logger.info(STAGES.DALLE_CALL, `Gerando imagem ${imageNumber} (${targetSize})`, { promptLength: prompt.length });

                    const response = await activeOpenaiClient.images.generate({
                        model: "dall-e-3",
                        prompt: prompt,
                        n: 1,
                        size: targetSize, // 1024x1024 (1:1 Feed) ou 1024x1792 (9:16 Stories/Reels)
                    });
                    const generatedUrl = response.data?.[0]?.url || fallbackUrl;
                    logger.success(STAGES.DALLE_SUCCESS, `Imagem ${imageNumber} gerada com sucesso`);
                    return generatedUrl;
                } catch (imgErr: unknown) {
                    logger.error(STAGES.DALLE_FAIL, `Erro ao gerar imagem ${imageNumber}`, imgErr);
                    return fallbackUrl;
                }
            };

            const placeholder = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800";

            const [img1, img2, img3] = await Promise.all([
                generateImageSafely(generatedCopys.imagePrompt1, placeholder, "1024x1024", 1), // Quadrado (Feed Insta/Face)
                generateImageSafely(generatedCopys.imagePrompt2, placeholder, "1024x1024", 2), // Quadrado (Feed Insta/Face)
                generateImageSafely(generatedCopys.imagePrompt3, placeholder, "1024x1792", 3)  // Vertical (Stories/Reels/TikTok)
            ]);

            logger.endTimer('DALLE_GENERATION', STAGES.DALLE_SUCCESS);

            let finalImg1 = img1, finalImg2 = img2, finalImg3 = img3;

            // [Histórico e Armazenamento] Tenta salvar os resultados no banco oficial e fotos no Storage
            try {
                if (user) {
                    logger.info(STAGES.STORAGE_UPLOAD, 'Iniciando upload de 3 imagens para Supabase Storage');

                    const uploadImageToSupabase = async (
                        url: string,
                        supabaseClient: any,
                        userId: string,
                        imageNumber: number
                    ): Promise<string> => {
                        if (!url || url.includes("unsplash")) {
                            logger.info(STAGES.STORAGE_UPLOAD, `Imagem ${imageNumber}: usando URL externa (unsplash/fallback)`);
                            return url;
                        }
                        try {
                            const imgRes = await fetch(url);
                            const blob = await imgRes.blob();
                            const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

                            const { error } = await supabaseClient.storage
                                .from('spybot_images')
                                .upload(fileName, blob, { contentType: 'image/png', upsert: true });

                            if (error) {
                                logger.error(STAGES.STORAGE_FAIL, `Erro no upload da imagem ${imageNumber}`, error);
                                return url;
                            }
                            const publicUrl = supabaseClient.storage.from('spybot_images').getPublicUrl(fileName).data.publicUrl;
                            logger.success(STAGES.STORAGE_SUCCESS, `Imagem ${imageNumber} enviada para Storage`, { fileName });
                            return publicUrl;
                        } catch (e: unknown) {
                            logger.error(STAGES.STORAGE_FAIL, `Erro ao fazer download/upload imagem ${imageNumber}`, e);
                            return url;
                        }
                    };

                    // Substitui as URLs temporárias (1hr) do DALL-E por URLs do seu Bucket
                    [finalImg1, finalImg2, finalImg3] = await Promise.all([
                        uploadImageToSupabase(img1, supabase, user.id, 1),
                        uploadImageToSupabase(img2, supabase, user.id, 2),
                        uploadImageToSupabase(img3, supabase, user.id, 3)
                    ]);

                    logger.info(STAGES.SUPABASE_INSERT, 'Inserindo geração no banco de dados');
                    await supabase.from('spybot_generations').insert({
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
                    });
                    logger.success(STAGES.SUPABASE_SUCCESS, 'Clone salvo no histórico e Storage', {
                        userId: user.id,
                        niche: generatedCopys.detectedNiche || 'Geral'
                    });

                    // Desconta 1 crédito se for grátis e não tiver BYOK
                    const hasByok = brandProfile && brandProfile.openaiKey && brandProfile.openaiKey.trim() !== "";
                    if (currentPlan === 'gratis' && !hasByok) {
                        await supabase.from('spybot_subscriptions').update({ credits: Math.max(0, currentCredits - 1) }).eq('user_id', user.id);
                        logger.info(STAGES.BILLING_DEDUCT, 'Crédito deduzido da quota gratuita', { remainingCredits: Math.max(0, currentCredits - 1) });
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

            return NextResponse.json({
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl
                },
                generatedVariations: generatedCopys,
                generatedImages: {
                    image1: finalImg1,
                    image2: finalImg2,
                    image3: finalImg3
                },
                logs: logger.exportAsJSON()
            });
        } catch (openaiError: unknown) {
            logger.error(STAGES.OPENAI_FAIL, 'Erro na chamada OpenAI', openaiError);

            const errorMessage = (openaiError as { message?: string } | undefined)?.message || String(openaiError);

            // Em vez de travar a tela em vermelho, devolvemos a resposta da OpenAI dentro das Copys!
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
