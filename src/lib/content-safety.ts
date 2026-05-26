/**
 * Content Safety — Filtro de Conteúdo Adulto
 *
 * Bloqueia anúncios adultos/pornográficos antes de processar. Protege:
 * - Usuários iniciantes que podem clonar sem saber e perder a conta Facebook
 * - Contas OpenAI/Apify que podem ser bloqueadas por content policy
 * - O próprio AdClone de exposição jurídica/reputacional
 *
 * Estratégia: match de keywords fortes/fracas + domínios conhecidos.
 * Falso-positivo é preferível a falso-negativo — preferimos bloquear ad
 * legítimo e pedir contato do que passar conteúdo adulto.
 */

export interface ContentSafetyCheck {
  blocked: boolean;
  reason?: 'strong_keyword' | 'known_domain' | 'suspicious_pattern';
  matches: string[]; // Keywords/domínios que bateram (pra auditoria/logs)
}

/**
 * Keywords FORTES — presença única já basta pra bloquear.
 * Baixíssimo risco de falso-positivo (essas palavras raramente aparecem
 * fora de contexto adulto).
 */
const STRONG_ADULT_KEYWORDS = [
  // Português
  'putaria', 'pornô', 'porno', 'pornografia', 'pornografico', 'pornográfico',
  'nudes', 'masturbação', 'masturbacao', 'orgasmo', 'orgasmica',
  'penetração', 'penetracao', 'ejaculação', 'ejaculacao',
  'sexo explícito', 'sexo explicito', 'conteúdo +18', 'conteudo +18', 'apenas +18',
  'safadinha', 'safadinho', 'putinha', 'putinho',
  'fodendo', 'trepada', 'chupar pica', 'chupando pica',
  'acompanhante de luxo', 'garota de programa', 'massagem erótica', 'massagem erotica',
  'swing', 'swinger', 'fetiche sexual', 'bdsm', 'dominação sexual',
  'vídeos íntimos', 'videos intimos', 'vídeo íntimo vazado', 'video intimo vazado',
  'tesão', 'tesao', 'gozando', 'gozada',

  // English
  'porn', 'porno', 'pornhub', 'xvideos', 'xnxx', 'xxx',
  'onlyfans', 'fansly', 'camgirl', 'cam girl', 'camboy', 'cam boy',
  'nude photos', 'nude pics', 'naked girls', 'naked boys',
  'escort service', 'escort girls',
  'hentai', 'rule34',
  'masturbation', 'orgasm', 'blowjob', 'handjob',
  'anal sex', 'oral sex', 'hardcore sex',
  'explicit content', 'adult content', 'nsfw content',

  // Español
  'porno', 'pornografía', 'desnudas', 'desnudos', 'prostituta',
];

/**
 * Keywords FRACAS — sozinhas não bloqueiam (podem ter uso legítimo),
 * mas 2+ juntas OU combinadas com domínio suspeito → bloqueia.
 * Ex: "secret recipe" (ok), "hot deal" (ok) — mas "hot secret nude" (bloqueia).
 */
const WEAK_ADULT_KEYWORDS = [
  // Português
  'sedução', 'seducao', 'pegação', 'pegacao',
  'gostosa', 'gostoso', 'safada', 'safado',
  'conquistar mulheres', 'conquistar homens',
  'pegar mulher', 'pegar homem',
  'intimidade no casamento', 'apimentar relação', 'apimentar relacao',
  'sexualidade', 'libido', 'vigor sexual', 'performance sexual',
  'ereção', 'erecao', 'disfunção erétil', 'disfuncao eretil',
  '+18', 'maiores de 18', 'apenas adultos',

  // English
  'seduce', 'seduction', 'pickup artist',
  'hot girls', 'hot women', 'horny',
  'adult only', '18+ only', 'nsfw',
  'erection', 'erectile', 'sexual performance',
];

/**
 * Domínios EXPLÍCITOS conhecidos — presença na URL bloqueia imediatamente.
 */
const KNOWN_ADULT_DOMAINS = [
  // Porn tubes
  'xvideos.com', 'xvideos', 'xnxx.com', 'xnxx',
  'pornhub.com', 'pornhub', 'xhamster.com', 'xhamster',
  'redtube.com', 'redtube', 'youporn.com', 'youporn',
  'brazzers.com', 'brazzers', 'spankbang.com',
  'eporner.com', 'tube8.com', 'tnaflix.com',

  // Cam sites
  'chaturbate.com', 'chaturbate', 'livejasmin.com', 'livejasmin',
  'stripchat.com', 'cam4.com', 'bongacams.com', 'myfreecams.com',

  // Fan sites
  'onlyfans.com', 'onlyfans', 'fansly.com', 'fansly',
  'just4fans.com', 'fancentro.com',

  // Escort/personal
  'seekingarrangement.com', 'ashleymadison.com', 'adultfriendfinder.com',

  // Hentai
  'nhentai.net', 'nhentai', 'hanime.tv', 'e-hentai.org',

  // Domínios de VSL adulto BR conhecidos (adicionar conforme descobertos)
  'secretof.online',
];

/**
 * Padrões de domínio SUSPEITOS — não bloqueiam sozinhos, mas
 * combinados com keywords fracas aumentam a suspeita.
 * Cuidado: palavras como "secret" também aparecem em ads legítimos.
 */
const SUSPICIOUS_DOMAIN_PATTERNS = [
  /\bsecretof\b/i,
  /\bprivadinho/i,
  /\bvipgirl/i,
  /\bgostosa/i,
  /\bsafad[ao]/i,
  /\bputinh[ao]/i,
  /\bproibid[ao]/i,
  /\bfetiche/i,
  /\.xxx\b/i,
  /\.adult\b/i,
  /\.porn\b/i,
  /\.sex\b/i,
];

/**
 * Normaliza texto pra match: lowercase + remove acentos básicos + colapsa espaços.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se um texto contém qualquer keyword da lista.
 * Match com word boundaries pra evitar falso-positivo (ex: "sex" não bate em "sextant").
 */
function matchKeywords(text: string, keywords: string[]): string[] {
  const normalized = normalize(text);
  const hits: string[] = [];

  for (const kw of keywords) {
    const normKw = normalize(kw);
    // Pra keywords com espaço, usa includes (frases multi-palavra)
    // Pra keywords sem espaço, usa word boundary
    if (normKw.includes(' ')) {
      if (normalized.includes(normKw)) hits.push(kw);
    } else {
      const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'i');
      if (re.test(normalized)) hits.push(kw);
    }
  }

  return hits;
}

/**
 * Verifica se URL bate com domínio adulto conhecido.
 */
function matchKnownDomain(url: string): string[] {
  if (!url) return [];
  const normalized = normalize(url);
  return KNOWN_ADULT_DOMAINS.filter(d => normalized.includes(d));
}

/**
 * Verifica padrões suspeitos de domínio.
 */
function matchSuspiciousPattern(url: string): string[] {
  if (!url) return [];
  const hits: string[] = [];
  for (const re of SUSPICIOUS_DOMAIN_PATTERNS) {
    const m = url.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

/**
 * Função principal: verifica se um conjunto de dados de anúncio
 * deve ser bloqueado por conteúdo adulto.
 *
 * Uso:
 *   // Camada 1 — só URL (antes do Apify)
 *   detectAdultContent({ url: adUrl })
 *
 *   // Camada 2 — URL + copy (após Apify)
 *   detectAdultContent({ url: adUrl, copy: originalCopy })
 */
export function detectAdultContent(input: {
  url?: string | null;
  copy?: string | null;
}): ContentSafetyCheck {
  const url = input.url || '';
  const copy = input.copy || '';
  const combinedText = `${url} ${copy}`;

  // 1. Domínio conhecido em QUALQUER lugar (URL ou copy) → bloqueio imediato
  // Apify às vezes devolve o domínio de destino dentro do copy (não só no url).
  const domainHits = matchKnownDomain(combinedText);
  if (domainHits.length > 0) {
    return {
      blocked: true,
      reason: 'known_domain',
      matches: domainHits,
    };
  }

  // 2. Keyword forte em qualquer lugar → bloqueio imediato
  const strongHits = matchKeywords(combinedText, STRONG_ADULT_KEYWORDS);
  if (strongHits.length > 0) {
    return {
      blocked: true,
      reason: 'strong_keyword',
      matches: strongHits,
    };
  }

  // 3. Padrão suspeito de domínio + 1 keyword fraca → bloqueia
  // OU 2+ keywords fracas juntas → bloqueia
  const suspiciousHits = matchSuspiciousPattern(url);
  const weakHits = matchKeywords(combinedText, WEAK_ADULT_KEYWORDS);

  if (
    (suspiciousHits.length > 0 && weakHits.length >= 1) ||
    weakHits.length >= 2
  ) {
    return {
      blocked: true,
      reason: 'suspicious_pattern',
      matches: [...suspiciousHits, ...weakHits],
    };
  }

  return { blocked: false, matches: [] };
}

/**
 * Mensagem educativa padrão pro usuário final (response body).
 */
export const ADULT_CONTENT_BLOCK_MESSAGE = {
  error: 'ADULT_CONTENT_BLOCKED' as const,
  message:
    'Este anúncio foi identificado como conteúdo adulto e não é suportado pelo AdClone. ' +
    'Isso é uma proteção para você: o Facebook bane contas que publicam esse tipo de conteúdo, ' +
    'e as IAs que geram variações (OpenAI/DALL-E) também recusam esse tipo de material.',
  suggestion:
    'Experimente clonar anúncios de nichos aprovados: emagrecimento, estética, alimentação, ' +
    'e-commerce, renda extra ou marketing digital.',
  allowedNiches: [
    'emagrecimento',
    'estetica',
    'alimentacao',
    'igaming',
    'ecommerce',
    'renda_extra',
    'geral',
  ],
};
