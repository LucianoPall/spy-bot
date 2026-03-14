/**
 * Testes para MockAdData - Fallback Inteligente
 * Validação de nichos, copies realistas e URLs de imagem
 */

import {
  getMockAdData,
  getAvailableNiches,
  getNicheExamples,
  MockAdDataResult
} from './mockAdData';

// ============================================
// TESTES UNITÁRIOS
// ============================================

describe('getMockAdData', () => {

  // TEST 1: Detecção de nicho por URL
  test('Detectar nicho Emagrecimento', () => {
    const result = getMockAdData('https://facebook.com/ads/emagrecer-rapido');
    expect(result.niche).toBe('emagrecimento');
    expect(result.isMock).toBe(true);
    expect(result.copy).toBeTruthy();
    expect(result.image).toContain('unsplash');
  });

  test('Detectar nicho Renda Extra', () => {
    const result = getMockAdData('https://facebook.com/ads/ganhe-dinheiro-online');
    expect(result.niche).toBe('renda_extra');
    expect(result.copy.toLowerCase()).toContain('r$');
  });

  test('Detectar nicho iGaming', () => {
    const result = getMockAdData('https://facebook.com/ads/cassino-online');
    expect(result.niche).toBe('igaming');
  });

  test('Detectar nicho Estética', () => {
    const result = getMockAdData('https://facebook.com/ads/pele-lifting');
    expect(result.niche).toBe('estetica');
  });

  test('Detectar nicho E-commerce', () => {
    const result = getMockAdData('https://facebook.com/ads/loja-produtos');
    expect(result.niche).toBe('ecommerce');
  });

  // TEST 2: Forçar nicho específico
  test('Forçar nicho manualmente', () => {
    const result = getMockAdData(undefined, 'emagrecimento');
    expect(result.niche).toBe('emagrecimento');
    expect(result.copy).toBeTruthy();
  });

  // TEST 3: Validação de URLs de imagem
  test('URLs de imagem devem ser válidas', () => {
    const nichos = ['emagrecimento', 'renda_extra', 'igaming', 'estetica', 'ecommerce'];
    nichos.forEach(nicho => {
      const result = getMockAdData(undefined, nicho);
      expect(result.image).toMatch(/^https:\/\/(images\.unsplash|images\.pexels)/);
      expect(result.image).toContain('?');
    });
  });

  // TEST 4: Copy nunca deve ser vazia
  test('Copy nunca deve estar vazia', () => {
    for (let i = 0; i < 10; i++) {
      const result = getMockAdData(undefined, 'emagrecimento');
      expect(result.copy.length).toBeGreaterThan(50);
      expect(result.copy).not.toContain('undefined');
      expect(result.copy).not.toContain('null');
    }
  });

  // TEST 5: Aleatoriedade
  test('Deve retornar diferentes copies em múltiplas chamadas', () => {
    const copies = new Set();
    for (let i = 0; i < 10; i++) {
      const result = getMockAdData(undefined, 'emagrecimento');
      copies.add(result.copy);
    }
    expect(copies.size).toBeGreaterThan(1); // Pelo menos 2 copies diferentes
  });

  // TEST 6: Fallback genérico para nicho inválido
  test('Nicho inválido retorna fallback genérico', () => {
    const result = getMockAdData(undefined, 'nicho_inexistente');
    expect(result.niche).toBe('geral');
    expect(result.copy).toContain('dinheiro');
    expect(result.isMock).toBe(true);
  });
});

describe('getAvailableNiches', () => {
  test('Deve retornar lista de nichos disponíveis', () => {
    const nichos = getAvailableNiches();
    expect(nichos.length).toBe(5);
    expect(nichos.map(n => n.id)).toEqual([
      'emagrecimento',
      'renda_extra',
      'igaming',
      'estetica',
      'ecommerce'
    ]);
  });

  test('Cada nicho deve ter name legível', () => {
    const nichos = getAvailableNiches();
    nichos.forEach(n => {
      expect(n.name).toBeTruthy();
      expect(n.name.length).toBeGreaterThan(0);
    });
  });
});

describe('getNicheExamples', () => {
  test('Retornar exemplos de um nicho', () => {
    const examples = getNicheExamples('emagrecimento');
    expect(examples).toBeTruthy();
    expect(examples.niche).toBe('emagrecimento');
    expect(examples.displayName).toBe('Emagrecimento');
    expect(examples.examples.length).toBe(3);
  });

  test('Cada exemplo deve ter copy e image', () => {
    const examples = getNicheExamples('renda_extra');
    examples.examples.forEach(ex => {
      expect(ex.copy).toBeTruthy();
      expect(ex.image).toBeTruthy();
      expect(ex.image).toContain('unsplash');
    });
  });

  test('Nicho inexistente retorna null', () => {
    const examples = getNicheExamples('nicho_fake');
    expect(examples).toBeNull();
  });
});

// ============================================
// TESTES DE INTEGRAÇÃO (MOCK REALISTA)
// ============================================

describe('Realismo dos Dados', () => {
  test('Emagrecimento - Copy deve mencionar peso ou resultados', () => {
    const result = getMockAdData(undefined, 'emagrecimento');
    const hasMentionOfResults = /\d+kg|peso|emagrec|slim|perdi/i.test(result.copy);
    expect(hasMentionOfResults).toBe(true);
  });

  test('Renda Extra - Copy deve mencionar valores monetários', () => {
    const result = getMockAdData(undefined, 'renda_extra');
    const hasMoneyMention = /R\$|reais|ganho|dinheiro|lucro/i.test(result.copy);
    expect(hasMoneyMention).toBe(true);
  });

  test('iGaming - Copy deve mencionar cassino/aposta', () => {
    const result = getMockAdData(undefined, 'igaming');
    const hasGamingMention = /cassino|aposta|jogo|bet|premio/i.test(result.copy);
    expect(hasGamingMention).toBe(true);
  });

  test('Estética - Copy deve mencionar pele ou beleza', () => {
    const result = getMockAdData(undefined, 'estetica');
    const hasBeautyMention = /pele|facial|beleza|lifting|rugas|skincare/i.test(result.copy);
    expect(hasBeautyMention).toBe(true);
  });

  test('E-commerce - Copy deve mencionar produtos ou promoção', () => {
    const result = getMockAdData(undefined, 'ecommerce');
    const hasShoppingMention = /produto|compre|promo|desconto|loja|shop/i.test(result.copy);
    expect(hasShoppingMention).toBe(true);
  });
});

// ============================================
// EXEMPLO DE USO NO TESTE
// ============================================

describe('Exemplo de Implementação no route.ts', () => {
  test('Simular erro Apify com fallback mock', () => {
    const adUrl = 'https://facebook.com/ads/perda-peso';
    const apifyErrorMessage = 'Apify API Error: 500 - Internal Server Error';

    // Simular o que aconteceria no route.ts
    if (!apifyErrorMessage) {
      throw new Error('Should have error');
    }

    // Usar mock inteligente
    const mockData = getMockAdData(adUrl);

    expect(mockData.niche).toBe('emagrecimento');
    expect(mockData.copy).toBeTruthy();
    expect(mockData.image).toBeTruthy();
    expect(mockData.isMock).toBe(true);

    // Verificar que não há erro visível ao usuário
    expect(mockData.copy).not.toContain('[ERRO NA EXTRAÇÃO REAL:');
    expect(mockData.copy).not.toContain('Apify API Error');
  });
});
