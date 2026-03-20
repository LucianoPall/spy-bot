# Exemplos de Uso - Filtros Avançados

## Como Usar o Componente AdvancedFilters

### Exemplo 1: Integração Básica no HistoryGallery (Atual)

```typescript
import AdvancedFilters from "@/components/AdvancedFilters";
import { FilterOptions } from "@/lib/types";

export default function HistoryGallery({ initialClones }) {
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});

  // Renderizar componente
  <AdvancedFilters
    niches={uniqueNiches.filter(n => n !== "Todos")}
    onFiltersChange={setAdvancedFilters}
    onFilterReset={() => setAdvancedFilters({})}
  />
}
```

---

## Exemplo 2: Usar Filtros em Outra Página

Se quiser usar filtros avançados em outra página (ex: /dashboard/stats):

```typescript
"use client";

import { useState } from "react";
import AdvancedFilters from "@/components/AdvancedFilters";
import { FilterOptions } from "@/lib/types";

export default function StatsPage() {
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Usar filters para recarregar dados, API call, etc
    console.log("Filtros aplicados:", newFilters);
  };

  return (
    <div>
      <AdvancedFilters
        niches={["EMAGRECIMENTO", "IGAMING", "SAÚDE"]}
        onFiltersChange={handleFiltersChange}
      />

      {/* Aqui seu conteúdo que usa os filtros */}
      <div>
        {filters.niche && <p>Filtrado por: {filters.niche}</p>}
        {filters.status === 'favorite' && <p>Apenas favoritos</p>}
      </div>
    </div>
  );
}
```

---

## Exemplo 3: Enviar Filtros para API/Supabase

Para usar os filtros em uma query ao Supabase (future enhancement):

```typescript
async function fetchWithFilters(userId: string, filters: FilterOptions) {
  let query = supabase
    .from("spybot_generations")
    .select("*")
    .eq("user_id", userId);

  // Aplicar filtro de nicho
  if (filters.niche) {
    query = query.eq("niche", filters.niche);
  }

  // Aplicar filtro de data
  if (filters.dateRange) {
    query = query
      .gte("created_at", filters.dateRange.from.toISOString())
      .lte("created_at", filters.dateRange.to.toISOString());
  }

  // Aplicar filtro de status
  if (filters.status === 'favorite') {
    query = query.eq("is_favorite", true);
  }

  const { data, error } = await query;
  return { data, error };
}
```

---

## Exemplo 4: Validar Filtros no Backend

No servidor (API Route):

```typescript
// src/app/api/filter-clones/route.ts

import { FilterOptions } from "@/lib/types";

export async function POST(request: Request) {
  const { filters, userId } = await request.json();

  // Validar FilterOptions
  if (filters.niche && typeof filters.niche !== 'string') {
    return Response.json({ error: "Invalid niche" }, { status: 400 });
  }

  if (filters.dateRange) {
    if (!filters.dateRange.from || !filters.dateRange.to) {
      return Response.json({ error: "Invalid date range" }, { status: 400 });
    }
  }

  if (filters.status && !['favorite', 'all'].includes(filters.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  // Usar filtros para query ao DB
  // ...

  return Response.json({ success: true });
}
```

---

## Exemplo 5: Testes com Filtros

### Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { FilterOptions } from '@/lib/types';

describe('filterClones', () => {
  it('deve filtrar por nicho e data simultaneamente', () => {
    const clones = [
      { id: '1', niche: 'EMAGRECIMENTO', created_at: '2026-03-10' },
      { id: '2', niche: 'IGAMING', created_at: '2026-03-15' },
    ];

    const filters: FilterOptions = {
      niche: 'EMAGRECIMENTO',
      dateRange: {
        from: new Date('2026-03-10'),
        to: new Date('2026-03-20'),
      }
    };

    const result = clones.filter(clone =>
      clone.niche === filters.niche &&
      new Date(clone.created_at) >= filters.dateRange.from
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
```

---

## Exemplo 6: Persistir Filtros em localStorage

Para lembrar os filtros do usuário:

```typescript
"use client";

import { useState, useEffect } from "react";
import { FilterOptions } from "@/lib/types";

const FILTERS_STORAGE_KEY = 'advancedFilters';

export default function HistoryGallery() {
  const [filters, setFilters] = useState<FilterOptions>({});

  // Carregar filtros salvos
  useEffect(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Converter strings de volta para Date
        if (parsed.dateRange) {
          parsed.dateRange.from = new Date(parsed.dateRange.from);
          parsed.dateRange.to = new Date(parsed.dateRange.to);
        }
        setFilters(parsed);
      } catch (e) {
        console.error('Erro ao carregar filtros:', e);
      }
    }
  }, []);

  // Salvar filtros ao mudar
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters));
  };

  return (
    <AdvancedFilters
      niches={["EMAGRECIMENTO", "IGAMING"]}
      onFiltersChange={handleFiltersChange}
    />
  );
}
```

---

## Exemplo 7: Exportar Clones Filtrados

Para exportar apenas os clones que passaram pelos filtros:

```typescript
function exportFilteredClones(clones: Clone[], filters: FilterOptions) {
  const filtered = clones.filter(clone => {
    let matches = true;

    if (filters.niche) {
      matches = matches && clone.niche === filters.niche;
    }

    if (filters.dateRange) {
      const date = new Date(clone.created_at);
      matches = matches &&
        date >= filters.dateRange.from &&
        date <= filters.dateRange.to;
    }

    if (filters.status === 'favorite') {
      matches = matches && clone.is_favorite;
    }

    return matches;
  });

  // Converter para CSV, JSON, etc
  const csv = filtered
    .map(c => `${c.id},${c.niche},${c.created_at}`)
    .join('\n');

  downloadCSV(csv, 'clones-filtrados.csv');
}
```

---

## Exemplo 8: Analytics - Rastrear Uso de Filtros

Para entender qual filtro os usuários mais usam:

```typescript
function trackFilterUsage(filters: FilterOptions) {
  const analytics = {
    timestamp: new Date(),
    filters: {
      usedNiche: !!filters.niche,
      usedDate: !!filters.dateRange,
      usedStatus: filters.status === 'favorite',
    },
  };

  // Enviar para seu sistema de analytics
  fetch('/api/analytics/filters', {
    method: 'POST',
    body: JSON.stringify(analytics),
  });
}
```

---

## API Reference - FilterOptions

```typescript
interface FilterOptions {
  // Filtrar por nicho específico
  // Ex: "EMAGRECIMENTO", "IGAMING"
  niche?: string;

  // Filtrar por range de datas
  // Ex: { from: new Date('2026-03-01'), to: new Date('2026-03-31') }
  dateRange?: {
    from: Date;
    to: Date;
  };

  // Filtrar por status
  // 'favorite' = apenas favoritos
  // 'all' = todos (não filtra)
  status?: 'favorite' | 'all';
}
```

---

## Troubleshooting

### Problema: Os filtros não estão sendo aplicados

**Solução:**
1. Verificar se `onFiltersChange` está sendo chamado
2. Confirmar que o estado `advancedFilters` está sendo passado corretamente ao useMemo
3. Verificar console para erros

```typescript
// Debug
const [filters, setFilters] = useState<FilterOptions>({});

const handleFiltersChange = (newFilters: FilterOptions) => {
  console.log('Novos filtros:', newFilters); // Debug
  setFilters(newFilters);
};
```

### Problema: Campo `is_favorite` não existe no DB

**Solução:**
1. Executar migration para adicionar coluna:
```sql
ALTER TABLE spybot_generations ADD COLUMN is_favorite BOOLEAN DEFAULT false;
```

2. Atualizar query no `/dashboard/history/page.tsx`

### Problema: Performance lenta com muitos clones

**Solução:**
1. Implementar paginação
2. Mover filtragem para Supabase (query-side)
3. Usar useMemo com dependências corretas

---

## Roadmap de Melhorias

- [ ] Presets de data (últimas 24h, 7 dias, 30 dias)
- [ ] Filtro por performance (melhor/pior copy)
- [ ] Ordenação (mais novo, mais antigo, favoritos primeiro)
- [ ] Filtro por tags customizadas
- [ ] Salvar presets de filtros ("Meus favoritos de emagrecimento")
- [ ] Query dinâmica ao Supabase para melhor performance
- [ ] Histórico de filtros usados

---

**Última atualização**: 2026-03-19
