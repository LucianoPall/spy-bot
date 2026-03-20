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
 * Database com 5 nichos principais + cópias REALISTAS (5-10 variações por nicho)
 * Cada copy tem 100-300 palavras com Hook + Promessa + CTA
 * Separado explicitamente por nicho
 */
const NICHE_DATABASE: Record<string, { copies: string[]; images: string[]; displayName: string }> = {
  "emagrecimento": {
    displayName: "Emagrecimento",
    copies: [
      "Perdi 15kg em 90 dias sem passar fome. Descobri um método que os nutricionistas querem guardar em segredo. Se você já tentou de tudo e nada funcionou, assista este vídeo curto (mas prepare-se: é bem direto). Meu marido não me reconheceu quando cheguei em casa. Ele pediu a senha do meu Facebook achando que tinha sido hackeado. Mas era eu mesmo, renovada. O que mudou? Não foi academia (odeio academia). Não foi dieta maluca (já tentei tudo). Foi um protocolo que NINGUÉM fala sobre. Os nutricionistas sabem, mas se você emagrecer rápido eles perdem cliente. Clique abaixo para descobrir o segredo que 47mil mulheres já usaram.",
      "Mulheres acima de 35 estão perdendo 2kg por semana com este truque simples. Emagrecer ficou fácil! A indústria de emagrecimento gasta bilhões para que você NÃO saiba disso. Ele é tão poderoso que foi proibido em 3 países. Você já parou para pensar que as celebridades sabem algo que você não sabe? Pois é. Todas as famosas estão usando este protocolo. Não é suplemento. Não é remédio. É uma combinação de ciência que FUNCIONA. Já testou e não funcionou? Então você estava fazendo errado. Deixa que a gente guia você passo a passo. Resultado em 48 horas ou seu dinheiro volta integral. Chega de sofrer com dietas que não funcionam.",
      "Perdi peso e você também pode. Cansado de contar caloria, fazer sacrifício e não ver resultado? Tenho uma proposta diferente para você. Durante 30 dias, teste o protocolo que 87.432 pessoas já usaram para emagrecer. Se não gostar, seu dinheiro volta integral. Sem perguntas. Sem burocracia. Sem culpa. Você já tentou tudo? Já gastou dinheiro com nutricionista, academia, suplemento caro? Chega. Agora é a sua vez de perder peso SEM sofrimento. Sem passar fome. Sem abrir mão daquele chocolatinho no final de semana.",
      "Método revolucionário: perca até 5kg no primeiro mês sem contar caloria. Pesquisa com 5.234 mulheres comprova: 93% viram resultado em 30 dias. A maioria nem precisou voltar à academia. O segredo que seus amigos não querem que você descubra. Todo dia alguém me pergunta 'como você emagreceu tão rápido?'. Decidi compartilhar com quem realmente quer mudar. Este protocolo foi desenvolvido por 3 fisiologistas de Harvard. Funciona porque trabalha COM seu corpo, não CONTRA. Inscreva-se hoje e receba o guia completo gratuitamente."
    ],
    images: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434628287857-20284db019fc?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1476480862245-c2951f1d2e2f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?auto=format&fit=crop&q=80&w=800"
    ]
  },

  "renda_extra": {
    displayName: "Renda Extra",
    copies: [
      "Ganho R$5k/mês em casa, sem vender nada e sem deixar meu emprego. Não é aquele negócio de comissão de MLM que todo mundo quer te meter. É um sistema que funciona mesmo quando estou dormindo. Vejo que muitos gostam disso quando mostro como funciona. A pergunta que não quer calar: por que você ainda está trabalhando 8 horas por dia ganhando um salário fixo quando poderia estar ganhando 5x mais trabalhando 2 horas? Não é ilusão. É real. Está acontecendo AGORA com milhares de pessoas. Você está deixando dinheiro na mesa enquanto estou aqui contando para você que existe uma forma mais fácil.",
      "Você pode estar ganhando R$2mil a R$7mil extra todo mês com apenas 15 minutos de trabalho por dia. Milhares de pessoas do Brasil, Portugal e dos EUA estão fazendo isso AGORA. Você vai ficar de fora? Imagine acordar, abrir o computador, responder 3 mensagens, e ganhar R$1k. Isso é possível. Enquanto você dorme, seu sistema está ganhando dinheiro. Já cansou de trocar tempo por dinheiro? Já cansou de se preocupar com contas no final do mês? Basta. Existe uma forma melhor.",
      "A forma tradicional de ganhar dinheiro está MORTA. Ganhe R$1mil a R$10mil enquanto você trabalha no seu emprego. Outras pessoas estão ganhando 20x mais em 2 horas usando este sistema digital. Descubra como entrar para este grupo seleto e aumentar sua renda exponencialmente. Não é trabalho. É um sistema. E sistemas trabalham 24 horas por dia. Os ricos sabem disso. Os pobres também. O diferencial agora é que você também pode saber."
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
      "Cassino online com melhor reputação. Ganhe prêmios maiores enquanto você estuda, trabalha ou dorme. Aqui é diferente, aqui você GANHA apostando com segurança. Saiba como dezenas de milhares estão aproveitando esta oportunidade. Você já tentou em outros cassinos e perdeu? Não era o cassino correto. Aqui você tem: odds justas, pagamento garantido, suporte 24/7. Bônus de boas-vindas de até R$2.000 + 50 rodadas grátis. Comece agora.",
      "O maior prêmio que você vai tirar do cassino é conhecimento. Aprenda as estratégias que os ganhadores usam em apostas. Bônus de boas-vindas de até R$2000 + rodadas grátis. Começe agora com um clique. Muita gente pensa que cassino é jogo de azar. Está ERRADO. Quem ganha sabe as estratégias. A gente ensina tudo isso. Gratuitamente.",
      "Estou vendo muita gente perdendo dinheiro em cassinos errados. Viemos para mudar esse jogo de aposta. Segurança de nível 1, odds justas e pagamentos 100% confiáveis. Que tal testar um cassino melhor com a gente? Primeira vez aqui? Ganhe R$100 de bônus só por se registrar."
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
      "Lifting facial sem cirurgia. Aquilo que você vê em mulheres de 45+ com pele de 25. Pois é, esse protocolo está deixando os dermatologistas em pânico. Em apenas 48 horas, você já vê a diferença. Não é creme. Não é máquina cara. É um protocolo que combina 3 técnicas que ninguém fala sobre. Mulheres estão pagando R$3.000 em clínicas de estética para fazer isso. Agora você pode fazer em casa por uma fração do preço. Rugas desaparecem. Flacidez some. Seu rosto fica dez anos mais jovem.",
      "Suas amigas vão pensar que você fez cirurgia plástica. Mas na real, você apenas aplicou a técnica secreta coreana que as celebridades pagam fortunas para usar. Descubra como ter pele de porcelana com R$0 em procedimentos invasivos. Kim Kardashian usa. Beyoncé usa. Agora você pode usar também. Resultado natural. Sem parecer artificial. Sem efeitos colaterais. Teste por 30 dias gratuitamente.",
      "Rugas, flacidez, acne pós-adulto... tem cura e não é cirurgia. Estética natural é possível. Confira como 34.000+ mulheres já transformaram sua aparência em apenas 30 dias usando nosso protocolo molecular. Dermatologistas certificados recomendam. Resultado garantido ou seu dinheiro volta. Sua pele vai te agradecer. Literalmente.",
      "Deixe de gastar R$5 mil com cirurgia plástica. Pelo mesmo preço você pode ter pele de 20 anos com este protocolo exclusivo. Sem dor. Sem cicatriz. Sem recuperação. Resultados GARANTIDOS em 48 horas ou dinheiro de volta. Centenas de mulheres já transformaram sua aparência. Agora é sua vez."
    ],
    images: [
      "https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1596755094514-ff4df1ecfb7e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1556912988-2b80c6c8b0a1?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b8d5?auto=format&fit=crop&q=80&w=800"
    ]
  },

  "ecommerce": {
    displayName: "E-commerce",
    copies: [
      "Os melhores produtos do mundo, agora com envio para sua casa. Qualidade garantida ou seu dinheiro de volta em 30 dias. Frete grátis em compras acima de R$100. Vem aproveitar! Aqui você encontra coisas que você não encontra em lugar nenhum. Importadas direto da fábrica. Sem intermediário. Sem markup gigante. Só qualidade. Só o melhor. Único lugar do Brasil que tem isto. Compre com segurança. Parele em até 12 vezes sem juros.",
      "Não acredita em qualidade? A gente também não acreditava. Até conhecer estes produtos. Hoje são a primeira coisa que nossos clientes reordenam. Aproveita a promoção de lançamento: 40% OFF em tudo. Estoque limitado. Apenas 234 unidades restantes. Depois que acabar, volta ao preço normal. Aproveita agora.",
      "Cuidado com as fake. Aqui você tem produtos 100% original com certificado de autenticidade. Marca premium, preço imbatível. Seu estilo, sua vida, seus produtos. Compre agora e parele em 12x. Garantia vitalícia em tudo. Qualidade que dura."
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
