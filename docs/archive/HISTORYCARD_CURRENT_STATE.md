# HistoryCard.tsx — Estado Atual & Contexto

**Arquivo:** `src/components/HistoryCard.tsx`
**Status UX Score:** 7.8/10
**Pronto para análise de:** @ux-design-expert (Uma)

---

## 📸 Componente Atual

HistoryCard exibe cards do histórico de clones gerados com:
- **3 imagens** por card (variantes de criação)
- **Aspect ratios variados:** 16:9 (thumbnail), 1:1 (feed), 9:16 (stories)
- **Estados:** Colapsado (thumbnail) e Expandido (3 variantes)
- **Metadata:** Niche, data, original copy/image

---

## 🏗️ Estrutura Atual

```tsx
HistoryCard
├── Container (border-green-500, p-5, rounded-xl)
│
├── Colapsado (padrão)
│   └── Thumbnail (aspect-video 16:9)
│       └── Image + hover scale
│
├── Expandido (ao clicar)
│   ├── Original (original_ad_copy + original_ad_image)
│   │
│   ├── Variante 1 (1:1 square)
│   │   └── Image + copy
│   │
│   ├── Variante 2 (1:1 square)
│   │   └── Image + copy
│   │
│   └── Variante 3 (9:16 vertical)
│       └── Image + copy
│
└── Metadata (niche, data)
```

---

## ⚠️ Problemas Identificados (Relatório 7.8/10)

### 4 CRÍTICOS
1. ❌ **Sem skeleton/blur loading** — Imagens "pop in" abruptamente
2. ❌ **Sem lazy loading** — Todas as imagens carregam mesmo em off-screen
3. ❌ **Acessibilidade fraca** — Alt text genéricos, sem ARIA labels
4. ❌ **Performance pobre** — Imagens lentas, sem timeout, sem cache

### 6 OPCIONAIS
1. ⚠️ Sem títulos informativos sobre aspect ratio
2. ⚠️ Sem indicadores de estado (loading, error)
3. ⚠️ Animações não otimizadas
4. ⚠️ Feedback visual limitado
5. ⚠️ Sem cache local de imagens
6. ⚠️ Error handling genérico

---

## 🔍 Pontos de Análise para Uma

### Visual
- [ ] Aspect ratios mantidos corretamente? (16:9, 1:1, 9:16)
- [ ] Cores/contrasts adequados? (dark theme)
- [ ] Hover states funcionam bem?
- [ ] Borders/shadows estão bons?

### Acessibilidade
- [ ] Alt text descritivo? (atualmente genérico)
- [ ] ARIA labels presentes?
- [ ] Contraste >= 4.5:1?
- [ ] Keyboard navigation?
- [ ] Focus indicators visíveis?

### Performance
- [ ] Imagens carregam rápido? (target: < 2s)
- [ ] Lazy loading implementado?
- [ ] Memory não vaza?
- [ ] Bundle size razoável?

### UX
- [ ] Estados de loading claros?
- [ ] Error states visíveis?
- [ ] Feedback ao usuário?
- [ ] Responsivo em mobile?

---

## 📋 Checklist para Uma Entregar

Uma deve revisar e aprovar:

- [ ] **Skeleton Loading Component**
  - Type: React component ou biblioteca?
  - Duração da animação?
  - Cores/styling?

- [ ] **Blur Placeholder**
  - Data URL com que cor?
  - Quando mostrar (durante fetch)?
  - Transição suave?

- [ ] **Lazy Loading Strategy**
  - Usar Next.js `loading="lazy"`?
  - Intersection Observer?
  - Timeout para fallback?

- [ ] **Acessibilidade Spec**
  - Alt text template?
  - ARIA labels detalhados?
  - Roles específicos?
  - Keyboard shortcuts?

- [ ] **Error Handling**
  - Componente de erro?
  - Retry button?
  - Fallback image?

- [ ] **Performance Targets**
  - FCP < 1.5s?
  - Image load < 2s?
  - Lighthouse >= 85?

---

## 🎯 Para @dev (Dex) Implementar

Depois de Uma aprovar, Dex vai precisar de:

1. **Skeleton UI Library**
   - `npm install react-loading-skeleton`?
   - Ou custom skeleton?

2. **Image Optimization**
   - WebP format?
   - Sizes/srcSet?
   - Priority hints?

3. **Error Boundaries**
   - Try/catch structure?
   - Error component?

4. **Tests**
   - Unit tests para Skeleton?
   - Loading state tests?
   - Error state tests?

---

## 🧪 Para @qa (Quinn) Validar

Depois de Dex implementar, Quinn vai testar:

1. **Responsividade**
   - 375px, 480px, 768px, 1440px, 1920px

2. **Acessibilidade**
   - WCAG 2.1 AA compliance
   - Screen reader testing
   - Keyboard navigation

3. **Performance**
   - Lighthouse scores
   - Image load times
   - Memory profiling

4. **Browsers**
   - Chrome, Firefox, Safari, Mobile Safari

---

## 📊 Success Metrics

| Métrica | Antes | Target | Status |
|---------|-------|--------|--------|
| Visual Score | 8/10 | 8.5/10 | Pending |
| Responsividade | 8/10 | 8.5/10 | Pending |
| Acessibilidade | 6/10 | 8.5/10 | Pending ⭐ |
| Performance | 6/10 | 8.5/10 | Pending ⭐ |
| UX | 8/10 | 8.5/10 | Pending |
| **GERAL** | **7.8/10** | **8.5+/10** | **Pending** |

---

## 🚀 Timeline

```
Task #10: Uma revisa       1-2h  → T+0h to T+2h
Task #11: Dex implementa   2-3h  → T+2h to T+5h
Task #12: Quinn valida     2-3h  → T+5h to T+8h
```

---

**Pronto para Uma começar a análise! 🎯**
