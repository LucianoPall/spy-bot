// ============================================
// NICHE DETECTION SYSTEM v2 — Scoring + Keywords
// ============================================
// Centraliza lógica de detecção de nicho com scores de confiança
// Permite fallback inteligente e rastreamento de confiança

/**
 * Scores de confiança para cada nicho detectado
 * primary: nicho principal com maior confiança
 * secondary: nicho secundário alternativo (quando relevante)
 * keywords: palavras-chave encontradas que justificam a detecção
 */
export interface NicheScores {
  primary: {
    niche: string;
    confidence: number; // 0-1 (0.92 = 92% confiança)
  };
  secondary: {
    niche: string;
    confidence: number;
  } | null;
  keywords: string[]; // Palavras-chave encontradas
  source: 'url' | 'copy'; // Onde foi detectado
  debugInfo?: {
    urlMatches?: string[];
    copyMatches?: string[];
    totalMatches?: number;
    blockedNiches?: string[]; // Nichos que foram bloqueados
  };
}

// ============================================
// BANCO DE DADOS DE KEYWORDS POR NICHO
// ============================================
// Palavras-chave estratégicas para cada nicho
// Ordem: PT → EN → DE → ES → FR (multilíngue)
//
// ESTRATÉGIA CORRIGIDA:
// 1. Exclusive keywords BLOQUEIAM o nicho (confidence = 0)
// 2. Cada nicho tem seu próprio peso
// 3. Nichos concorrentes penalizam uns aos outros
// 4. Match count é MUITO importante — nichos com muitos keywords ganham

const NICHE_KEYWORDS: Record<string, {
  keywords: string[];
  weight?: number;
  exclusive?: string[];
  blockedBy?: string[]; // Nichos que este não pode ganhar contra
}> = {
  emagrecimento: {
    keywords: [
      // Português
      'emagrecer', 'emagreça', 'emagrecimento', 'perca quilos', 'perder peso', 'reduzir peso',
      'programa de emagrecimento', 'método emagrecedor', 'antes depois emagrecimento',
      'dieta para emagrecer', 'como emagrecer', 'dicas emagrecimento',
      // English
      'diet', 'weight loss', 'lose weight', 'weight loss program', 'diet plan',
      'how to lose weight', 'weight loss method', 'slim down',
      // Deutsch
      'abnehmen', 'gewichtsverlust', 'diät programm',
      // Español
      'bajar de peso', 'pérdida de peso', 'como bajar de peso',
      // Français
      'perte de poids', 'maigrir', 'programme minceur'
    ],
    weight: 1.0,
    // Bloqueado se estética ou iGaming aparecer FORTEMENTE
    blockedBy: ['estetica', 'igaming']
  },
  estetica: {
    keywords: [
      // Português
      'beleza', 'pele', 'facial', 'skincare', 'lifting', 'dermatol',
      'cosmetico', 'estetica', 'rugas', 'botox', 'rejuvenescimento',
      'clínica de estética', 'procedimento estético', 'tratamento de pele',
      'micropigmentação', 'harmonização', 'preenchimento', 'toxina botulínica',
      'laser', 'peeling', 'limpeza de pele', 'hydra facial', 'radiofrequência',
      'brilho', 'juventude', 'flacidez', 'envelhecimento', 'manchas',
      'cuidados com a pele', 'estético', 'embelezamento', 'correção',
      // English
      'beauty', 'skin-care', 'skincare', 'anti-aging', 'skin care',
      'dermatology', 'facial', 'wrinkles', 'cosmetic', 'lifting',
      'aesthetic', 'procedure', 'treatment', 'filler', 'botox injection',
      'laser treatment', 'rejuvenation', 'youthful', 'skin clinic',
      // Deutsch
      'hautpflege', 'gesichtspflege', 'schönheit', 'anti-aging', 'botox',
      'ästhetik', 'klinik', 'behandlung', 'falten',
      // Español
      'belleza', 'piel', 'facial', 'arrugas', 'anti-envejecimiento',
      'estética', 'tratamiento', 'relleno', 'clínica',
      // Français
      'beauté', 'peau', 'anti-âge', 'facial', 'dermatologie',
      'esthétique', 'traitement', 'clinique'
    ],
    weight: 1.3  // Prioridade MAIS ALTA que emagrecimento
  },
  alimentacao: {
    keywords: [
      // Português
      'receita', 'receitas', 'comida', 'culinaria', 'culinária', 'gastronomia', 'delivery',
      'restaurante', 'prato', 'culinario', 'culinário', 'cozinha', 'chef',
      'alimento', 'refeição', 'prato pronto',
      // English
      'recipe', 'food', 'cooking', 'cuisine', 'chef', 'restaurant',
      'meal', 'culinary', 'gastronomy', 'dish', 'cook',
      // Deutsch
      'rezepte', 'essen', 'kochen', 'küche', 'chef', 'restaurant',
      'lebensmittel', 'gericht', 'gastronomie',
      // Español
      'receta', 'comida', 'cocina', 'chef', 'restaurante',
      'plato', 'gastronomía', 'chef',
      // Français
      'recette', 'cuisine', 'gastronomie', 'chef', 'restaurant'
    ],
    weight: 1.0
  },
  igaming: {
    keywords: [
      // Português
      'cassino', 'aposta', 'jogo', 'bet', 'poker', 'slots',
      'roleta', 'gaming', 'igaming', 'apostas', 'bingo', 'loteria',
      // English
      'casino', 'gambling', 'poker', 'slots', 'bet', 'betting',
      'gaming', 'igaming', 'blackjack', 'roulette', 'lottery',
      // Deutsch
      'spielen', 'wetten', 'spiel', 'casino', 'poker', 'slots',
      'glücksspiel', 'kasinospiel',
      // Español
      'casino', 'apuesta', 'poker', 'tragaperras', 'juego',
      'apuestas', 'juego de azar',
      // Français
      'casino', 'pari', 'jeu', 'poker', 'machines à sous'
    ],
    weight: 1.0
  },
  ecommerce: {
    keywords: [
      // Português
      'loja', 'shop', 'compre', 'promo', 'desconto',
      'venda', 'ecommerce', 'shopping', 'compra', 'oferta',
      // English
      'shop', 'store', 'buy', 'purchase', 'sale',
      'discount', 'ecommerce', 'shopping', 'offer', 'deal',
      // Deutsch
      'versand', 'rabatt', 'laden', 'kaufen',
      'online shop', 'ecommerce',
      // Español
      'tienda', 'compra', 'rebaja', 'oferta',
      'descuento', 'venta',
      // Français
      'boutique', 'achat', 'réduction', 'vente'
    ],
    weight: 1.0
  },
  renda_extra: {
    keywords: [
      // Português
      'renda', 'ganhar dinheiro', 'dinheiro', 'online', 'passiva',
      'lucro', 'negocio', 'rendimento', 'renda extra', 'freelancer',
      // English
      'earn money', 'income', 'make money', 'passive', 'business',
      'online income', 'side hustle', 'earnings', 'profit',
      // Deutsch
      'geld verdienen', 'einkommen', 'online verdienen', 'nebeneinkommen',
      // Español
      'ganar dinero', 'dinero', 'ingreso', 'negocio', 'pasiva',
      // Français
      'gagner argent', 'revenu', 'business', 'passif'
    ],
    weight: 1.1
  },
  geral: {
    keywords: [
      // Fallback genérico — sempre match com qualquer coisa
      'serviço', 'empresa', 'negócio', 'solução',
      'service', 'solution', 'business'
    ],
    weight: 0.2 // Peso MUITO baixo — fallback apenas
  }
};

// ============================================
// FUNÇÃO PRINCIPAL: Detectar Nicho com Scores
// ============================================
/**
 * Analisa URL + copy e retorna scores de confiança para cada nicho
 * Com fallback inteligente para nicho secundário
 *
 * @param url - URL do anúncio
 * @param copy - Texto do anúncio
 * @returns NicheScores com primary, secondary e keywords encontrados
 */
export function detectNicheWithScores(url: string = '', copy: string = ''): NicheScores {
  const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
  const textForAnalysis = `${url.toLowerCase()} ${copy.toLowerCase()}`;

  // Contador de matches por nicho
  const nicheScores: Record<string, { matches: number; keywords: string[] }> = {};
  const nicheMatches: Record<string, boolean> = {}; // Rastreia se o nicho tem ALGUM match

  // Inicializar contadores
  for (const niche of Object.keys(NICHE_KEYWORDS)) {
    nicheScores[niche] = { matches: 0, keywords: [] };
    nicheMatches[niche] = false;
  }

  // Varrer por cada keyword em cada nicho
  for (const [niche, { keywords }] of Object.entries(NICHE_KEYWORDS)) {
    for (const keyword of keywords) {
      // Usar word boundaries para evitar falsos positivos
      // Escapar caracteres especiais na regex
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      const matchCount = (textForAnalysis.match(regex) || []).length;

      if (matchCount > 0) {
        nicheScores[niche].matches += matchCount;
        nicheScores[niche].keywords.push(keyword);
        nicheMatches[niche] = true; // Marcou este nicho como tendo matches
      }
    }
  }

  if (isDev) console.log('[NICHE-DETECTION] Raw match counts:', Object.fromEntries(
    Object.entries(nicheScores).map(([k, v]) => [k, v.matches])
  ));

  // NOVA LÓGICA: Nicho com blockedBy não pode ganhar se seu bloqueador tem matches
  const blockedNiches: string[] = [];
  for (const [niche, config] of Object.entries(NICHE_KEYWORDS)) {
    if (!config.blockedBy || nicheScores[niche].matches === 0) continue;

    // Este nicho tem matches
    for (const blockerNiche of config.blockedBy) {
      // Se o nicho bloqueador TAMBÉM tem matches, bloquear este nicho
      if (nicheMatches[blockerNiche]) {
        blockedNiches.push(niche);
        console.log(`[NICHE-DETECTION] ⚠️ Nicho "${niche}" bloqueado porque "${blockerNiche}" também tem matches`);
        break; // Já foi adicionado, sair do loop
      }
    }
  }

  // Calcular confiança — APENAS para nichos não bloqueados
  const confidences: Record<string, number> = {};
  const maxMatches = Math.max(...Object.values(nicheScores).map(s => s.matches), 1);

  for (const [niche, { matches }] of Object.entries(nicheScores)) {
    // Se nicho está bloqueado, sua confiança é 0
    if (blockedNiches.includes(niche)) {
      confidences[niche] = 0;
      continue;
    }

    // Se não tem matches, confiança é 0
    if (matches === 0) {
      confidences[niche] = 0;
      continue;
    }

    // Fórmula: (matches / maxMatches) * weight, clampado a 1.0
    const weight = NICHE_KEYWORDS[niche]?.weight || 1.0;
    confidences[niche] = Math.min(1.0, (matches / maxMatches) * weight);
  }

  // Ordenar nichos por confiança DECRESCENTE
  const sortedNiches = Object.entries(confidences)
    .sort(([, a], [, b]) => b - a);

  const [primaryNiche, primaryConfidence] = sortedNiches[0] || ['geral', 0];
  const [secondaryNiche, secondaryConfidence] = sortedNiches[1] || ['geral', 0];

  if (isDev) console.log('[NICHE-DETECTION] Final confidences:', Object.fromEntries(
    Object.entries(confidences).map(([k, v]) => [k, Math.round(v * 100)])
  ));

  // Determinar fonte de detecção
  const urlKeywords = extractKeywordsFromText(url.toLowerCase());
  const copyKeywords = extractKeywordsFromText(copy.toLowerCase());
  const source = urlKeywords.length >= copyKeywords.length ? 'url' : 'copy';

  // Garantir que "geral" não é primary se houver algo melhor
  let finalPrimary = primaryNiche;
  let finalPrimaryConfidence = primaryConfidence;

  if (primaryNiche === 'geral' && primaryConfidence < 0.3 && secondaryConfidence > 0.3) {
    finalPrimary = secondaryNiche;
    finalPrimaryConfidence = secondaryConfidence;
  }

  // Se tudo falhou (todos nichos têm 0), retornar "geral" com confiança baixa
  if (finalPrimaryConfidence === 0) {
    finalPrimary = 'geral';
    finalPrimaryConfidence = 0.1;
  }

  // Retornar resultado estruturado
  // Garantir que palavras-chave principais do nicho estejam incluídas
  const foundKeywords = Array.from(new Set(nicheScores[finalPrimary].keywords));
  const nicheNameAsKeyword = finalPrimary; // Use o nome do nicho como keyword principal

  // Inserir o nome do nicho se não estiver já presente nos keywords encontrados
  if (!foundKeywords.includes(nicheNameAsKeyword)) {
    foundKeywords.unshift(nicheNameAsKeyword);
  }

  return {
    primary: {
      niche: finalPrimary,
      confidence: Math.min(1.0, Math.round(finalPrimaryConfidence * 100) / 100)
    },
    secondary: (secondaryConfidence > 0.2 && secondaryNiche !== finalPrimary) ? {
      niche: secondaryNiche,
      confidence: Math.min(1.0, Math.round(secondaryConfidence * 100) / 100)
    } : null,
    keywords: foundKeywords.slice(0, 5),
    source,
    debugInfo: {
      urlMatches: urlKeywords,
      copyMatches: copyKeywords,
      totalMatches: Object.values(nicheScores).reduce((sum, s) => sum + s.matches, 0),
      blockedNiches
    }
  };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Extrai keywords encontrados em um texto
 */
function extractKeywordsFromText(text: string): string[] {
  const found: string[] = [];

  for (const { keywords } of Object.values(NICHE_KEYWORDS)) {
    for (const keyword of keywords) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      if (regex.test(text)) {
        found.push(keyword);
      }
    }
  }

  return Array.from(new Set(found));
}

/**
 * Detectar apenas pelo URL (compatibilidade com código legado)
 */
export function detectNicheFromUrl(url: string): string {
  const scores = detectNicheWithScores(url, '');
  return scores.primary.niche;
}

/**
 * Detectar apenas pelo copy (compatibilidade com código legado)
 */
export function detectNicheFromCopy(copy: string): string {
  const scores = detectNicheWithScores('', copy);
  return scores.primary.niche;
}

/**
 * Retorna confiança em porcentagem (útil para logging)
 */
export function getNicheConfidencePercentage(scores: NicheScores): number {
  return Math.round(scores.primary.confidence * 100);
}

/**
 * Retorna nome do nicho em formato legível (PT-BR)
 */
export function getNicheDisplayName(niche: string): string {
  const names: Record<string, string> = {
    emagrecimento: 'Emagrecimento',
    estetica: 'Estética',
    alimentacao: 'Alimentação',
    igaming: 'iGaming',
    ecommerce: 'E-commerce',
    renda_extra: 'Renda Extra',
    geral: 'Geral'
  };
  return names[niche] || 'Desconhecido';
}

/**
 * Validar se a confiança é aceitável
 * @param scores - Scores do nicho
 * @param minConfidence - Confiança mínima aceitável (default: 0.4)
 * @returns true se confiança >= minConfidence
 */
export function isNicheConfident(
  scores: NicheScores,
  minConfidence: number = 0.4
): boolean {
  return scores.primary.confidence >= minConfidence;
}
