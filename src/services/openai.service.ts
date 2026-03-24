/**
 * OpenAI Service
 *
 * Encapsula toda a lógica de chamadas ao OpenAI (GPT-4o)
 * Responsabilidades:
 * - Construir prompts contextualizados
 * - Fazer chamadas a GPT-4o
 * - Parsear respostas em JSON
 * - Tratar erros
 */

import OpenAI from 'openai';

export interface OpenAIGenerationResult {
  variations: {
    variante1: string;
    variante2: string;
    variante3: string;
  };
  strategicAnalysis: {
    hook: string;
    promise: string;
    emotion: string;
    cta: string;
    targeting: string;
  };
  isError: boolean;
  errorMessage?: string;
}

/**
 * Gera 3 variações de copy + análise estratégica usando GPT-4o
 *
 * @param openaiClient - Cliente OpenAI configurado
 * @param originalCopy - Copy original extraído
 * @param niche - Nicho detectado
 * @param contextPrompt - Contexto adicional do nicho
 * @returns Variações + análise ou erro
 */
export async function generateCopyVariations(
  openaiClient: OpenAI,
  originalCopy: string,
  niche: string,
  contextPrompt: string = ''
): Promise<OpenAIGenerationResult> {
  try {
    console.log('[OPENAI] Iniciando geração de variações:', { niche, copyLength: originalCopy.length });

    // Construir prompt
    const systemPrompt = `Você é um expert em copywriting para ${niche}.
    ${contextPrompt}

    Gere 3 variações de copy que sejam:
    - Persuasivas e criativas
    - Adaptadas para o nicho ${niche}
    - Diferentes em tom e abordagem

    Retorne SEMPRE um JSON válido com a estrutura exata abaixo.`;

    const userPrompt = `Analise este anúncio e gere 3 variações de copy:

Anúncio original:
"${originalCopy}"

Retorne um JSON com exatamente esta estrutura:
{
  "variations": {
    "variante1": "primeira variação aqui",
    "variante2": "segunda variação aqui",
    "variante3": "terceira variação aqui"
  },
  "strategicAnalysis": {
    "hook": "o elemento mais atrativo",
    "promise": "benefício principal",
    "emotion": "emoção predominante",
    "cta": "call to action",
    "targeting": "público-alvo identificado"
  }
}`;

    // Chamar GPT-4o
    const completion = await openaiClient.chat.completions.create(
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500
      },
      { timeout: 30000 }
    );

    // Parsear resposta
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('OpenAI retornou resposta vazia');
    }

    const parsed = JSON.parse(responseText);

    console.log('[OPENAI] ✅ Variações geradas com sucesso');

    return {
      variations: {
        variante1: parsed.variations?.variante1 || 'Erro ao gerar variante 1',
        variante2: parsed.variations?.variante2 || 'Erro ao gerar variante 2',
        variante3: parsed.variations?.variante3 || 'Erro ao gerar variante 3'
      },
      strategicAnalysis: {
        hook: parsed.strategicAnalysis?.hook || 'N/A',
        promise: parsed.strategicAnalysis?.promise || 'N/A',
        emotion: parsed.strategicAnalysis?.emotion || 'N/A',
        cta: parsed.strategicAnalysis?.cta || 'N/A',
        targeting: parsed.strategicAnalysis?.targeting || 'N/A'
      },
      isError: false
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[OPENAI] ❌ Erro na geração:', errorMessage);

    return {
      variations: {
        variante1: `Erro ao gerar: ${errorMessage.substring(0, 100)}`,
        variante2: 'Tente novamente mais tarde',
        variante3: 'Sistema temporariamente indisponível'
      },
      strategicAnalysis: {
        hook: 'Indisponível',
        promise: 'Indisponível',
        emotion: 'Indisponível',
        cta: 'Indisponível',
        targeting: 'Indisponível'
      },
      isError: true,
      errorMessage
    };
  }
}

/**
 * Valida se a geração foi bem-sucedida
 */
export function isOpenAIGenerationValid(result: OpenAIGenerationResult): boolean {
  return !result.isError &&
    !!result.variations.variante1 &&
    !!result.variations.variante2 &&
    !!result.variations.variante3;
}
