/**
 * Filtros Avançados para Clones de Anúncios
 * Implementa lógica de filtro por nicho, data range e status
 */

import { FilterOptions } from './types';

export interface Clone {
  id: string;
  niche: string;
  created_at: string;
  variante1: string;
  is_favorite: boolean;
}

/**
 * Aplica filtros avançados a um array de clones
 * @param clones - Array de clones para filtrar
 * @param filters - Opções de filtro a aplicar
 * @returns Array de clones filtrados
 */
export function applyFilters<T extends Clone>(clones: T[], filters: FilterOptions): T[] {
  return clones.filter(clone => {
    // Filtro de Nicho
    let matchesNiche = true;
    if (filters.niche) {
      matchesNiche = clone.niche === filters.niche;
    }

    // Filtro de Data
    let matchesDate = true;
    if (filters.dateRange) {
      const cloneDate = new Date(clone.created_at);
      const from = new Date(filters.dateRange.from);
      const to = new Date(filters.dateRange.to);
      // Usar setUTCHours para garantir que a comparação é feita em UTC
      to.setUTCHours(23, 59, 59, 999);
      matchesDate = cloneDate >= from && cloneDate <= to;
    }

    // Filtro de Status
    let matchesStatus = true;
    if (filters.status === 'favorite') {
      matchesStatus = clone.is_favorite === true;
    }

    return matchesNiche && matchesDate && matchesStatus;
  });
}

/**
 * Filtra clones por nicho específico
 * @param clones - Array de clones
 * @param niche - Nome do nicho
 * @returns Clones do nicho especificado
 */
export function filterByNiche<T extends Clone>(clones: T[], niche: string): T[] {
  return applyFilters(clones, { niche });
}

/**
 * Filtra clones por range de datas
 * @param clones - Array de clones
 * @param fromDate - Data inicial (inclusive)
 * @param toDate - Data final (inclusive)
 * @returns Clones dentro do range de datas
 */
export function filterByDateRange<T extends Clone>(
  clones: T[],
  fromDate: Date | string,
  toDate: Date | string
): T[] {
  const from = typeof fromDate === 'string' ? new Date(fromDate) : fromDate;
  const to = typeof toDate === 'string' ? new Date(toDate) : toDate;

  return applyFilters(clones, {
    dateRange: { from, to }
  });
}

/**
 * Filtra clones favoritados
 * @param clones - Array de clones
 * @returns Apenas clones favoritados
 */
export function filterFavorites<T extends Clone>(clones: T[]): T[] {
  return applyFilters(clones, { status: 'favorite' });
}
