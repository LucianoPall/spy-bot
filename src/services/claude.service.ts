/**
 * Claude Service (copy)
 *
 * Gera 3 variações de copy + análise estratégica usando Claude (Anthropic).
 * Substitui a geração de texto que antes usava OpenAI GPT-4o.
 *
 * Estratégia:
 * - Modelo: Claude Sonnet 4.6 (claude-sonnet-4-6)
 * - JSON garantido via TOOL USE com tool_choice forçado (sem regex/parse frágil)
 * - Prompt caching no system prompt (instruções estáveis ficam no system;
 *   o que varia — nicho, contexto, copy — vai na mensagem do usuário)
 */

import Anthropic from '@anthropic-ai/sdk';
import { log } from '@/lib/logger';

// Mantém a MESMA forma de retorno que o serviço antigo (OpenAIGenerationResult)
// para não quebrar quem consome em src/app/api/spy-engine/route.ts
export interface CopyGenerationResult {
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
    persuasion_structure: string;
    angle: string;
    offer_type: string;
  };
  isError: boolean;
  errorMessage?: string;
}

const COPY_MODEL = 'claude-sonnet-4-6';

// Client lazy — evita erro no build quando a chave não está presente
let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY não configurada no servidor');
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// System prompt ESTÁVEL (igual em toda request) → bom para prompt caching.
// O que muda por request (nicho, contexto, copy) vai na mensagem do usuário.
const COPY_SYSTEM_PROMPT = `Você é um copywriter sênior especialista em anúncios de resposta direta para Facebook e Instagram Ads, com domínio de frameworks de persuasão (AIDA, PAS, BAB) e do mercado brasileiro.

Sua tarefa: a partir de um anúncio original e do nicho informado, gerar 3 variações de copy distintas e de alta conversão, mais uma análise estratégica do anúncio original.

Regras:
- As 3 variações devem ser persuasivas, criativas e adaptadas ao nicho.
- Cada variação deve ter tom/abordagem diferente entre si (ex.: emocional, lógico/prova, urgência).
- Escreva em português do Brasil, prontas para publicar (sem placeholders).
- Não invente claims médicos/financeiros irreais; mantenha conformidade com as políticas do Facebook.
- Sempre responda chamando a ferramenta submit_ad_variations com o JSON estruturado — nunca responda em texto livre.`;

// Tool que força a estrutura de saída (JSON garantido).
// IMPORTANTE: schema ACHATADO (campos no nível raiz, sem objetos aninhados).
// Objetos aninhados fazem o Sonnet ocasionalmente "stringificar" o sub-objeto
// (devolver `variations` como string JSON em vez de objeto), quebrando o parse.
// Campos string no topo são muito mais confiáveis em tool use.
const COPY_TOOL: Anthropic.Tool = {
  name: 'submit_ad_variations',
  description: 'Submete as 3 variações de copy e a análise estratégica do anúncio original.',
  input_schema: {
    type: 'object',
    properties: {
      variante1: { type: 'string', description: 'Primeira variação de copy, completa e pronta para publicar' },
      variante2: { type: 'string', description: 'Segunda variação de copy, completa e pronta para publicar' },
      variante3: { type: 'string', description: 'Terceira variação de copy, completa e pronta para publicar' },
      hook: { type: 'string', description: 'O elemento mais atrativo / gancho' },
      promise: { type: 'string', description: 'Benefício/promessa principal' },
      emotion: { type: 'string', description: 'Emoção predominante' },
      cta: { type: 'string', description: 'Call to action' },
      targeting: { type: 'string', description: 'Público-alvo identificado' },
      persuasion_structure: { type: 'string', description: 'Estrutura de persuasão (AIDA, PAS, etc.)' },
      angle: { type: 'string', description: 'Ângulo de abordagem' },
      offer_type: { type: 'string', description: 'Tipo de oferta (lead magnet, venda direta, etc.)' }
    },
    required: ['variante1', 'variante2', 'variante3', 'hook', 'promise', 'emotion', 'cta', 'targeting', 'persuasion_structure', 'angle', 'offer_type']
  }
};

/**
 * Extrai um campo string do input da tool, de forma defensiva.
 * Tolera o caso em que o modelo aninhou tudo em `variations`/`strategicAnalysis`
 * (objeto OU string JSON) em vez de devolver os campos no topo.
 */
function extractField(input: Record<string, unknown>, key: string): string {
  // 1) Campo direto no topo (caminho esperado com schema achatado)
  if (typeof input[key] === 'string') return input[key] as string;

  // 2) Fallback: procura dentro de variations/strategicAnalysis (objeto ou string JSON)
  for (const container of ['variations', 'strategicAnalysis']) {
    let obj = input[container];
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch { /* não era JSON */ }
    }
    if (obj && typeof obj === 'object' && typeof (obj as Record<string, unknown>)[key] === 'string') {
      return (obj as Record<string, string>)[key];
    }
  }
  return '';
}

/**
 * Gera 3 variações de copy + análise estratégica via Claude.
 *
 * @param originalCopy - Copy original extraído
 * @param niche - Nicho detectado
 * @param contextPrompt - Contexto adicional do nicho
 */
export async function generateCopyVariations(
  originalCopy: string,
  niche: string,
  contextPrompt: string = ''
): Promise<CopyGenerationResult> {
  try {
    log.info('CLAUDE', 'Iniciando geração de variações', { niche, copyLength: originalCopy.length });

    const userPrompt = `Nicho: ${niche}
${contextPrompt ? `Contexto do nicho: ${contextPrompt}\n` : ''}
Anúncio original:
"""
${originalCopy}
"""

Gere as 3 variações de copy e a análise estratégica chamando a ferramenta submit_ad_variations.`;

    const message = await getClient().messages.create(
      {
        model: COPY_MODEL,
        max_tokens: 3000,
        // System estável com cache_control → prompt caching (reaproveita o prefixo).
        system: [
          {
            type: 'text',
            text: COPY_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }
          }
        ],
        tools: [COPY_TOOL],
        tool_choice: { type: 'tool', name: 'submit_ad_variations' },
        messages: [{ role: 'user', content: userPrompt }]
      },
      { timeout: 40000 }
    );

    const toolBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );
    if (!toolBlock) {
      throw new Error('Claude não retornou tool_use (saída estruturada ausente)');
    }

    const input = toolBlock.input as Record<string, unknown>;
    const get = (key: string) => extractField(input, key);

    log.info('CLAUDE', 'Variações geradas com sucesso', {
      stopReason: message.stop_reason,
      cacheRead: message.usage.cache_read_input_tokens ?? 0,
      cacheWrite: message.usage.cache_creation_input_tokens ?? 0
    });

    return {
      variations: {
        variante1: get('variante1') || 'Erro ao gerar variante 1',
        variante2: get('variante2') || 'Erro ao gerar variante 2',
        variante3: get('variante3') || 'Erro ao gerar variante 3'
      },
      strategicAnalysis: {
        hook: get('hook') || 'N/A',
        promise: get('promise') || 'N/A',
        emotion: get('emotion') || 'N/A',
        cta: get('cta') || 'N/A',
        targeting: get('targeting') || 'N/A',
        persuasion_structure: get('persuasion_structure') || 'N/A',
        angle: get('angle') || 'N/A',
        offer_type: get('offer_type') || 'N/A'
      },
      isError: false
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('CLAUDE', 'Erro na geração de copy', errorMessage);

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
        targeting: 'Indisponível',
        persuasion_structure: 'Indisponível',
        angle: 'Indisponível',
        offer_type: 'Indisponível'
      },
      isError: true,
      errorMessage
    };
  }
}

/**
 * Valida se a geração foi bem-sucedida
 */
export function isCopyGenerationValid(result: CopyGenerationResult): boolean {
  return !result.isError &&
    !!result.variations.variante1 &&
    !!result.variations.variante2 &&
    !!result.variations.variante3;
}

// ---------- Classificação de nicho via Claude ----------
// A detecção por palavra-chave (lib/niche-detection) costuma dar 0 matches em
// anúncios reais → cai sempre em "geral". Classificar via LLM é muito mais robusto.
const NICHE_VALUES = [
  'emagrecimento',
  'estetica',
  'alimentacao',
  'igaming',
  'ecommerce',
  'renda_extra',
  'geral'
] as const;

const NICHE_TOOL: Anthropic.Tool = {
  name: 'classify_niche',
  description: 'Classifica o nicho/mercado do anúncio em UMA das categorias permitidas.',
  input_schema: {
    type: 'object',
    properties: {
      niche: {
        type: 'string',
        enum: [...NICHE_VALUES],
        description: 'A categoria que melhor descreve o anúncio. Use "geral" só se nenhuma outra encaixar.'
      }
    },
    required: ['niche']
  }
};

/**
 * Classifica o nicho do anúncio a partir do copy, via Claude Haiku.
 * Retorna uma das categorias de NICHE_VALUES (ou 'geral' em falha/indefinido).
 */
export async function classifyNiche(copy: string): Promise<string> {
  try {
    if (!copy || copy.trim().length < 10) return 'geral';

    const message = await getClient().messages.create(
      {
        model: 'claude-haiku-4-5',
        max_tokens: 50,
        tools: [NICHE_TOOL],
        tool_choice: { type: 'tool', name: 'classify_niche' },
        messages: [
          {
            role: 'user',
            content: `Classifique o nicho deste anúncio (pt-BR) em uma das categorias: emagrecimento, estetica (estética/beleza), alimentacao, igaming (apostas/cassino), ecommerce, renda_extra (ganhar dinheiro/trabalho online), geral.\n\nAnúncio:\n"""${copy.slice(0, 800)}"""`
          }
        ]
      },
      { timeout: 12000 }
    );

    const toolBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );
    const niche = (toolBlock?.input as { niche?: string })?.niche;

    if (niche && (NICHE_VALUES as readonly string[]).includes(niche)) {
      log.info('CLAUDE', 'Nicho classificado via Claude', { niche });
      return niche;
    }
  } catch (error: unknown) {
    log.warn('CLAUDE', 'Falha ao classificar nicho via Claude', error instanceof Error ? error.message : String(error));
  }
  return 'geral';
}
