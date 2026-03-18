/**
 * Mock Ad Data Generator - Fallback Inteligente para Apify
 * Fornece dados realistas quando Apify falha, mantendo a experiência do usuário
 *
 * Características:
 * - Detecção automática de nicho
 * - URLs de imagem reais (Unsplash/Pexels)
 * - Copy realista por nicho
 * - Logging interno para debugging
 */

export interface MockAdDataResult {
  copy: string;
  image: string;
  niche: string;
  isMock: boolean;
}

/**
 * Database com 5 nichos principais + cópias realistas
 * Cada nicho tem 3 variações para aleatoriedade
 */
const NICHE_DATABASE: Record<string, { copies: string[]; images: string[]; displayName: string }> = {
  "emagrecimento": {
    displayName: "Emagrecimento",
    copies: [
      "Perdi 15kg em 90 dias sem passar fome. Descobri um método que os nutricionistas querem guardar em segredo. Se você já tentou de tudo e nada funcionou, assista este vídeo curto (mas prepare-se: é bem direto).",
      "Mulheres acima de 35 estão perdendo 2kg por semana com este truque. Emagrecer ficou fácil! A indústria de emagrecimento gasta bilhões para que você NÃO saiba disso. Clique para descobrir a fórmula que está revolucionando o Brasil.",
      "Perdi peso e você também pode. Cansado de contar caloria, fazer sacrifício e não ver resultado? Tenho uma proposta diferente. Durante 30 dias, teste o protocolo que 87.432 pessoas já usaram para emagrecer. Se não gostar, seu dinheiro volta integral."
    ],
    images: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434628287857-20284db019fc?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1476480862245-c2951f1d2e2f?auto=format&fit=crop&q=80&w=800"
    ]
  },

  "renda_extra": {
    displayName: "Renda Extra",
    copies: [
      "Ganho R$5k/mês em casa, sem vender nada e sem deixar meu emprego. Não é aí de comissão de MLM. É um sistema que funciona mesmo quando estou dormindo. Vejo que muitos gostam disso quando mostro como funciona.",
      "Você pode estar ganhando R$2mil a R$7mil extra todo mês com apenas 15 minutos de trabalho por dia. Milhares de pessoas do Brasil, Portugal e dos EUA estão fazendo isso AGORA. Você vai ficar de fora?",
      "A forma tradicional de ganhar dinheiro está MORTA. Ganhe R$1mil a R$10mil enquanto você trabalha. Outras pessoas estão ganhando 20x mais em 2 horas usando este sistema digital. Descubra como entrar para este grupo seleto e aumentar sua renda."
    ],
    images: [
      "https://images.unsplash.com/photo-1533523666223-68a78f686f21?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800"
    ]
  },

  "igaming": {
    displayName: "iGaming",
    copies: [
      "Cassino online com melhor reputação. Ganhe prêmios maiores enquanto você estuda, trabalha ou dorme. Aqui é diferente, aqui você GANHA apostando com segurança. Saiba como dezenas de milhares estão aproveitando.",
      "O maior prêmio que você vai tirar do cassino é conhecimento. Aprenda as estratégias que os ganhadores usam em apostas. Bônus de boas-vindas de até R$2000 + rodadas grátis. Começe agora com um clique.",
      "Estou vendo muita gente perdendo dinheiro em cassinos errados. Viemos para mudar esse jogo de aposta. Segurança de nível 1, odds justas e pagamentos 100% confiáveis. Que tal testar um cassino melhor com a gente?"
    ],
    images: [
      "https://images.unsplash.com/photo-1553532173-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?auto=format&fit=crop&q=80&w=800"
    ]
  },

  "estetica": {
    displayName: "Estética",
    copies: [
      "Lifting facial sem cirurgia. Aquilo que você vê em mulheres de 45+ com pele de 25. Pois é, esse protocolo está deixando os dermatologistas em pânico. Em apenas 48 horas, você já vê a diferença.",
      "Suas amigas vão pensar que você fez cirurgia plástica. Mas na real, você apenas aplicou a técnica secreta coreana que as celebridades pagam fortunas para usar. Descubra como ter pele de porcelana com R$0 em procedimentos invasivos.",
      "Rugas, flacidez, acne pós-adulto... tem cura e não é cirurgia. Estética natural é possível. Confira como 34.000+ mulheres já transformaram sua aparência em apenas 30 dias usando nosso protocolo molecular."
    ],
    images: [
      "https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1596755094514-ff4df1ecfb7e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1556912988-2b80c6c8b0a1?auto=format&fit=crop&q=80&w=800"
    ]
  },

  "ecommerce": {
    displayName: "E-commerce",
    copies: [
      "Os melhores produtos do mundo, agora com envio para sua casa. Qualidade garantida ou seu dinheiro de volta em 30 dias. Frete grátis em compras acima de R$100. Vem aproveitar!",
      "Não acredita em qualidade? A gente também não acreditava. Até conhecer estes produtos. Hoje são a primeira coisa que nossos clientes reordenam. Aproveita a promoção de lançamento: 40% OFF em tudo.",
      "Cuidado com as fake. Aqui você tem produtos 100% original com certificado de autenticidade. Marca premium, preço imbatível. Seu estilo, sua vida, seus produtos. Compre agora e parele em 12x."
    ],
    images: [
      "https://images.unsplash.com/photo-1441986300974-11335f63f7ee?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1555694702871-5572146ce3f3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800"
    ]
  }
};

/**
 * Detecta o nicho baseado na URL do anúncio
 * Usa pattern matching simples para identificar keywords
 * IMPORTANTE: Ordem de verificação importa! Mais específico primeiro.
 */
function detectNicheFromUrl(adUrl: string): string {
  const url = adUrl.toLowerCase();

  // Ordem importa! Verificar mais específico primeiro para evitar falsos positivos
  // iGaming primeiro porque "aposta/cassino/gaming" são muito específicos
  if (["cassino", "aposta", "jogo", "bet", "poker", "slots", "roleta", "gaming", "igaming"].some(p => url.includes(p))) {
    return "igaming";
  }

  // Emagrecimento
  if (["emagrecer", "dieta", "peso", "perder", "fitness", "slim", "magro", "obesity", "emagrecimento"].some(p => url.includes(p))) {
    return "emagrecimento";
  }

  // Estética
  if (["beleza", "pele", "facial", "skincare", "lifting", "dermatol", "cosmetico", "estetica"].some(p => url.includes(p))) {
    return "estetica";
  }

  // E-commerce
  if (["loja", "shop", "store", "compre", "produto", "promo", "desconto", "venda", "ecommerce"].some(p => url.includes(p))) {
    return "ecommerce";
  }

  // Renda Extra (menos específico, verificar por último)
  if (["renda", "ganhar", "dinheiro", "online", "passiva", "lucro", "negocio"].some(p => url.includes(p))) {
    return "renda_extra";
  }

  return "geral"; // Fallback padrão
}

/**
 * Retorna um item aleatório de um array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Função Principal: getMockAdData
 *
 * @param adUrl - URL do anúncio para detectar nicho (opcional)
 * @param forcedNiche - Força um nicho específico em vez de detectar
 * @returns Mock data realista para o anúncio
 */
export function getMockAdData(
  adUrl?: string,
  forcedNiche?: string
): MockAdDataResult {
  // 1. Determinar qual nicho usar
  const detectedNiche = forcedNiche || (adUrl ? detectNicheFromUrl(adUrl) : "geral");

  // 2. Buscar dados do nicho no database
  const nicheData = NICHE_DATABASE[detectedNiche];

  if (!nicheData) {
    // Se nicho não encontrado, retorna padrão genérico
    console.log(`[FALLBACK MOCK] Nicho '${detectedNiche}' não encontrado. Usando padrão genérico.`);
    return {
      copy: "Você está deixando dinheiro na mesa. Descubra a estratégia que está transformando vidas. Clique agora e veja como funciona!",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
      niche: "geral",
      isMock: true
    };
  }

  // 3. Selecionar aleatoriamente uma copy e imagem do nicho
  const selectedCopy = getRandomItem(nicheData.copies);
  const selectedImage = getRandomItem(nicheData.images);

  // 4. Log interno para debugging (invisível ao usuário)
  console.log(
    `[FALLBACK MOCK] Gerando mock para nicho: ${nicheData.displayName} | URL detectada: ${adUrl || "N/A"}`
  );

  return {
    copy: selectedCopy,
    image: selectedImage,
    niche: detectedNiche,
    isMock: true
  };
}

/**
 * Função auxiliar para retornar todos os nichos disponíveis
 * Útil para testes e configuração
 */
export function getAvailableNiches(): Array<{ id: string; name: string }> {
  return Object.entries(NICHE_DATABASE).map(([id, data]) => ({
    id,
    name: data.displayName
  }));
}

/**
 * Função auxiliar para obter exemplos de dados de um nicho
 * Retorna todas as variações disponíveis
 */
export function getNicheExamples(nicho: string) {
  const data = NICHE_DATABASE[nicho];
  if (!data) return null;

  return {
    niche: nicho,
    displayName: data.displayName,
    examples: data.copies.map((copy, idx) => ({
      copy,
      image: data.images[idx]
    }))
  };
}
