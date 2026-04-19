# Checklist UX Final: HistoryCard.tsx

**Quick Reference para implementação e validação**

---

## RESUMO EXECUTIVO

```
Pontuação Geral:     7.3/10
Status:              ⚠️ ALERTA - Requer correções críticas
Tempo p/ Implementar: ~1 hora
Impacto Esperado:    → 9.2/10 após implementações
```

---

## CRÍTICAS (🔴 Must-Fix)

### Crítica #1: Alt Text Inadequado
- [ ] Verificado: Linhas 69, 105, 123, 141 ❌
- [ ] Severidade: **ALTA** (WCAG 2.1 fail)
- [ ] Score Atual: 2-6/10
- [ ] Tempo: 15 min
- [ ] Arquivos: `/src/utils/alt-text.ts` (novo) + HistoryCard.tsx

```
ANTES:   alt="V1" ❌
DEPOIS:  alt="Dor Extrema (V1) - Feed 1:1 - Criativo Marketing Digital" ✅
```

**Checklist:**
- [ ] Criar `/src/utils/alt-text.ts` com função `generateAltText()`
- [ ] Importar em HistoryCard.tsx
- [ ] Atualizar linha 69: thumbnail
- [ ] Atualizar linha 105: V1 image
- [ ] Atualizar linha 123: V2 image
- [ ] Atualizar linha 141: V3 image
- [ ] Validar com WAVE browser extension

---

### Crítica #2: Falta Focus-Visible (Keyboard Navigation)
- [ ] Verificado: Linhas 110, 128, 146, 159, 114, 132, 150 ❌
- [ ] Severidade: **ALTA** (Acessibilidade crítica)
- [ ] Score Atual: 2/10
- [ ] Tempo: 10-15 min
- [ ] Arquivos: globals.css (novo) + HistoryCard.tsx

```
ANTES:   <button className="...bg-green-600/10 hover:bg-green-600/20...">
DEPOIS:  <button className="...focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500...">
```

**Checklist:**
- [ ] Adicionar classe `.btn-focus` em `/src/app/globals.css`
- [ ] Adicionar classe aos botões Copiar (3x)
- [ ] Adicionar classe ao botão Expandir
- [ ] Adicionar classe aos links Abrir Imagem (3x)
- [ ] Testar com Tab key
- [ ] Validar contraste do ring (>4.5:1)

---

### Crítica #3: Aspect Ratio 9:16 Quebrando Mobile
- [ ] Verificado: Linha 140 ❌
- [ ] Severidade: **ALTA** (UX quebrada)
- [ ] Score Atual: 5/10
- [ ] Tempo: 10 min
- [ ] Arquivo: HistoryCard.tsx

```
ANTES:   <div className="w-full aspect-[9/16] ...">
DEPOIS:  <div className="w-full aspect-square md:aspect-square lg:aspect-[9/16] ...">
```

**Checklist:**
- [ ] Atualizar className em linha 140
- [ ] Testar em 360px (mobile)
- [ ] Testar em 768px (tablet)
- [ ] Testar em 1024px (laptop)
- [ ] Verificar altura uniforme em mobile
- [ ] Verificar 9:16 proporcional em desktop

---

### Crítica #4: Placeholder Acessibilidade + Blur Loading
- [ ] Verificado: Linhas 69, 105, 123, 141 ❌
- [ ] Severidade: **ALTA** (Performance + UX)
- [ ] Score Atual: 3-4/10
- [ ] Tempo: 15 min
- [ ] Arquivos: `/src/utils/image-blur.ts` (novo) + HistoryCard.tsx

```
ANTES:   <Image src={...} alt={...} fill className="..." />
DEPOIS:  <Image src={...} alt={...} fill placeholder="blur"
           blurDataURL={...} loading="lazy" quality={75} />
```

**Checklist:**
- [ ] Criar `/src/utils/image-blur.ts` com `generateBlurDataURL()`
- [ ] Importar em HistoryCard.tsx
- [ ] Adicionar `placeholder="blur"` em linha 69
- [ ] Adicionar `blurDataURL` em linha 69
- [ ] Adicionar `loading="lazy"` em linha 69
- [ ] Adicionar `quality={75}` em linha 69
- [ ] Repetir para linhas 105, 123, 141
- [ ] Corrigir cor placeholder: `text-gray-700` → `text-gray-500` (linha 71)
- [ ] Executar Lighthouse (LCP deve melhorar)

---

## SCORE ANTES E DEPOIS

```
┌─────────────────────┬────────┬─────────┬──────────┐
│ Categoria           │ Antes  │ Depois  │ Melhoria │
├─────────────────────┼────────┼─────────┼──────────┤
│ Acessibilidade      │ 4.5/10 │ 8.5/10  │ +4.0 ⭐  │
│ Performance         │ 6.0/10 │ 8.0/10  │ +2.0 ⭐  │
│ Responsividade      │ 7.0/10 │ 8.5/10  │ +1.5 ⭐  │
│ Feedback UX         │ 8.0/10 │ 8.5/10  │ +0.5     │
│ Visual Rendering    │ 8.0/10 │ 8.0/10  │ +0.0     │
├─────────────────────┼────────┼─────────┼──────────┤
│ TOTAL               │ 6.7/10 │ 8.5/10  │ +1.8 ⭐⭐ │
└─────────────────────┴────────┴─────────┴──────────┘
```

---

## OPCIONAIS (🟡 Nice-to-Have)

### Opção #1: Aumentar Border Hover Opacity
- [ ] Severidade: BAIXA
- [ ] Tempo: 5 min
- [ ] Impacto: +0.2 visual clarity

```css
ANTES: group-hover:border-green-500/20
DEPOIS: group-hover:border-green-500/40
```

---

### Opção #2: Adicionar Ícone ao Link Download
- [ ] Severidade: BAIXA
- [ ] Tempo: 5 min
- [ ] Impacto: +0.3 UX clarity

```tsx
ANTES: <a ...>Abrir Imagem em Alta</a>
DEPOIS: <a ...><Download size={14} /> Abrir Imagem em Alta</a>
```

---

### Opção #3: Usar <figure> + <figcaption>
- [ ] Severidade: MUITO BAIXA (semântica)
- [ ] Tempo: 10 min
- [ ] Impacto: +0.1 a11y

```html
ANTES: <div>...<Image .../></div>
DEPOIS: <figure>...<Image .../><figcaption>Capa do Clone</figcaption></figure>
```

---

### Opção #4: Corrigir Col-Span em Breakpoint LG
- [ ] Severidade: MUITO BAIXA (layout polish)
- [ ] Tempo: 5 min
- [ ] Impacto: +0.1 responsividade

```tsx
ANTES: col-span-1 md:col-span-2 xl:col-span-3
DEPOIS: col-span-1 md:col-span-2 lg:col-span-3
```

---

### Opção #5: Adicionar ARIA Labels
- [ ] Severidade: BAIXA (a11y enhancement)
- [ ] Tempo: 10 min
- [ ] Impacto: +0.3 a11y

```tsx
<button aria-label="Expandir pack completo de variantes">
```

---

### Opção #6: Adicionar Padding Responsivo Mobile
- [ ] Severidade: MUITO BAIXA (spacing)
- [ ] Tempo: 5 min
- [ ] Impacto: +0.1 mobile UX

```tsx
ANTES: p-5
DEPOIS: p-3 md:p-5
```

---

### Opção #7: Validar CORS na API Proxy
- [ ] Severidade: BAIXA (segurança)
- [ ] Tempo: 30 min
- [ ] Impacto: +0.2 security

---

## PLANO DE IMPLEMENTAÇÃO

### Fase 1: Críticas (1 hora)
1. **15 min** - Alt Text
   - [ ] Criar utils file
   - [ ] Atualizar 4 imagens
   - [ ] Validar com WAVE

2. **10 min** - Focus-Visible
   - [ ] Adicionar classe Tailwind
   - [ ] Aplicar a 7 elementos
   - [ ] Testar Tab navigation

3. **10 min** - Aspect Ratio Mobile
   - [ ] Atualizar className V3
   - [ ] Testar responsividade
   - [ ] Validar alturas

4. **15 min** - Blur + Lazy Loading
   - [ ] Criar utils file
   - [ ] Importar em HistoryCard
   - [ ] Aplicar a 4 imagens
   - [ ] Corrigir placeholder color
   - [ ] Executar Lighthouse

### Fase 2: Opcionais (30 min)
- [ ] Border hover opacity (5 min)
- [ ] Download icon (5 min)
- [ ] Figure/figcaption (10 min)
- [ ] Col-span lg (5 min)

### Fase 3: Validação (20 min)
- [ ] Teste manual mobile (5 min)
- [ ] Teste teclado (5 min)
- [ ] Lighthouse audit (5 min)
- [ ] Screen reader test (5 min)

---

## TESTES RECOMENDADOS

### Teste 1: Alt Text Validation
```bash
# Ferramenta: WAVE Browser Extension
# Chrome Web Store: "WAVE Evaluation Tool"
# Esperado: Sem erros de alt text "missing"
```

### Teste 2: Keyboard Navigation
```bash
# Pressionar Tab para cada elemento
# Esperado: Ring verde visível em cada focus
# Ordem: Links → Botões → Links download → Expand
```

### Teste 3: Responsive Design
```bash
# DevTools: Ctrl+Shift+M
# Testar: 360px, 768px, 1024px, 1920px
# Esperado: Alturas uniformes em mobile
```

### Teste 4: Screen Reader
```bash
# Windows: Narrator (Win+Ctrl+Enter)
# macOS: VoiceOver (Cmd+F5)
# Esperado: Alt text lido corretamente
```

### Teste 5: Lighthouse
```bash
# Chrome DevTools → Lighthouse
# Targets:
#  - Performance: >75
#  - Accessibility: >90
#  - Best Practices: >85
```

---

## VALIDAÇÃO FINAL

### Pré-Deploy Checklist

- [ ] **Alt Text**
  - [ ] Linha 69: Thumbnail descritivo
  - [ ] Linha 105: V1 descritivo
  - [ ] Linha 123: V2 descritivo
  - [ ] Linha 141: V3 descritivo
  - [ ] WAVE validation passou

- [ ] **Focus-Visible**
  - [ ] Classe `.btn-focus` em globals.css
  - [ ] 3x botões Copiar com classe
  - [ ] 1x botão Expandir com classe
  - [ ] 3x links Abrir Imagem com classe
  - [ ] Tab navigation testado

- [ ] **Aspect Ratio**
  - [ ] V3 (linha 140) com breakpoints
  - [ ] Mobile (360px) teste
  - [ ] Tablet (768px) teste
  - [ ] Desktop (1920px) teste

- [ ] **Blur + Lazy Loading**
  - [ ] 4x imagens com placeholder blur
  - [ ] 4x imagens com loading="lazy"
  - [ ] Placeholder color corrigido (gray-500)
  - [ ] Lighthouse LCP < 2.5s

---

## Mapa de Arquivos

```
Arquivos a MODIFICAR:
├── src/components/HistoryCard.tsx
│   ├── Linha 69: Alt text + blur + lazy
│   ├── Linha 71: Corrigir text-gray-700 → text-gray-500
│   ├── Linha 105: Alt text
│   ├── Linha 110, 128, 146: Adicionar focus-visible
│   ├── Linha 114, 132, 150: Adicionar focus-visible
│   ├── Linha 123: Alt text
│   ├── Linha 140: Aspect ratio responsivo
│   ├── Linha 141: Alt text + blur + lazy
│   └── Linha 159: Adicionar focus-visible
│
├── src/app/globals.css
│   └── Adicionar: classe .btn-focus
│
└── src/utils/ (NOVOS)
    ├── image-blur.ts (novo)
    └── alt-text.ts (novo)
```

---

## Métricas de Sucesso

| Métrica | Antes | Meta | Status |
|---------|-------|------|--------|
| Alt text coverage | 0% | 100% | 🔴 |
| Focus-visible coverage | 0% | 100% | 🔴 |
| Mobile aspect ratio fix | Quebrado | Uniforme | 🔴 |
| Lighthouse Accessibility | ~60 | 90+ | 🔴 |
| Lighthouse Performance | ~60 | 75+ | 🔴 |
| WCAG AA compliance | ❌ | ✅ | 🔴 |

---

## Estimativas

```
Implementação:     1 hora
Testes:            20 minutos
Code Review:       15 minutos
Deploy:            5 minutos
─────────────────────────
Total:             1h 40 min
```

---

## Escalação

Se bloqueado:
1. **Alt text complexity:** Solicitar contexto de dados (niche, date)
2. **Focus-visible styling:** Validar contraste ring com designer
3. **Aspect ratio:** Testar em device real se DevTools não suficiente
4. **Performance:** Liaise com @devops para cache optimization

---

## Próximos Passos

### Imediato
- [ ] Implementar 4 críticas
- [ ] Executar testes
- [ ] Code review

### Curto Prazo (próximo sprint)
- [ ] Implementar opcionais (6 itens)
- [ ] Adicionar unit tests para functions
- [ ] Documentar padrão em README

### Longo Prazo (roadmap)
- [ ] Implementar skeleton loading customizado
- [ ] Adicionar analytics para download clicks
- [ ] A/B test de placeholders
- [ ] Performance monitoring em produção

---

## Contato de Suporte

- **UX Questions:** @ux-design-expert (Uma)
- **Implementation:** @dev (Dex)
- **QA Validation:** @qa (Quinn)
- **Performance:** @devops (Gage)

---

**Checklist Final Preparado por:** @ux-design-expert (Uma)
**Data:** 13 de Março de 2026
**Versão:** 1.0

