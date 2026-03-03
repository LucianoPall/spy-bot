import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';

// Inicializa os clientes das APIs (com fallbacks vazios para evitar erro de build na Vercel)
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || "dummy_token_for_build",
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_build",
});

export const maxDuration = 60; // 60s limit to allow Apify scraping on Vercel Hobby

export async function POST(req: Request) {
    try {
        const { adUrl } = await req.json();

        if (!adUrl) {
            return NextResponse.json({ error: 'URL do anúncio não fornecida.' }, { status: 400 });
        }

        if (!process.env.APIFY_API_TOKEN || !process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'Chaves de API ausentes no servidor.' }, { status: 500 });
        }

        // 1. Fase de Extração (Apify - Facebook Ads Library)
        let originalCopy = '';
        let adImageUrl = '';

        let apifyErrorMessage = "";
        try {
            console.log(`Iniciando raspagem real com Apify na URL: ${adUrl}`);
            const input = {
                startUrls: [{ url: adUrl }],
                maxItems: 1,
            };

            const run = await apifyClient.actor("apify/facebook-ads-scraper").call(input);
            const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

            if (items && items.length > 0) {
                const adData = items[0];
                originalCopy = String(adData.primaryText || adData.text || '');
                adImageUrl = String(adData.imageUrl || adData.thumbnailUrl || '');
                console.log("Raspagem concluída com sucesso!");
            } else {
                apifyErrorMessage = "A extração retornou 0 itens (vazio). O Facebook pode ter bloqueado o proxy do Apify.";
            }
        } catch (scraperError: any) {
            console.warn("Erro no Apify Catcher (anti-bot ativado ou timeout):", scraperError);
            apifyErrorMessage = scraperError.message || String(scraperError);
        }

        // FALLBACK INTELIGENTE (Para o MVP nunca travar se o Meta bloquear a raspagem sem proxy)
        if (!originalCopy) {
            console.log("Ativando Fallback de Extração para Demo...");
            originalCopy = `[ERRO NA EXTRAÇÃO REAL: ${apifyErrorMessage}] -> Texto Padrão de Recuperação: Atenção! Você está perdendo dinheiro todos os dias com anúncios que não convertem. Descubra o método secreto que os grandes players usam para vender 10x mais sem precisar criar nada do zero. Clique em Saiba Mais e aplique a estratégia do oceano azul no seu negócio agora mesmo!`;
            adImageUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800";
        }

        // Verificação se estamos rodando sem chave real na produção para pular a chamada e não quebrar com 500
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy_key_for_build") {
            console.log("Mocking OpenAI because API key is missing or dummy...");
            return NextResponse.json({
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl
                },
                generatedVariations: {
                    variante1: "(DEMO) O mercado de estética está virado de cabeça para baixo. Suas concorrentes que cobram metade do seu preço estão lotando a agenda enquanto você sua a camisa. Pare de brigar por centavos e implemente o Protocolo Diamante.",
                    variante2: "(DEMO) Lotar sua clínica nunca foi tão fácil. Com o Protocolo Diamante, você atrai clientes de alto padrão dispostas a pagar o triplo pelo seu serviço. Tudo isso sem depender de dancinhas no Instagram.",
                    variante3: "(DEMO) Ana estava quase fechando a clínica. Ela não aguentava mais clientes pedindo desconto. Até que ela descobriu um padrão de vendas secreto. Dois meses depois, ela precisou contratar 3 assistentes."
                }
            });
        }

        // 2. Fase de IA (Reengenharia de Copywriting)
        try {
            const chatCompletion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Você é um copywriter de elite (nível Russell Brunson). Seu objetivo é analisar a copy vitoriosa fornecida e recriá-la em 3 variações exclusivas para alta conversão.
                        
    Regras:
    1. Extraia a "Big Idea" e os ganchos (hooks).
    2. Entregue a Variante 1 focada em Dor Extrema.
    3. Entregue a Variante 2 focada em Solução e Benefício.
    4. Entregue a Variante 3 curta (Storytelling rápido e direto ao ponto).
    Responda em JSON válido no formato: { "variante1": "texto", "variante2": "texto", "variante3": "texto" }`
                    },
                    {
                        role: "user",
                        content: `Copy Original para Clonar e Melhorar:\n\n${originalCopy}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const generatedCopys = JSON.parse(chatCompletion.choices[0].message.content || "{}");

            // Retorna o pacote completo para o Front-End
            return NextResponse.json({
                success: true,
                originalAd: {
                    copy: originalCopy,
                    image: adImageUrl
                },
                generatedVariations: generatedCopys
            });
        } catch (openaiError: any) {
            console.error("Erro Específico na OpenAI:", openaiError);

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
                }
            });
        }

    } catch (error: any) {
        console.error("Erro Crítico no Spy Bot Engine:", error);
        return NextResponse.json({
            error: 'Erro catastrófico no servidor.',
            message: error.message || String(error)
        }, { status: 500 });
    }
}
