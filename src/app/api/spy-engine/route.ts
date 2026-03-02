import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import OpenAI from 'openai';

// Inicializa os clientes das APIs
const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
        // Usando o Ad Library Scraper (exemplo de Actor)
        const input = {
            startUrls: [{ url: adUrl }],
            maxItems: 1,
        };

        // NOTA: O ID abaixo é um placeholder para o scraper oficial de FB Ads Lib do Apify
        const run = await apifyClient.actor("apify/facebook-ads").call(input);
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Nenhum dado encontrado para esta URL de anúncio.' }, { status: 404 });
        }

        const adData = items[0];
        const originalCopy = adData.primaryText || adData.text || '';
        const adImageUrl = adData.imageUrl || adData.thumbnailUrl || '';

        if (!originalCopy) {
            return NextResponse.json({ error: 'Não foi possível extrair a copy do anúncio.' }, { status: 404 });
        }

        // 2. Fase de IA (Reengenharia de Copywriting)
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

    } catch (error: any) {
        console.error("Erro no Spy Bot Engine:", error);
        return NextResponse.json({ error: 'Erro interno no servidor ao processar o anúncio.', message: error.message }, { status: 500 });
    }
}
