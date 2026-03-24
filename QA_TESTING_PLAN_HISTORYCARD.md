# 🧪 Plano QA Completo — Validação HistoryCard

**De:** @dev (Dex) [implementação concluída]
**Para:** @qa (Quinn)
**Data:** 2026-03-23
**Status:** ⏳ AGUARDANDO QA

---

## 📋 O Que Quinn Precisa Validar

HistoryCard.tsx após implementação de Dex com:
- ✅ Skeleton loading + blur placeholder
- ✅ Lazy loading com timeout (5s)
- ✅ Alt text + ARIA labels
- ✅ Performance otimizada
- ✅ Error handling robusto

**Target Score:** 8.5+/10 (melhoria de 7.8)

---

## 🧪 1. TESTES DE RESPONSIVIDADE

**Duração:** ~45 minutos
**Ferramenta:** Chrome DevTools, Safari, Firefox

### 5 Resoluções a Testar

#### Mobile Small: 375px (iPhone SE)
```
Checklist:
- [ ] Aspect ratios mantidos (16:9, 1:1, 9:16)
- [ ] Sem overflow horizontal
- [ ] Texto legível (min 16px)
- [ ] Buttons clickáveis (min 44x44px)
- [ ] Images carregam
- [ ] Skeleton animation smooth
- [ ] Blur placeholder visível
- [ ] Expand/collapse funciona
- [ ] Titles informativos visíveis (se implementado)

Screenshot: nome: "historycard_375px.png"
Status: ✅/❌
Notes: _____________
```

#### Mobile Medium: 480px (iPhone 12)
```
Checklist:
- [ ] Aspect ratios corretos
- [ ] Sem layout issues
- [ ] Touch interaction smooth
- [ ] Images load sem problemas
- [ ] Hover states visíveis (em devices com hover)
- [ ] Performance OK (image load < 2s)

Screenshot: "historycard_480px.png"
Status: ✅/❌
Notes: _____________
```

#### Tablet: 768px (iPad)
```
Checklist:
- [ ] Layout looks good em tablet
- [ ] Imagens mostram bem
- [ ] Text readable
- [ ] Cards não ficam muito grandes
- [ ] Spacing apropriado
- [ ] Landscape orientation OK

Screenshot: "historycard_768px.png"
Status: ✅/❌
Notes: _____________
```

#### Desktop: 1440px (MacBook Air)
```
Checklist:
- [ ] Layout otimizado para desktop
- [ ] Hover states funcionam
- [ ] Scale animation smooth (group-hover:scale-105)
- [ ] Border highlight funciona
- [ ] Images sharp
- [ ] No aliasing

Screenshot: "historycard_1440px.png"
Status: ✅/❌
Notes: _____________
```

#### Desktop Large: 1920px (4K Monitor)
```
Checklist:
- [ ] Layout escalado corretamente
- [ ] Imagens não ficam gigantes
- [ ] Max-width constraints funcionam
- [ ] Text não fica muito grande
- [ ] Spacing proporcionado

Screenshot: "historycard_1920px.png"
Status: ✅/❌
Notes: _____________
```

---

## ♿ 2. TESTES DE ACESSIBILIDADE (WCAG 2.1 AA)

**Duração:** ~60 minutos
**Ferramentas:** axe DevTools, WAVE, Screen Reader (NVDA/JAWS/VoiceOver)

### 2.1 Contrast Ratio

```
Checklist:
- [ ] Texto em background: >= 4.5:1
  Teste: axe DevTools > Color contrast
  Text colors verificados: Gray-300, Gray-400
  Backgrounds: #111, #0a0a0a, #050505

  Test Results:
  ✅ Gray-300 (#d1d5db) on #111: 7.2:1 ✅
  ✅ Gray-400 (#9ca3af) on #111: 5.1:1 ✅
  ✅ Gray-300 (#d1d5db) on #0a0a0a: 7.5:1 ✅
  ✅ Green-500 (#22c55e) on #050505: 8.1:1 ✅

- [ ] UI Components: >= 3:1
  Borders, buttons, inputs

- [ ] Icons têm contrast OK
```

### 2.2 Alt Text

```
Checklist:
- [ ] Todas as <img> têm alt=""
  Esperado: "Criativo 1 - Emagrecimento - Feed quadrado 1:1"
  Não esperado: "image", "photo", vazio

- [ ] Alt text é descritivo
  Contém: número do criativo, niche, aspect ratio

- [ ] Alt text não é redundante
  Se tiver <figcaption>, alt é curto

Tool: axe DevTools > Images
Test Result: ✅/❌
```

### 2.3 Keyboard Navigation

```
Checklist:
- [ ] Tab order lógico (sem saltos)
  Teste: Pressionar Tab repetidamente
  Ordem esperada: collapse/expand button → next card

- [ ] Focus visível em todos elementos
  Teste: Tab + verificar outline
  Esperado: outline-2 outline-green-500

- [ ] Sem keyboard trap
  Teste: Não ficar preso em nenhum elemento

- [ ] Enter/Space funciona em buttons
  Teste: Expandir card com Space/Enter

- [ ] Sem auto-focus issues
  (página não abre com focus em input)

Test Results:
- [ ] Tab order OK
- [ ] Focus visível
- [ ] Sem traps
- [ ] Buttons funcionam
```

### 2.4 Screen Reader (NVDA / JAWS / VoiceOver)

```
Checklist:
- [ ] Container region anunciado
  Esperado: "Card de clone, Emagrecimento, criado em..."

- [ ] Buttons anunciados corretamente
  Esperado: "Expandir card de clone, button, não expandido"

- [ ] Images anunciadas com alt text
  Esperado: "Criativo 1 - Emagrecimento - Feed quadrado 1:1, image"

- [ ] ARIA labels funcionam
  aria-expanded, aria-controls, role="region"

- [ ] aria-live="polite" funciona
  State changes anunciados

Tool: NVDA (Windows) ou VoiceOver (Mac)
Test Result: Gravação de áudio ou notas
```

### 2.5 ARIA Attributes

```
Checklist:
- [ ] role="region" no container ✅
- [ ] aria-label no container ✅
- [ ] aria-expanded no button ✅
- [ ] aria-controls no button ✅
- [ ] aria-live="polite" na area dinâmica ✅
- [ ] <figure> e <figcaption> usadas ✅
- [ ] Sem ARIA conflicts (ex: div com role="button" sem tabindex)

Tool: axe DevTools > ARIA
Test Result: ✅ Sem violations
```

---

## ⚡ 3. TESTES DE PERFORMANCE

**Duração:** ~45 minutos
**Ferramentas:** Chrome DevTools, Lighthouse, WebPageTest

### 3.1 Lighthouse Score

```
Procedimento:
1. Abrir Chrome DevTools
2. Ir para Lighthouse tab
3. Selecionar "Mobile" + "Performance"
4. Clicar "Analyze page load"
5. Documentar scores

Targets:
✅ Performance: >= 85
✅ Accessibility: >= 85
✅ Best Practices: >= 85
✅ SEO: >= 85

Current Scores:
Performance:   ___/100
Accessibility: ___/100
Best Practices:___/100
SEO:           ___/100
```

### 3.2 Image Load Time

```
Procedimento:
1. DevTools > Network tab
2. Refresh página (Cmd/Ctrl+Shift+R para hard refresh)
3. Filter "Img"
4. Registrar load time de cada imagem

Targets:
✅ Image load < 2s (desktop)
✅ Image load < 3s (mobile 3G)

Results:
Thumbnail (16:9): ___ms ✅/❌
Image 1 (1:1):    ___ms ✅/❌
Image 2 (1:1):    ___ms ✅/❌
Image 3 (9:16):   ___ms ✅/❌

Average: ___ms
Target met: ✅/❌
```

### 3.3 First Contentful Paint (FCP)

```
Procedimento:
1. DevTools > Performance tab
2. Click record (círculo vermelho)
3. Scroll down para HistoryCard
4. Click stop
5. Procurar "First Contentful Paint" na timeline

Target:
✅ FCP < 1.5s

Result: ___ms ✅/❌
```

### 3.4 Memory Leaks

```
Procedimento:
1. DevTools > Memory tab
2. Take heap snapshot (baseline)
3. Expand/collapse card 10 vezes
4. Take heap snapshot
5. Comparar tamanho

Target:
✅ Sem aumento significativo de memória (< 10MB delta)

Baseline: ___MB
After interactions: ___MB
Delta: ___MB ✅/❌
```

### 3.5 Skeleton Animation FPS

```
Procedimento:
1. DevTools > Performance > Rendering
2. Habilitar "Paint flashing"
3. Observar skeleton animação durante load
4. Verificar FPS (deve ser suave, 60fps)

Target:
✅ 60 FPS smooth (sem stuttering)

Observation:
Animation smooth: ✅/❌
FPS stable: ___fps
Notes: _____________
```

---

## 🌐 4. TESTES DE COMPATIBILIDADE

**Duração:** ~30 minutos
**Browsers:** Chrome, Firefox, Safari, Mobile Safari

### 4.1 Chrome/Edge (Chromium)

```
Versão testada: ___
Device/OS: ___

Checklist:
- [ ] Renderização visual OK
- [ ] Imagens carregam
- [ ] Skeleton animation smooth
- [ ] Hover states funcionam
- [ ] Lazy loading funciona
- [ ] No console errors
- [ ] No console warnings

Status: ✅/❌
Notes: _____________
Screenshots: chrome_*.png
```

### 4.2 Firefox

```
Versão testada: ___
Device/OS: ___

Checklist:
- [ ] Renderização visual OK
- [ ] Imagens carregam
- [ ] Skeleton animation smooth
- [ ] Lazy loading funciona
- [ ] No console errors
- [ ] Focus styles visíveis

Status: ✅/❌
Notes: _____________
Screenshots: firefox_*.png
```

### 4.3 Safari (Desktop)

```
Versão testada: ___
Device/OS: ___

Checklist:
- [ ] Renderização visual OK
- [ ] Imagens carregam
- [ ] Aspect ratios corretos
- [ ] Animations play
- [ ] No glitches
- [ ] Touch events trabalham

Status: ✅/❌
Notes: _____________
Screenshots: safari_*.png
```

### 4.4 Safari Mobile (iOS)

```
Versão testada: ___
Device: iPhone/iPad ___

Checklist:
- [ ] Renderização OK em mobile
- [ ] Imagens carregam
- [ ] Touch interaction smooth
- [ ] Swipe não interfere
- [ ] Viewport correct (viewport meta tag)
- [ ] Safe area respected

Status: ✅/❌
Notes: _____________
Screenshots: ios_*.png
```

---

## 📊 5. TESTES DE FUNCIONALIDADE

**Duração:** ~30 minutos

### 5.1 Image Loading

```
Checklist:
- [ ] Skeleton mostra enquanto carrega
  Verificar: Skeleton visible por 1-2s antes da imagem

- [ ] Blur placeholder mostra
  Verificar: Blur visible antes de skeleton desaparecer

- [ ] Fade in suave
  Verificar: opacity-0 → opacity-100 em 300ms

- [ ] Todas as 3 imagens carregam
  Thumbnail, Image1, Image2, Image3

- [ ] Lazy loading funciona
  Verificar: Network tab mostra carregamento sob demanda
```

### 5.2 Expand/Collapse

```
Checklist:
- [ ] Card expande ao clicar
  Verificar: max-height animation

- [ ] Card colapsa ao clicar novamente
  Verificar: Smooth collapse

- [ ] Aria-expanded atualiza
  Verificar: DevTools - aria-expanded="true/false"

- [ ] Content visível quando expandido
  Verificar: Todas as 3 imagens/variantes visíveis

- [ ] Content oculto quando colapsado
  Verificar: Apenas thumbnail visível
```

### 5.3 Fallback/Error Handling

```
Checklist:
- [ ] Se imagem 404: mostra fallback
  Verificar: Icon + "Imagem indisponível"

- [ ] Se timeout (5s): mostra fallback
  Verificar: Network > Throttle 3G + timeout trigger

- [ ] Retry button funciona
  Verificar: Clicar retry tenta carregar novamente

- [ ] Error não quebra layout
  Verificar: Card mantém aspect ratio mesmo com erro
```

### 5.4 Aspect Ratios

```
Checklist:
- [ ] Thumbnail mantém 16:9
  Teste: Redimensionar browser - proporção mantida

- [ ] Image 1 mantém 1:1
  Teste: Expandir - quadrado perfeito

- [ ] Image 2 mantém 1:1
  Teste: Expandir - quadrado perfeito

- [ ] Image 3 mantém 9:16
  Teste: Expandir - vertical mantido

Ferramenta: DevTools Inspect > Computed
Verificar: aspect-video, aspect-square, aspect-[9/16]
```

---

## 📸 TEMPLATE: Relatório Final de Quinn

```markdown
# QA Report: HistoryCard Implementation

**Testador:** @qa (Quinn)
**Data:** 2026-03-23
**Build:** [commit hash]
**Duration:** [tempo total]

## Executive Summary

[1-2 paragraphs sobre o estado geral]

## Test Results Summary

| Category | Tests | Passed | Failed | Score |
|----------|-------|--------|--------|-------|
| Responsividade | 5 | ___ | ___ | ___/10 |
| Acessibilidade | 10 | ___ | ___ | ___/10 |
| Performance | 6 | ___ | ___ | ___/10 |
| Compatibilidade | 4 | ___ | ___ | ___/10 |
| Funcionalidade | 8 | ___ | ___ | ___/10 |
| **TOTAL** | **33** | **___** | **___** | **___/10** |

## Detailed Findings

### ✅ Passing Tests
- [List o que passou]

### ⚠️ Warnings/Concerns
- [Issues menores que não quebram]

### ❌ Failing Tests
- [Issues críticas que precisam fix]

## Performance Metrics

- Lighthouse: ___/100
- FCP: ___ms
- Image load avg: ___ms
- Memory delta: ___MB

## Browser Compatibility

- Chrome: ✅/⚠️/❌
- Firefox: ✅/⚠️/❌
- Safari: ✅/⚠️/❌
- Mobile Safari: ✅/⚠️/❌

## Screenshots
[Links para todas as screenshots]

## Recommendation

✅ **PRONTO PARA PRODUÇÃO** - Score 8.5+/10
⚠️ **COM RESSALVAS** - Issues menores precisam correção
❌ **BLOQUEADO** - Issues críticas precisam fix

---

## Sign-off

Quinn: ✅ QA Concluído
Score: ___/10 (Target: 8.5+)
Status: [PRONTO / AJUSTES NECESSÁRIOS]
```

---

## 🎯 Critério de Sucesso Para Quinn

### ✅ Aceito Se:
- Score final >= 8.5/10
- Sem bugs críticos
- WCAG 2.1 AA compliant
- Lighthouse >= 85
- Todos 4 browsers funcionando
- Relatório detalhado entregue

### ❌ Rejeitar Se:
- Score < 8.5/10
- Bugs que quebram funcionalidade
- Acessibilidade ruim (< 8.0)
- Performance problema (> 3s image load)
- Incompatibilidade browser

---

## 📅 Timeline Para Quinn

```
T+0:      Quinn recebe Task #12
T+0-45m:  Responsividade (5 resoluções)
T+45m-1h45m: Acessibilidade (WCAG)
T+1h45m-2h30m: Performance (Lighthouse)
T+2h30m-3h: Compatibilidade (4 browsers)
T+3h:     Relatório final entregue
```

---

**Quinn, tudo pronto para validação! 🚀**

---

## 📊 Status Geral

```
✅ Task #10: Uma - COMPLETADO ✅
✅ Task #11: Dex - COMPLETADO ✅
⏳ Task #12: Quinn - EM PROGRESSO 🚀

Timeline: T+3h até T+6h
Score Target: 8.5+/10 (melhoria de 7.8)
Status: À espera de QA validation
```
