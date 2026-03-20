# 🎯 Plano de Implementação - 2 Novas Features

**Data**: 2026-03-19
**Status**: Em Desenvolvimento
**Agentes**: @dev (Filtros), @architect (IA Improvements)

---

## 📋 Feature 1: Filtros Avançados 🔍

### Objetivo
Permitir que usuários filtrem seus clones por:
- **Nicho** (já existe, melhorar)
- **Data de criação** (novo: últimas 24h, 7 dias, 30 dias, custom range)
- **Performance** (novo: melhor/pior copy, com mais/menos variantes)
- **Status** (novo: salvos, favoritos, compartilhados)

### Arquivos a Modificar

#### 1. **src/components/HistoryGallery.tsx**
- Adicionar componentes de filtro avançado
- Criar UI para data range picker
- Adicionar filtros por performance/status
- Melhorar UX do filtro existente

#### 2. **src/app/dashboard/history/page.tsx**
- Query ao Supabase com filtros dinâmicos
- Passar filtros para HistoryGallery
- Implementar cache inteligente de filtros

#### 3. **src/lib/types.ts**
- Adicionar tipo `FilterOptions`:
```typescript
interface FilterOptions {
  niche?: string;
  dateRange?: { from: Date; to: Date };
  performance?: 'best' | 'worst' | 'all';
  status?: 'favorite' | 'shared' | 'all';
}
```

#### 4. **src/app/api/history-stats/route.ts** (novo ou melhorado)
- Retornar stats por filtro
- Cache de 30 segundos

### Tarefas Específicas

- [ ] Criar componente `AdvancedFilters.tsx`
- [ ] Implementar date range picker (usar library como react-date-range)
- [ ] Adicionar "Salvar como Favorito" (boolean no DB)
- [ ] Criar visão "Melhores Clones" (ordenar por algo)
- [ ] Atualizar query Supabase com filtros dinâmicos
- [ ] Testar performance com 1000+ clones

### Resultado Esperado

```
╔════════════════════════════════════╗
║ HISTÓRICO DE CLONES                ║
╠════════════════════════════════════╣
║ [Nicho ▼] [Data ▼] [Performance ▼] ║
║ [🔄 Limpar Filtros]  [⭐ Favoritos] ║
╠════════════════════════════════════╣
║ 24 clones encontrados              ║
║ [Clone 1] [Clone 2] [Clone 3] ...   ║
╚════════════════════════════════════╝
```

---

## 🤖 Feature 2: AI Improvements 🧠

### Objetivo
Melhorar qualidade da IA em 3 áreas:
1. **Detecção de Nicho** — Mais precisa e contextual
2. **Prompts para GPT-4o** — Mais específicos por nicho
3. **Image Prompts** — Melhor diversidade visual

### Arquivos a Modificar

#### 1. **src/app/api/spy-engine/route.ts** (1282 linhas)

##### A) Melhorar Detecção de Nicho
- Adicionar análise semântica de copy (2-3 palavras-chave por nicho)
- Criar sistema de scores para cada nicho
- Implementar fallback inteligente (Top 3 nichos confidence)

Exemplo:
```typescript
// Antes: "geral" ou "emagrecimento"
// Depois: { primary: 'emagrecimento' (0.92), secondary: 'alimentacao' (0.45) }
```

##### B) Prompts Contextualizados por Nicho
- Criar prompts específicos que usem contexto do nicho
- Exemplo emagrecimento: "Foco em transformação visual, urgência temporal"
- Exemplo iGaming: "Foco em adrenalina, ganhos rápidos, experiência de usuário"

#### 2. **src/lib/types.ts**
- Adicionar tipo `NicheScores`:
```typescript
interface NicheScores {
  primary: { niche: string; confidence: number };
  secondary: { niche: string; confidence: number } | null;
  keywords: string[];
}
```

#### 3. **src/lib/mockAdData.ts**
- Expandir dados mock com mais variações por nicho
- Melhorar realismo das copies

#### 4. **Novo arquivo: src/lib/niche-detection.ts**
- Centralizar lógica de detecção
- Usar scores + keywords
- Testável independentemente

### Tarefas Específicas

- [ ] Criar arquivo `niche-detection.ts` com sistema de scores
- [ ] Expandir dicionário de keywords por nicho (10+ por nicho)
- [ ] Refatorar `detectNicheFromUrl()` em `route.ts`
- [ ] Refatorar `detectNicheFromCopy()` em `route.ts`
- [ ] Criar prompts templates por nicho em arquivo separado
- [ ] Melhorar deduplicação de imagens DALL-E
- [ ] Adicionar logging de confidence scores
- [ ] Testes unitários para detecção de nicho
- [ ] Testes com URLs reais de diferentes nichos

### Resultado Esperado

```
Antes:
- Nicho detectado: "geral" ❌
- Copies genéricas
- Imagens podem ser similares

Depois:
- Niche Score: "emagrecimento" (0.95) ✅
  - Keywords encontrados: "emagrecer", "peso", "dieta"
  - Secondary: "saúde" (0.40)
- Copies contextualizadas (foco transformação visual)
- Imagens com estilos variados garantidos
```

### Exemplo de Melhoria

**Detecção Antes:**
```
URL: "http://fb.com/ads?id=123"
Copy: "Emagreça rápido com nossa pílula..."
Resultado: "geral" ❌
```

**Detecção Depois:**
```
URL: "http://fb.com/ads?id=123"
Copy: "Emagreça rápido com nossa pílula..."

Scores:
- emagrecimento: 0.92 (keywords: emagreça, rápido, pílula, peso)
- alimentacao: 0.31 (keywords: alimento)
- geral: 0.15

Resultado: "emagrecimento" com confiança 92% ✅
```

---

## 📊 Distribuição de Trabalho

### Agente 1: @dev — Filtros Avançados
**Responsabilidades:**
- Criar componentes React de filtro
- Implementar queries Supabase com filtros
- UI/UX melhorado
- Testes de UI
- **Prazo:** ~2-3 horas

**Arquivos principais:**
- `src/components/HistoryGallery.tsx`
- `src/app/dashboard/history/page.tsx`
- `src/lib/types.ts`

---

### Agente 2: @architect + @dev — AI Improvements
**Responsabilidades:**
- Design de arquitetura para detecção (scores + keywords)
- Refatoração do spy-engine (modularizar)
- Sistema de prompts contextualizado
- Testes de detecção
- **Prazo:** ~3-4 horas

**Arquivos principais:**
- `src/app/api/spy-engine/route.ts`
- Novo: `src/lib/niche-detection.ts`
- Novo: `src/lib/niche-prompts.ts`
- `src/lib/types.ts`

---

## 🧪 Testes Necessários

### Filtros Avançados
- [ ] Filtro por nicho funciona
- [ ] Filtro por data range funciona
- [ ] Combinação de filtros (AND lógico)
- [ ] Performance com 1000+ clones
- [ ] Favoritos salvam corretamente

### AI Improvements
- [ ] Detecção de nicho com score > 0.8
- [ ] Fallback para nicho secundário se necessário
- [ ] DALL-E gera 3 imagens diferentes
- [ ] Prompts são contextualizados por nicho
- [ ] Copies têm tom apropriado para nicho

---

## 📈 Critérios de Sucesso

### Filtros Avançados ✅
- **UI/UX:** Interface intuitiva com 3+ filtros funcionais
- **Performance:** Carrega 50+ clones em <500ms
- **UX:** Filtros se combinam logicamente (AND)
- **Dados:** Favoritos salvos no DB

### AI Improvements ✅
- **Acurácia:** Nicho detectado com 85%+ de precisão
- **Qualidade:** Copies mais contextualizadas
- **Diversidade:** 3 imagens com estilos claramente diferentes
- **Logging:** Sistema registra scores de confiança

---

## 🚀 Timeline

```
Dia 1 (Paralelo):
├─ @dev: Filtros Avançados (2-3h)
└─ @architect: AI Architecture (1-2h)

Dia 2 (Paralelo):
├─ @dev: Implementação de Filtros (2h) + Testes (1h)
└─ @dev: Implementação de AI (2h) + Testes (1h)

Dia 3:
├─ Code Review cruzado
├─ Integration Testing
├─ Performance Testing
└─ Deploy para staging
```

---

## 📝 Notas

- **Backward Compatibility:** Manter clones antigos funcionando
- **Performance:** Cache em localStorage para filtros frequentes
- **Logging:** Adicionar logs de nicho detection para monitoring
- **Analytics:** Rastrear qual filtro é mais usado

---

**Status:** Pronto para implementação
**Próximo Passo:** Ativar agentes @dev e @architect
