/**
 * Testes para Stock Images Fallback
 * Verifica se a função getStockImageVariations retorna URLs diferentes
 */

import { getStockImageVariations } from './stock-images';

describe('Stock Images Fallback', () => {
  it('deve retornar 3 imagens', async () => {
    const images = await getStockImageVariations('geral', 3);
    expect(images).toHaveLength(3);
  });

  it('deve retornar URLs válidas', async () => {
    const images = await getStockImageVariations('geral', 3);
    images.forEach((img) => {
      expect(img.url).toBeTruthy();
      expect(img.url).toMatch(/^https?:\/\//);
    });
  });

  it('deve retornar 3 URLs DIFERENTES', async () => {
    const images = await getStockImageVariations('igaming', 3);
    const urls = images.map((img) => img.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(3);
    expect(urls[0] !== urls[1]).toBe(true);
    expect(urls[1] !== urls[2]).toBe(true);
    expect(urls[0] !== urls[2]).toBe(true);
  });

  it('deve suportar todos os nichos', async () => {
    const nichos = ['igaming', 'emagrecimento', 'estetica', 'geral', 'renda_extra', 'ecommerce'];
    for (const niche of nichos) {
      const images = await getStockImageVariations(niche, 3);
      expect(images.length).toBeGreaterThan(0);
      expect(images.length).toBeLessThanOrEqual(3);
    }
  });

  it('deve retornar fallback quando niche é inválido', async () => {
    const images = await getStockImageVariations('niche_inexistente', 3);
    expect(images.length).toBeGreaterThan(0);
  });

  it('não deve retornar URLs undefined ou null', async () => {
    const images = await getStockImageVariations('geral', 3);
    images.forEach((img) => {
      expect(img.url).not.toBeNull();
      expect(img.url).not.toBeUndefined();
      expect(img.url.length).toBeGreaterThan(0);
    });
  });
});
