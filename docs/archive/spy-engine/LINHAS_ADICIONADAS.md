# Linhas de Logger Adicionadas no route.ts

## Localização de Cada Log

### 1. Linha 4 - Import

```typescript
// ✅ ADICIONADO
import { logger, STAGES } from './logger';
```

---

### 2. Linhas 120-121 - Inicialização

```typescript
export async function POST(req: Request) {
    // ✅ ADICIONADO
    logger.clear();
    logger.startTimer('TOTAL_REQUEST');
```

---

### 3. Linhas 124-125 - START

```typescript
    try {
        const { adUrl, brandProfile } = await req.json();
        // ✅ ADICIONADO
        logger.info(STAGES.START, 'URL recebida', { url: adUrl?.substring(0, 80), hasBrandProfile: !!brandProfile });
```

---

### 4. Linhas 128 - VALIDATION (erro)

```typescript
        if (!adUrl) {
            // ✅ ADICIONADO
            logger.error(STAGES.VALIDATION, 'URL do anúncio não fornecida');
            return NextResponse.json({ error: 'URL do anúncio não fornecida.' }, { status: 400 });
        }
```

---

### 5. Linhas 133 - VALIDATION (erro)

```typescript
        if (!process.env.APIFY_API_TOKEN || !process.env.OPENAI_API_KEY) {
            // ✅ ADICIONADO
            logger.error(STAGES.VALIDATION, 'Chaves de API ausentes no servidor');
            return NextResponse.json({ error: 'Chaves de API ausentes no servidor.' }, { status: 500 });
        }
```

---

### 6. Linha 137 - VALIDATION (sucesso)

```typescript
        // ✅ ADICIONADO
        logger.success(STAGES.VALIDATION, 'URL e chaves validadas');
```

---

### 7. Linha 140 - BILLING (início)

```typescript
        // --- INÍCIO: Verificação de Monetização (Billing) ---
        // ✅ ADICIONADO
        logger.info(STAGES.BILLING, 'Iniciando verificação de créditos e plano');
```

---

### 8. Linha 147 - BILLING (usuário autenticado)

```typescript
        if (user) {
            // ✅ ADICIONADO
            logger.info(STAGES.BILLING, 'Usuário autenticado', { userId: user.id });
```

---

### 9. Linha 150 - BILLING (primeira requisição)

```typescript
            const { data: sub } = await supabase.from('spybot_subscriptions').select('*').eq('user_id', user.id).single();
            if (!sub) {
                // ✅ ADICIONADO
                logger.info(STAGES.BILLING, 'Primeira requisição do usuário, criando subscription padrão');
                await supabase.from('spybot_subscriptions').insert({ user_id: user.id, credits: 5, plan: 'gratis' });
            } else {
                currentPlan = sub.plan;
                currentCredits = sub.credits;
                // ✅ ADICIONADO
                logger.success(STAGES.BILLING, 'Plano carregado', { plan: currentPlan, credits: currentCredits });
            }
```

---

### 10. Linha 160 - BILLING (erro - sem créditos)

```typescript
            const hasByok = brandProfile && brandProfile.openaiKey && brandProfile.openaiKey.trim() !== "";
            if (currentPlan === 'gratis' && currentCredits <= 0 && !hasByok) {
                // ✅ ADICIONADO
                logger.error(STAGES.BILLING, 'Créditos insuficientes, acesso negado');
                return NextResponse.json({
                    error: 'Seus créditos grátis acabaram! Assine o plano PRO ou adicione sua Chave da OpenAI para continuar.',
                    code: 'OUT_OF_CREDITS'
                }, { status: 403 });
            }
        } else {
            // ✅ ADICIONADO
            logger.warn(STAGES.BILLING, 'Usuário não autenticado, usando defaults');
        }
        // ✅ ADICIONADO
        logger.success(STAGES.BILLING, 'Verificação de billing concluída');
```

---

### 11. Linhas 177-191 - APIFY_CALL

```typescript
        let apifyErrorMessage = "";
        try {
            // ✅ ADICIONADO
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
```

---

### 12. Linhas 208-213 - APIFY_SUCCESS

```typescript
                adImageUrl = String(
                    snap.images?.[0]?.originalImageUrl ||
                    snap.videos?.[0]?.videoPreviewImageUrl ||
                    snap.pageProfilePictureUrl ||
                    adData.imageUrl ||
                    ''
                );

                // ✅ ADICIONADO
                logger.endTimer('APIFY_EXTRACTION', STAGES.APIFY_SUCCESS);
                logger.success(STAGES.APIFY_SUCCESS, 'Dados extraídos com sucesso', {
                    copyLength: originalCopy.length,
                    hasImage: !!adImageUrl,
                    imageSample: adImageUrl?.substring(0, 60)
                });
            } else {
                apifyErrorMessage = "A extração retornou 0 itens (vazio). O Facebook pode ter bloqueado ou o ID é inválido.";
                // ✅ ADICIONADO
                logger.warn(STAGES.APIFY_FAIL, 'Apify retornou lista vazia', { reason: apifyErrorMessage });
            }
        } catch (scraperError: any) {
            apifyErrorMessage = scraperError.message || String(scraperError);
            // ✅ ADICIONADO
            logger.endTimer('APIFY_EXTRACTION', STAGES.APIFY_FAIL);
            logger.error(STAGES.APIFY_FAIL, 'Erro na chamada Apify', scraperError);
        }
```

---

### 13. Linhas 235-246 - FALLBACK

```typescript
        // FALLBACK INTELIGENTE E TRATAMENTO DE AD SEM COPY
        if (!originalCopy && apifyErrorMessage) {
            // Se Deu ERRO e não extraiu nada - usar mock data realista
            // ✅ ADICIONADO
            logger.warn(STAGES.FALLBACK, `Ativando Fallback Mock devido a erro Apify: ${apifyErrorMessage.substring(0, 100)}`);
            const mockData = getMockAdData(adUrl);
            originalCopy = mockData.copy;
            adImageUrl = mockData.image;
            // ✅ ADICIONADO
            logger.info(STAGES.FALLBACK, 'Mock data carregado com sucesso', { niche: mockData.niche });
        } else if (!originalCopy && !apifyErrorMessage) {
            // Extraiu com sucesso, mas o anúncio é puramente em Imagem/Vídeo (Não tem script de vendas)
            // ✅ ADICIONADO
            logger.warn(STAGES.APIFY_SUCCESS, 'Anúncio extraído mas sem copy escrita (100% visual)');
            originalCopy = "[O anunciante original não utilizou copy escrita para este anúncio, o foco foi 100% no Apelo Visual ou Vídeo (Aja baseado nisso para gerar suas próprias copies matadoras!).]";
        }
```

---

### 14. Linha 249 - OPENAI_CALL (dummy key)

```typescript
        // Verificação se estamos rodando sem chave real na produção para pular a chamada e não quebrar com 500
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy_key_for_build") {
            // ✅ ADICIONADO
            logger.warn(STAGES.OPENAI_CALL, 'Chave OpenAI ausente ou dummy, usando resposta de demo');
            return NextResponse.json({
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl
                },
                generatedVariations: {
                    variante1: "(DEMO) ...",
                    variante2: "(DEMO) ...",
                    variante3: "(DEMO) ..."
                },
                // ✅ ADICIONADO
                logs: logger.exportAsJSON()
            });
        }
```

---

### 15. Linhas 271-285 - OPENAI_CALL

```typescript
        // 2. Fase de IA (Reengenharia de Copywriting e Design)
        try {
            // ✅ ADICIONADO
            logger.startTimer('OPENAI_CALL');
            logger.info(STAGES.OPENAI_CALL, 'Iniciando chamada GPT-4o para reengenharia de copy');

            // BYOK - Bring Your Own Key
            let activeOpenaiClient = openai;
            let usingByok = false;
            if (brandProfile && brandProfile.openaiKey && brandProfile.openaiKey.trim() !== "") {
                // ✅ ADICIONADO
                logger.info(STAGES.OPENAI_CALL, 'Usando chave API customizada do cliente (BYOK)');
                activeOpenaiClient = new OpenAI({ apiKey: brandProfile.openaiKey.trim() });
                usingByok = true;
            }

            // Montagem Dinâmica do Contexto da Marca
            let brandContext = "";
            if (brandProfile && (brandProfile.companyName || brandProfile.niche)) {
                // ✅ ADICIONADO
                logger.info(STAGES.OPENAI_CALL, 'Contexto de marca detectado', { brand: brandProfile.companyName, niche: brandProfile.niche });
                brandContext = `...`;
            }
```

---

### 16. Linhas 318-320 - OPENAI_SUCCESS

```typescript
            const chatCompletion = await activeOpenaiClient.chat.completions.create({...});

            // ✅ ADICIONADO
            logger.endTimer('OPENAI_CALL', STAGES.OPENAI_SUCCESS);
            logger.success(STAGES.OPENAI_SUCCESS, 'GPT-4o respondeu com 3 variações', { usingByok });

            const generatedCopys = JSON.parse(chatCompletion.choices[0].message.content || "{}");
```

---

### 17. Linhas 323-349 - DALLE_CALL & DALLE_SUCCESS

```typescript
            // 3. Fase de Geração Visual (DALL-E 3 Nativo FaceAds)
            // ✅ ADICIONADO
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
                        // ✅ ADICIONADO
                        logger.warn(STAGES.DALLE_FAIL, `Imagem ${imageNumber}: prompt vazio, usando fallback`);
                        return fallbackUrl;
                    }
                    // ✅ ADICIONADO
                    logger.info(STAGES.DALLE_CALL, `Gerando imagem ${imageNumber} (${targetSize})`, { promptLength: prompt.length });

                    const response = await activeOpenaiClient.images.generate({
                        model: "dall-e-3",
                        prompt: prompt,
                        n: 1,
                        size: targetSize,
                    });
                    const generatedUrl = response.data?.[0]?.url || fallbackUrl;
                    // ✅ ADICIONADO
                    logger.success(STAGES.DALLE_SUCCESS, `Imagem ${imageNumber} gerada com sucesso`);
                    return generatedUrl;
                } catch (imgErr: any) {
                    // ✅ ADICIONADO
                    logger.error(STAGES.DALLE_FAIL, `Erro ao gerar imagem ${imageNumber}`, imgErr);
                    return fallbackUrl;
                }
            };

            const placeholder = "...";

            const [img1, img2, img3] = await Promise.all([
                generateImageSafely(generatedCopys.imagePrompt1, placeholder, "1024x1024", 1),
                generateImageSafely(generatedCopys.imagePrompt2, placeholder, "1024x1024", 2),
                generateImageSafely(generatedCopys.imagePrompt3, placeholder, "1024x1792", 3)
            ]);

            // ✅ ADICIONADO
            logger.endTimer('DALLE_GENERATION', STAGES.DALLE_SUCCESS);
```

---

### 18. Linhas 350-409 - STORAGE & SUPABASE

```typescript
            let finalImg1 = img1, finalImg2 = img2, finalImg3 = img3;

            // [Histórico e Armazenamento] Tenta salvar os resultados no banco oficial e fotos no Storage
            try {
                if (user) {
                    // ✅ ADICIONADO
                    logger.info(STAGES.STORAGE_UPLOAD, 'Iniciando upload de 3 imagens para Supabase Storage');

                    const uploadImageToSupabase = async (
                        url: string,
                        supabaseClient: any,
                        userId: string,
                        imageNumber: number
                    ): Promise<string> => {
                        if (!url || url.includes("unsplash")) {
                            // ✅ ADICIONADO
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
                                // ✅ ADICIONADO
                                logger.error(STAGES.STORAGE_FAIL, `Erro no upload da imagem ${imageNumber}`, error);
                                return url;
                            }
                            const publicUrl = supabaseClient.storage.from('spybot_images').getPublicUrl(fileName).data.publicUrl;
                            // ✅ ADICIONADO
                            logger.success(STAGES.STORAGE_SUCCESS, `Imagem ${imageNumber} enviada para Storage`, { fileName });
                            return publicUrl;
                        } catch (e: any) {
                            // ✅ ADICIONADO
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

                    // ✅ ADICIONADO
                    logger.info(STAGES.SUPABASE_INSERT, 'Inserindo geração no banco de dados');
                    await supabase.from('spybot_generations').insert({
                        user_id: user.id,
                        original_url: adUrl,
                        original_copy: originalCopy,
                        original_image: adImageUrl,
                        niche: generatedCopys.detectedNiche || 'Geral',
                        variante1: generatedCopys.variante1,
                        image1: finalImg1,
                        variante2: generatedCopys.variante2,
                        image2: finalImg2,
                        variante3: generatedCopys.variante3,
                        image3: finalImg3,
                    });
                    // ✅ ADICIONADO
                    logger.success(STAGES.SUPABASE_SUCCESS, 'Clone salvo no histórico e Storage', {
                        userId: user.id,
                        niche: generatedCopys.detectedNiche || 'Geral'
                    });

                    // Desconta 1 crédito se for grátis e não tiver BYOK
                    const hasByok = brandProfile && brandProfile.openaiKey && brandProfile.openaiKey.trim() !== "";
                    if (currentPlan === 'gratis' && !hasByok) {
                        await supabase.from('spybot_subscriptions').update({ credits: Math.max(0, currentCredits - 1) }).eq('user_id', user.id);
                        // ✅ ADICIONADO
                        logger.info(STAGES.BILLING_DEDUCT, 'Crédito deduzido da quota gratuita', { remainingCredits: Math.max(0, currentCredits - 1) });
                    }
                } else {
                    // ✅ ADICIONADO
                    logger.info(STAGES.SUPABASE_INSERT, 'Usuário não autenticado, ignorando salvamento em banco de dados');
                }
            } catch (dbError: any) {
                // ✅ ADICIONADO
                logger.error(STAGES.SUPABASE_FAIL, 'Erro ao salvar no histórico/storage (ignorado para não travar UI)', dbError);
            }
```

---

### 19. Linhas 410-422 - END (sucesso)

```typescript
            // Retorna o pacote completo e Visual para o Front-End
            // ✅ ADICIONADO
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
                // ✅ ADICIONADO
                logs: logger.exportAsJSON()
            });
```

---

### 20. Linhas 423-438 - OPENAI_FAIL

```typescript
        } catch (openaiError: any) {
            // ✅ ADICIONADO
            logger.error(STAGES.OPENAI_FAIL, 'Erro na chamada OpenAI', openaiError);

            // Em vez de travar a tela em vermelho, devolvemos a resposta da OpenAI dentro das Copys!
            return NextResponse.json({
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl
                },
                generatedVariations: {
                    variante1: `(ERRO NA SUA CONTA OPENAI) Ocorreu o seguinte bloqueio na sua chave de acesso: ${openaiError.message}`,
                    variante2: `(DICA DE SOLUÇÃO) Geralmente este erro da OpenAI ('You exceeded your current quota' ou 'Incorrect API Key') significa que o seu cartão de crédito não foi cadastrado no site da OpenAI ou a conta não possui créditos pré-pagos (Mínimo $5).`,
                    variante3: `(DEMO FUNCIONAL) Independentemente da sua conta OpenAI, O seu SaaS está perfeitamente no Ar, responsivo e conseguindo conectar na nuvem. Recarregue os créditos da OpenAI e a magia acontece aqui!`
                },
                // ✅ ADICIONADO
                logs: logger.exportAsJSON()
            });
        }
```

---

### 21. Linhas 441-447 - ERROR_CRITICAL

```typescript
    } catch (error: any) {
        // ✅ ADICIONADO
        const totalTime = logger.endTimer('TOTAL_REQUEST', STAGES.ERROR_CRITICAL);
        logger.error(STAGES.ERROR_CRITICAL, 'Erro catastrófico na requisição', error);

        return NextResponse.json({
            error: 'Erro catastrófico no servidor.',
            message: error.message || String(error),
            // ✅ ADICIONADO
            logs: logger.exportAsJSON()
        }, { status: 500 });
    }
}
```

---

## Resumo

| Categoria | Quantidade | Linhas |
|-----------|-----------|--------|
| Imports | 1 | 4 |
| Inicialização | 2 | 120-121 |
| START | 1 | 125 |
| VALIDATION | 3 | 128, 133, 137 |
| BILLING | 7 | 140, 147, 150, 155, 160, 167, 169 |
| APIFY | 5 | 177-178, 208-213 |
| FALLBACK | 2 | 237, 242 |
| OPENAI | 4 | 249, 271-273, 275, 318-320 |
| DALLE | 6 | 323-349 |
| STORAGE | 3 | 350, 358, 364 |
| SUPABASE | 3 | 380, 393, 397 |
| BILLING_DEDUCT | 1 | 401 |
| END (sucesso) | 2 | 410-413 |
| OPENAI_FAIL | 1 | 424 |
| ERROR_CRITICAL | 2 | 442-444 |
| **TOTAL** | **42 blocos** | **+40 linhas** |

---

**Arquivo:** `C:\Users\lucia\Documents\Comunidade\aios-project\spy-bot-web\src\app\api\spy-engine\route.ts`
**Mudanças:** 42 blocos de logger adicionados estrategicamente
**Resultado:** 100% das etapas rastreadas com logs estruturados
