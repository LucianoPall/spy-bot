// ============================================
// NICHE-SPECIFIC PROMPTS para GPT-4o
// ============================================
// Prompts contextualizados que exploram drivers emocionais específicos
// de cada nicho para melhorar qualidade das copies geradas

/**
 * Instruções de prompt por nicho
 * Cada nicho tem contexto emocional, estrutura e abordagem diferentes
 */
export const nichePrompts: Record<string, string> = {
  emagrecimento: `
🎯 CONTEXTO DO NICHO: EMAGRECIMENTO

DRIVERS EMOCIONAIS PRIMÁRIOS:
- Transformação visual (espelho, fotos antes/depois)
- Urgência temporal (praia, casamento, reunião)
- Auto-estima e aceitação social
- Cansaço com falhas anteriores (frustração acumulada)
- Esperança em "método revolucionário"

ESTRUTURA RECOMENDADA:
1. Hook: Questionar identidade atual ou evocar dor específica
   Exemplo: "Você já tentou tudo e nada funciona?"
2. Agitação: Amplificar o custo emocional/social do problema
   Exemplo: "Enquanto você espera, suas amigas estão em biquíni..."
3. Solução: Método específico, não genérico (dieta, app, cirurgia)
4. Prova: Antes/depois, depoimento de celebridade, ciência

PALAVRAS-CHAVE IMPACTANTES:
emagrecer rápido, perder peso, transformação, sem academia,
em casa, fórmula, protocolo, científico, comprovado, natural

TOM DE VOZ:
- Urgente mas compassivo (não judgmental)
- Informado (usa termos como "metabolismo", "calorias")
- Esperançoso (possibilidade de mudança)
- Prático (dicas que funcionam agora)

COPY DEVE TER:
✓ Foco em TRANSFORMAÇÃO VISUAL
✓ Menção de URGÊNCIA (seasonal, temporal)
✓ Uma DOR ESPECÍFICA (não genérica)
✓ Uma SOLUÇÃO CLARA (método, produto, app)
✓ PROVA SOCIAL (depoimento, resultado, número)
✗ Promessas irreais (30kg em 1 mês)
✗ Medicamentos (sem comprovação científica)
✗ "Milagre" ou "segredo"
`,

  estetica: `
🎯 CONTEXTO DO NICHO: ESTÉTICA E BELEZA

DRIVERS EMOCIONAIS PRIMÁRIOS:
- Envelhecimento (rugas, manchas, flacidez)
- Vaidade e autoestima (aparecer bem)
- Comparação social (Instagram, celebridades)
- Medo de parecer "velha" ou "feia"
- Desejo de confiança (se sentir bonita)

ESTRUTURA RECOMENDADA:
1. Hook: Reflexo no espelho, comparação
   Exemplo: "Quando você se olha no espelho, o que vê?"
2. Agitação: Validar a dor (rugas NÃO são normais, dá pra tratar)
3. Solução: Procedimento, produto, tratamento específico
4. Prova: Foto antes/depois, dermatologista, resultados comprovados

PALAVRAS-CHAVE IMPACTANTES:
rejuvenescimento, anti-aging, rugas, pele radiante, brilho,
lifting, tonificar, revitalizar, profissional, clínico, aprovado

TOM DE VOZ:
- Sofisticado (premium, não barato)
- Confiante (você PODE se recuperar)
- Científico (dermatologia, ingredientes, protocolo)
- Inclusivo (todos merecem se sentir bonitos)

COPY DEVE TER:
✓ Foco em REJUVENESCIMENTO / RADIANCE
✓ Validação da dor (rugas são reais, dá pra tratar)
✓ Credibilidade científica (ingredientes, dermatologista)
✓ Resultado visual (antes/depois, fotoprova)
✓ Segurança (aprovado, testado, sem efeitos colaterais)
✗ Promessas de "20 anos mais jovem"
✗ Milagre instantâneo
✗ Sem comprovação científica
`,

  alimentacao: `
🎯 CONTEXTO DO NICHO: ALIMENTAÇÃO / GASTRONOMIA

DRIVERS EMOCIONAIS PRIMÁRIOS:
- Prazer (comida é diversão, não apenas nutrição)
- Conveniência (preguiça de cozinhar)
- Saúde (consciência do que se come)
- Experiência gastronômica (Instagram-worthy)
- Tempo (vidas ocupadas, quer comer rápido)

ESTRUTURA RECOMENDADA:
1. Hook: Questionar hábito atual (você come bem?)
2. Agitação: Contraste entre fast-food vs. comida de verdade
3. Solução: Receita, app, serviço de delivery, ingredientes
4. Prova: Fotos apetitosas, chef conhecido, reviews

PALAVRAS-CHAVE IMPACTANTES:
receita, gourmet, saudável, fresco, orgânico, chef,
experiência, sabor, ingredientes, pronto em minutos, delivery

TOM DE VOZ:
- Apetitoso (visual, sensorial)
- Inspirador (você consegue cozinhar assim)
- Educador (aprenda técnicas novas)
- Caseiro (acessível, não precisa ser chef)

COPY DEVE TER:
✓ Foco em EXPERIÊNCIA / SABOR
✓ Fotos/vídeos apetitosos (descrição visual)
✓ Facilidade (não precisa ser complicado)
✓ Valor nutricional (se relevante)
✓ Acessibilidade (receita simples, ingredientes baratos)
✗ Jargão excessivo
✗ Fotos ruins / pouco apetitosas
✗ Receitas muito complexas
`,

  igaming: `
🎯 CONTEXTO DO NICHO: iGAMING (CASSINO / APOSTAS)

DRIVERS EMOCIONAIS PRIMÁRIOS:
- Adrenalina (risco, emoção, suspense)
- Ganho rápido (fortuna de forma fácil)
- Exclusão social (VIP, selecionado)
- Controle (estratégia, skill vs. sorte)
- Escapismo (diversão, distração)

ESTRUTURA RECOMENDADA:
1. Hook: Chance de ganho, emoção
   Exemplo: "Você poderia ganhar em minutos..."
2. Agitação: FOMO - amigos ganhando enquanto você não joga
3. Solução: Plataforma segura, bônus, jogos específicos
4. Prova: Vencedor recente, prêmio grande, credibilidade

PALAVRAS-CHAVE IMPACTANTES:
ganhe, bônus, free spin, jackpot, sorte, estratégia,
jogo seguro, confiável, rápido, altos ganhos, exclusivo

TOM DE VOZ:
- Emocionante (adrenalina)
- Inclusivo (todos podem ganhar)
- Seguro (operadora confiável)
- Rápido (ação imediata)

COPY DEVE TER:
✓ Foco em EMOÇÃO / ADRENALINA
✓ Bônus claro (primeira jogada grátis, multiplicador)
✓ Segurança (licenciado, confiável)
✓ Menção de GANHO POSSÍVEL (sem garantias falsas)
✓ Chamada de ação urgente (aproveite agora)
✗ Promessas de ganho garantido
✗ Apelo a menores de idade
✗ Ocultação de riscos
✗ Publicidade enganosa
`,

  ecommerce: `
🎯 CONTEXTO DO NICHO: E-COMMERCE / COMPRAS

DRIVERS EMOCIONAIS PRIMÁRIOS:
- Conveniência (entrega em casa)
- Economia (desconto, economia)
- Descoberta (novos produtos)
- Satisfação (desempacotar, receber)
- Confiança (produto original, garantia)

ESTRUTURA RECOMENDADA:
1. Hook: Problema resolvido (item que faltava)
2. Agitação: Escassez (estoque limitado, promoção acaba)
3. Solução: Produto específico, preço, frete grátis
4. Prova: Reviews, avaliações, unboxing, celebridade

PALAVRAS-CHAVE IMPACTANTES:
desconto, promoção, frete grátis, estoque limitado,
melhor preço, original, garantia, avaliações,
entrega rápida, novidade, exclusivo

TOM DE VOZ:
- Prestativo (ajuda a encontrar o que procura)
- Econômico (ótimo custo-benefício)
- Confiável (original, seguro, com garantia)
- Entusiasmado (novo, incrível)

COPY DEVE TER:
✓ Foco em BENEFÍCIO PRÁTICO
✓ Preço claro (desconto, promoção)
✓ Frete/entrega (grátis, rápida)
✓ Garantia / confiança (reviews, avaliações)
✓ Escassez (estoque limitado, válido por X dias)
✗ Preço escondido
✗ Reviews fake
✗ Descrição imprecisa do produto
`,

  renda_extra: `
🎯 CONTEXTO DO NICHO: RENDA EXTRA / NEGÓCIO

DRIVERS EMOCIONAIS PRIMÁRIOS:
- Liberdade financeira (sair da 9-5)
- Segurança econômica (dinheiro extra)
- Independência (ser seu próprio chefe)
- Realização (construir algo)
- Escape do fracasso (alternativa ao emprego)

ESTRUTURA RECOMENDADA:
1. Hook: Situação financeira difícil
   Exemplo: "Seu salário não está rendendo, certo?"
2. Agitação: Custo de NÃO agir (contas acumulando, dívida)
3. Solução: Método específico (dropshipping, freelancer, app)
4. Prova: Estudo de caso (João ganhou R$5k/mês), números, resultados

PALAVRAS-CHAVE IMPACTANTES:
ganhar dinheiro, renda passiva, flexível, em casa,
enquanto dorme, escalável, sem investimento, comprovado,
lucro, crescimento, liberdade financeira

TOM DE VOZ:
- Esperançoso (é possível, outras pessoas conseguiram)
- Prático (aqui estão os passos concretos)
- Realista (não é rápido, mas é possível)
- Motivador (você consegue)

COPY DEVE TER:
✓ Foco em LIBERTAÇÃO / INDEPENDÊNCIA
✓ Método claro (não vago, "sistema secreto")
✓ Resultado real (caso de sucesso, números)
✓ Facilidade de entrada (baixa barreira, não precisa de capital)
✓ Escalabilidade (pode crescer)
✗ Promessa de "ganho fácil/rápido"
✗ "Segredo" ou "fórmula oculta"
✗ Gráficos fraudulentos
✗ Linguagem de pirâmide
`,

  geral: `
🎯 CONTEXTO DO NICHO: GERAL (FALLBACK)

DRIVERS EMOCIONAIS PRIMÁRIOS:
- Benefício claro (o que você ganha)
- Dor / problema (o que resolve)
- Confiança (por que acreditar)
- Urgência (por que AGORA)
- Facilidade (fácil de usar/comprar)

ESTRUTURA RECOMENDADA:
1. Hook: Questão provocativa ou dor imediata
2. Agitação: Amplificar a dor, validar emoções
3. Solução: O que exatamente você oferece
4. Prova: Depoimento, resultado, credibilidade

PALAVRAS-CHAVE IMPACTANTES:
solução, benefício, resultado, comprovado, fácil,
rápido, seguro, garantido, melhor, qualidade

TOM DE VOZ:
- Claro (sem jargão desnecessário)
- Confiante (você resolveu o problema)
- Amigável (conversa, não venda)
- Prático (ação concreta)

COPY DEVE TER:
✓ Foco em RESULTADO / BENEFÍCIO
✓ Uma DÚVIDA específica resolvida
✓ Credibilidade (dados, experts, testes)
✓ Chamada de ação clara
✗ Promessas irreais
✗ Muita informação (confunde)
✗ Sem diferencial
`
};

/**
 * Obter prompt contextualizado para um nicho
 * @param niche - Nicho detectado (ex: "emagrecimento")
 * @returns Instruções contextualizadas para melhorar a copy
 */
export function getNichePromptContext(niche: string): string {
  return nichePrompts[niche] || nichePrompts['geral'];
}

/**
 * Integrar contexto de nicho no system prompt GPT-4o
 * Melhora qualidade da reengenharia de copy
 *
 * @param niche - Nicho detectado
 * @param originalSystemPrompt - Prompt original do sistema
 * @returns Prompt melhorado com contexto de nicho
 */
export function integrateNicheContext(
  niche: string,
  originalSystemPrompt: string
): string {
  const nicheContext = getNichePromptContext(niche);

  return `${originalSystemPrompt}

${nicheContext}

INSTRUÇÃO CRÍTICA: As 3 copies DEVEM estar em tom apropriado para ${niche.toUpperCase()}.`;
}

/**
 * Retorna drivers emocionais específicos do nicho
 * Útil para análise estratégica
 */
export function getNicheEmotionalDrivers(niche: string): string[] {
  const drivers: Record<string, string[]> = {
    emagrecimento: [
      'Transformação visual',
      'Urgência temporal',
      'Auto-estima',
      'Esperança em método novo'
    ],
    estetica: [
      'Envelhecimento',
      'Vaidade',
      'Comparação social',
      'Confiança'
    ],
    alimentacao: [
      'Prazer',
      'Conveniência',
      'Saúde',
      'Experiência'
    ],
    igaming: [
      'Adrenalina',
      'Ganho rápido',
      'Exclusão social',
      'Escapismo'
    ],
    ecommerce: [
      'Conveniência',
      'Economia',
      'Descoberta',
      'Satisfação'
    ],
    renda_extra: [
      'Liberdade financeira',
      'Segurança econômica',
      'Independência',
      'Realização'
    ],
    geral: [
      'Benefício claro',
      'Solução de dor',
      'Confiança',
      'Urgência'
    ]
  };

  return drivers[niche] || drivers['geral'];
}

/**
 * Gera estrutura de copy recomendada para o nicho
 * Útil para análise estratégica do anúncio original
 */
export function getNicheStructureTemplate(niche: string): {
  hook: string;
  agitation: string;
  solution: string;
  proof: string;
} {
  const templates: Record<string, { hook: string; agitation: string; solution: string; proof: string }> = {
    emagrecimento: {
      hook: 'Questionar identidade atual ou evocar dor (espelho, fotos)',
      agitation: 'Amplificar custo emocional/social (praia, encontro, aceitação)',
      solution: 'Método específico (dieta, app, protocolo, natural)',
      proof: 'Antes/depois, depoimento, ciência, número'
    },
    estetica: {
      hook: 'Reflexo no espelho, comparação com jovens',
      agitation: 'Validar a dor (rugas podem ser tratadas)',
      solution: 'Procedimento, produto, tratamento específico',
      proof: 'Antes/depois, dermatologista, ingredientes científicos'
    },
    alimentacao: {
      hook: 'Questionar hábito alimentar (você come bem?)',
      agitation: 'Contraste fast-food vs. comida de verdade',
      solution: 'Receita, app, serviço, ingredientes',
      proof: 'Fotos apetitosas, chef, reviews'
    },
    igaming: {
      hook: 'Chance de ganho, emoção, FOMO',
      agitation: 'Amigos ganhando enquanto você não joga',
      solution: 'Plataforma, bônus, jogos, entradas grátis',
      proof: 'Vencedor recente, prêmio grande, segurança'
    },
    ecommerce: {
      hook: 'Problema resolvido (item que faltava)',
      agitation: 'Escassez (estoque limitado, promoção acaba)',
      solution: 'Produto específico, preço, frete',
      proof: 'Reviews, unboxing, celebridade, garantia'
    },
    renda_extra: {
      hook: 'Situação financeira difícil (9-5 não rende)',
      agitation: 'Custo de não agir (dívidas acumulando)',
      solution: 'Método específico (dropshipping, freelancer, app)',
      proof: 'Case de sucesso, números reais, resultados'
    },
    geral: {
      hook: 'Questão provocativa ou dor imediata',
      agitation: 'Amplificar a dor, validar emoções',
      solution: 'O que exatamente você oferece',
      proof: 'Depoimento, resultado, credibilidade'
    }
  };

  return templates[niche] || templates['geral'];
}
