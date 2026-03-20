import { describe, it, expect } from 'vitest';
import { applyFilters } from '@/lib/filters';
import { FilterOptions } from '@/lib/types';

/**
 * Test suite para Filtros Avançados (Feature 1)
 * Validar que todos os filtros funcionam corretamente
 */

describe('Advanced Filters', () => {
  // Mock data
  const mockClones = [
    {
      id: '1',
      niche: 'EMAGRECIMENTO',
      created_at: '2026-03-10T10:00:00Z',
      variante1: 'Emagreça 10kg em 30 dias',
      is_favorite: true,
    },
    {
      id: '2',
      niche: 'IGAMING',
      created_at: '2026-03-15T10:00:00Z',
      variante1: 'Ganhe dinheiro agora',
      is_favorite: false,
    },
    {
      id: '3',
      niche: 'EMAGRECIMENTO',
      created_at: '2026-03-18T10:00:00Z',
      variante1: 'Perca peso sem academia',
      is_favorite: false,
    },
    {
      id: '4',
      niche: 'SAÚDE',
      created_at: '2026-03-05T10:00:00Z',
      variante1: 'Vitaminas naturais',
      is_favorite: true,
    },
  ];

  describe('Filtro por Nicho', () => {
    it('deve filtrar clones por nicho específico', () => {
      const filters: FilterOptions = { niche: 'EMAGRECIMENTO' };
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(2);
      expect(result.every(c => c.niche === 'EMAGRECIMENTO')).toBe(true);
    });

    it('deve retornar todos os clones quando sem filtro de nicho', () => {
      const filters: FilterOptions = {};
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(4);
    });

    it('deve retornar 0 clones para nicho inexistente', () => {
      const filters: FilterOptions = { niche: 'INEXISTENTE' };
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(0);
    });
  });

  describe('Filtro por Data', () => {
    it('deve filtrar clones dentro de um range de datas', () => {
      const filters: FilterOptions = {
        dateRange: {
          from: new Date('2026-03-15'),
          to: new Date('2026-03-18'),
        },
      };
      const result = applyFilters(mockClones, filters);

      // Deve retornar clones de 15, 18 (dentro do range)
      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toEqual(['2', '3']);
    });

    it('deve incluir clones em ambas as datas extremas', () => {
      const filters: FilterOptions = {
        dateRange: {
          from: new Date('2026-03-05'),
          to: new Date('2026-03-05'),
        },
      };
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('deve retornar 0 clones para range sem dados', () => {
      const filters: FilterOptions = {
        dateRange: {
          from: new Date('2026-04-01'),
          to: new Date('2026-04-30'),
        },
      };
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(0);
    });
  });

  describe('Filtro por Status', () => {
    it('deve filtrar apenas clones favoritados', () => {
      const filters: FilterOptions = { status: 'favorite' };
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(2);
      expect(result.every(c => c.is_favorite === true)).toBe(true);
    });

    it('deve retornar todos quando status = "all"', () => {
      const filters: FilterOptions = { status: 'all' };
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(4);
    });
  });

  describe('Combinação de Filtros (AND lógico)', () => {
    it('deve aplicar Nicho AND Data', () => {
      const filters: FilterOptions = {
        niche: 'EMAGRECIMENTO',
        dateRange: {
          from: new Date('2026-03-10'),
          to: new Date('2026-03-18'),
        },
      };
      const result = applyFilters(mockClones, filters);

      // Emagrecimento: ids 1, 3
      // Data: ids 1, 2, 3
      // Intersecção: ids 1, 3
      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toEqual(['1', '3']);
    });

    it('deve aplicar Nicho AND Status', () => {
      const filters: FilterOptions = {
        niche: 'EMAGRECIMENTO',
        status: 'favorite',
      };
      const result = applyFilters(mockClones, filters);

      // Emagrecimento: ids 1, 3
      // Favoritos: ids 1, 4
      // Intersecção: id 1
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('deve aplicar Data AND Status', () => {
      const filters: FilterOptions = {
        dateRange: {
          from: new Date('2026-03-01'),
          to: new Date('2026-03-15'),
        },
        status: 'favorite',
      };
      const result = applyFilters(mockClones, filters);

      // Data: ids 1, 2, 4
      // Favoritos: ids 1, 4
      // Intersecção: ids 1, 4
      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toEqual(['1', '4']);
    });

    it('deve aplicar Nicho AND Data AND Status', () => {
      const filters: FilterOptions = {
        niche: 'EMAGRECIMENTO',
        dateRange: {
          from: new Date('2026-03-10'),
          to: new Date('2026-03-18'),
        },
        status: 'favorite',
      };
      const result = applyFilters(mockClones, filters);

      // Emagrecimento: ids 1, 3
      // Data: ids 1, 2, 3
      // Favoritos: ids 1, 4
      // Intersecção: id 1
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('deve retornar 0 clones quando nenhum atende todos os critérios', () => {
      const filters: FilterOptions = {
        niche: 'IGAMING',
        status: 'favorite',
      };
      const result = applyFilters(mockClones, filters);

      expect(result).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('deve processar 50+ clones em tempo aceitável', () => {
      // Criar 100 clones de teste
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        niche: ['EMAGRECIMENTO', 'IGAMING', 'SAÚDE'][i % 3],
        created_at: new Date(2026, 2, (i % 30) + 1).toISOString(),
        variante1: `Variante ${i}`,
        is_favorite: i % 5 === 0,
      }));

      const filters: FilterOptions = {
        niche: 'EMAGRECIMENTO',
        dateRange: {
          from: new Date('2026-03-01'),
          to: new Date('2026-03-31'),
        },
        status: 'favorite',
      };

      const start = performance.now();
      const result = applyFilters(largeDataset, filters);
      const end = performance.now();

      // Deve completar em menos de 100ms
      expect(end - start).toBeLessThan(100);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
