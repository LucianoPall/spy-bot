# 🤝 Plano de Coordenação — 3 Agentes Corrigindo "Meus Clones"

**Status:** 🚀 Iniciando coordenação
**Data:** 2026-03-23
**Objetivo:** Corrigir coluna "Meus Clones" (HistoryCard.tsx) de 7.8/10 → 8.5+/10

---

## 📋 Sequência de Trabalho

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Task #10: @ux-design-expert (Uma)                         │
│  ├─ Revisar design atual                                   │
│  ├─ Validar acessibilidade                                 │
│  ├─ Aprovar 4 recomendações críticas                       │
│  ├─ Priorizar 6 melhorias opcionais                        │
│  └─ ✅ Entregar: Aprovação + Especificação                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓ (bloqueia até aprovação)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Task #11: @dev (Dex)                                      │
│  ├─ Implementar Skeleton loading                           │
│  ├─ Adicionar blur placeholder                             │
│  ├─ Otimizar lazy loading                                  │
│  ├─ Melhorar acessibilidade                                │
│  ├─ Testes unitários                                       │
│  └─ ✅ Entregar: HistoryCard.tsx atualizado                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓ (bloqueia até implementação)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Task #12: @qa (Quinn)                                     │
│  ├─ Testes de responsividade (5 resoluções)               │
│  ├─ Testes de acessibilidade (WCAG)                        │
│  ├─ Testes de performance                                  │
│  ├─ Testes de compatibilidade (4 browsers)                │
│  ├─ Screenshots e relatório                                │
│  └─ ✅ Entregar: Relatório QA + Score final                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tarefa #10 — @ux-design-expert (Uma)

### Responsabilidades
- ✅ Revisar `HistoryCard.tsx` atual
- ✅ Validar aspect ratios (16:9, 1:1, 9:16)
- ✅ Avaliar acessibilidade visual
- ✅ Aprovar/rejeitar 4 recomendações críticas
- ✅ Priorizar 6 melhorias opcionais

### Entregáveis
```
1. Design Review Report
   ├─ Estado atual: Análise completa
   ├─ Críticas: 4 recomendações avaliadas
   ├─ Opcionais: 6 melhorias prorizadas
   ├─ Wireframes: Se necessário
   └─ Sign-off: "Pronto para dev"

2. Specification Document
   ├─ Componentes a usar (Skeleton, Spinner, etc)
   ├─ Classes Tailwind atualizadas
   ├─ ARIA labels detalhadas
   └─ Mockups finais

3. Approval
   └─ "Task #11 pode começar" ✅
```

### Critério de Sucesso
- ✅ Todas as 4 recomendações críticas avaliadas
- ✅ Score mínimo: 8.0/10
- ✅ Zero ambiguidades nas specs
- ✅ @dev pronto para implementar

---

## 💻 Tarefa #11 — @dev (Dex)

**Bloqueada por:** Task #10 (aguardando aprovação de Uma)

### Responsabilidades
- ✅ Implementar especificação de Uma
- ✅ Adicionar Skeleton loading
- ✅ Implementar blur placeholder
- ✅ Otimizar lazy loading
- ✅ Melhorar acessibilidade
- ✅ Testes unitários

### Implementações Específicas

#### 1. Skeleton Loading
```tsx
// Adicionar ao HistoryCard.tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

{isLoading ? (
  <Skeleton className="w-full aspect-video rounded-lg" />
) : (
  <Image src={...} />
)}
```

#### 2. Blur Placeholder
```tsx
<Image
  src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
  alt="Thumbnail do Criativo 1"
  fill
  placeholder="blur"
  blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%23050505' width='400' height='225'/%3E%3C/svg%3E"
  loading="lazy"
/>
```

#### 3. Lazy Loading
```tsx
<Image
  loading="lazy"
  onLoadingComplete={() => setIsLoading(false)}
  onError={() => setImageError(true)}
/>
```

#### 4. Acessibilidade
```tsx
// Alt text descritivo
<Image alt={`Criativo ${index + 1} - ${clone.niche}`} />

// ARIA labels
<button aria-label="Expandir card de clone" />
<div aria-label="Variantes de imagem" role="region" />
```

### Entregáveis
```
1. Updated Component
   ├─ HistoryCard.tsx (com todas as melhorias)
   ├─ Imports adicionados
   ├─ Tipos TypeScript corretos
   └─ Build sem erros

2. Unit Tests
   ├─ Skeleton loading
   ├─ Lazy loading
   ├─ Error handling
   └─ Accessibility

3. Validation
   ├─ npm run build ✅
   ├─ npm run lint ✅
   ├─ npm test ✅
   └─ Zero TypeScript errors ✅

4. Sign-off
   └─ "Task #12 pode começar" ✅
```

### Critério de Sucesso
- ✅ Build sem erros
- ✅ Todos os testes passando
- ✅ Linter clean
- ✅ TypeScript strict mode OK
- ✅ Pronto para QA

---

## 🧪 Tarefa #12 — @qa (Quinn)

**Bloqueada por:** Task #11 (aguardando implementação de Dex)

### Responsabilidades
- ✅ Testes de responsividade (5 resoluções)
- ✅ Testes de acessibilidade (WCAG)
- ✅ Testes de performance
- ✅ Testes de compatibilidade (4 browsers)
- ✅ Relatório final

### Testes Específicos

#### 1. Responsividade (5 Resoluções)
```
✓ Mobile Small:   375px (iPhone SE)
✓ Mobile Medium:  480px (iPhone 12)
✓ Tablet:         768px (iPad)
✓ Desktop:        1440px (MacBook)
✓ Desktop Large:  1920px (4K monitor)

Validar:
- Aspect ratios mantidos
- Sem overflow
- Touch areas >= 44x44px
- Legibilidade de texto
```

#### 2. Acessibilidade (WCAG 2.1 AA)
```
Contrast Ratio:
  ✓ Texto/Background >= 4.5:1
  ✓ UI Components >= 3:1

Keyboard Navigation:
  ✓ Tab order correto
  ✓ Focus indicators visíveis
  ✓ Sem keyboard trap

Screen Reader:
  ✓ Alt text presente
  ✓ ARIA labels corretos
  ✓ Navegação lógica

Touch:
  ✓ Min size 44x44px
  ✓ Spacing adequado
  ✓ Sem pequeninhos
```

#### 3. Performance
```
Métricas:
  ✓ FCP < 1.5s
  ✓ Image load < 2s
  ✓ Skeleton animation smooth (60fps)
  ✓ Memory stable (sem leaks)
  ✓ Bundle size delta < 10%

Tools:
  - Lighthouse (score >= 85)
  - WebPageTest
  - Chrome DevTools (Performance tab)
  - Lighthouse CI
```

#### 4. Compatibilidade (4 Browsers)
```
✓ Chrome/Edge (latest)
✓ Firefox (latest)
✓ Safari (latest)
✓ Mobile Safari (latest iOS)

Testes:
- Renderização visual
- Hover/Focus states
- Touch interaction
- Image loading
- Error handling
```

### Entregáveis
```
1. Test Report
   ├─ Responsividade: ✅/5 resoluções
   ├─ Acessibilidade: ✅/10 checks
   ├─ Performance: ✅/6 métricas
   ├─ Compatibilidade: ✅/4 browsers
   └─ Score: X/10

2. Screenshots
   ├─ Cada resolução
   ├─ Estados (loading, error, hover)
   └─ Cada browser

3. Performance Data
   ├─ Lighthouse scores
   ├─ Timeline traces
   ├─ Memory profiles
   └─ Bundle analysis

4. Bug Report (se houver)
   ├─ Severidade
   ├─ Passos para reproduzir
   ├─ Evidência (screenshot/video)
   └─ Sugestão de fix

5. Final Sign-off
   └─ "✅ Pronto para produção" ou "⚠️ Ajustes necessários"
```

### Critério de Sucesso
- ✅ Score >= 8.5/10 (melhoria de 7.8)
- ✅ WCAG 2.1 AA compliant
- ✅ Lighthouse score >= 85
- ✅ Sem bugs críticos
- ✅ Relatório completo entregue

---

## 📊 Métricas de Sucesso

### Before (Estado Atual)
```
Score Visual:        8/10
Responsividade:      8/10
Acessibilidade:      6/10  ⚠️ PRECISA MELHORAR
Performance:         6/10  ⚠️ PRECISA MELHORAR
Feedback Usuário:    8/10

SCORE GERAL: 7.8/10
```

### After (Target)
```
Score Visual:        8.5/10  ↑ +0.5
Responsividade:      8.5/10  ↑ +0.5
Acessibilidade:      8.5/10  ↑ +2.5 ⭐ CRÍTICO
Performance:         8.5/10  ↑ +2.5 ⭐ CRÍTICO
Feedback Usuário:    8.5/10  ↑ +0.5

SCORE GERAL: 8.5+/10  ↑ +0.7
```

---

## 📞 Comunicação Entre Agentes

### Uma → Dex
```
"Aqui está a especificação completa com:
- Componentes a usar
- Classes Tailwind
- ARIA labels
- Mockups
Está pronto para implementar. Confirma?"
```

### Dex → Quinn
```
"Implementei todas as recomendações:
- Skeleton loading ✅
- Blur placeholder ✅
- Lazy loading ✅
- Acessibilidade ✅
- Testes unitários ✅

Código pronto em: src/components/HistoryCard.tsx
Build: npm run build ✅
Tests: npm test ✅"
```

### Quinn → Product/PM
```
"QA completo para HistoryCard:
✅ Responsividade: OK
✅ Acessibilidade: WCAG AA compliant
✅ Performance: Lighthouse 87
✅ Compatibilidade: 4/4 browsers

SCORE: 8.7/10 (melhoria de 7.8)

Pronto para produção ✅"
```

---

## ⏱️ Timeline Estimada

| Fase | Agente | Duração | Início | Fim |
|------|--------|---------|--------|-----|
| Review | @ux-design-expert | 1-2h | Agora | T+2h |
| Implement | @dev | 2-3h | T+2h | T+5h |
| QA | @qa | 2-3h | T+5h | T+8h |
| **TOTAL** | **3 agentes** | **~7h** | **Agora** | **T+8h** |

---

## 🎯 Próximos Passos

1. ✅ **Agora:** Uma começa review (Task #10)
2. ⏳ **T+2h:** Dex começa implementação (Task #11)
3. ⏳ **T+5h:** Quinn começa QA (Task #12)
4. ⏳ **T+8h:** Tudo pronto para produção

---

## 📝 Arquivo de Referência

**Relatório UX Original:** `RELATORIO_UX_HISTORYCARD.md`

**Componente a Corrigir:** `src/components/HistoryCard.tsx`

**Arquivo de Especificação:** Este arquivo (`AGENTS_COORDINATION_PLAN.md`)

---

**Status:** 🚀 Coordenação iniciada
**Tasks Criadas:** #10, #11, #12
**Pronto para começar:** SIM ✅
