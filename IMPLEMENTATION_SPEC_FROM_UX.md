# 🎯 Especificação de Implementação — Aprovada por @ux-design-expert

**De:** @ux-design-expert (Uma)
**Para:** @dev (Dex)
**Data:** 2026-03-23
**Status:** ✅ APROVADO — Pronto para implementação

---

## ✅ Aprovações de Uma

### 4 Recomendações Críticas

#### 1. ✅ Estados de Carregamento — APROVADO (CRÍTICO)
**Implementar:** Skeleton loading + blur placeholder

```tsx
// Skeleton Component
- Use: react-loading-skeleton
- npm install react-loading-skeleton
- Duração animação: 1.5s
- Cores: #050505 → #0a0a0a (dark theme)

// Blur Placeholder
- blurDataURL: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%23050505' width='400' height='225'/%3E%3C/svg%3E"
- placeholder="blur"
- Transição suave (200ms fade)
```

**Prioridade:** 🔴 CRÍTICO
**Score Impact:** +1.0 (6/10 → 7/10)

---

#### 2. ✅ Lazy Loading — APROVADO (CRÍTICO)
**Implementar:** Lazy load + timeout

```tsx
// Next.js Image
- loading="lazy"
- Intersection Observer para iniciar fetch
- Timeout: 5s para fallback

// Fetch Behavior
- Inicia quando elemento entra viewport
- Mostra skeleton enquanto carrega
- Fallback para imagem genérica se timeout
```

**Prioridade:** 🔴 CRÍTICO
**Score Impact:** +1.0 (6/10 → 7/10)

---

#### 3. ✅ Acessibilidade — APROVADO (CRÍTICO)
**Implementar:** Alt text + ARIA labels

```tsx
// Alt Text (template)
`Criativo ${index + 1} - ${clone.niche} - ${aspect_ratio}`
Exemplo: "Criativo 1 - Emagrecimento - Feed quadrado 1:1"

// ARIA Labels
aria-label="Expandir card de clone ${index}"
aria-expanded={isExpanded}
role="region" aria-label="Variantes de imagem"
aria-live="polite"

// Semantic HTML
<section> para container
<figure> para cada imagem
<figcaption> para descrição
```

**Prioridade:** 🔴 CRÍTICO
**Score Impact:** +2.5 (6/10 → 8.5/10)

---

#### 4. ✅ Performance — APROVADO (CRÍTICO)
**Implementar:** Otimização de imagens

```tsx
// Image Optimization
- WebP format (next/image + formats)
- Sizes: "100vw" ou "(max-width: 640px) 100vw, 50vw"
- Priority: false (lazy by default)
- Quality: 75 (balance quality/size)

// Caching
- IndexedDB cache para imagens já carregadas
- Cache duration: 7 dias
- Cache key: `${imageUrl}_${aspectRatio}`

// Error Handling
- onError callback
- Fallback image (placeholder)
- Retry button (manual)
- Error message (acessível)
```

**Prioridade:** 🔴 CRÍTICO
**Score Impact:** +2.5 (6/10 → 8.5/10)

---

### 6 Melhorias Opcionais

#### 1. ✅ Títulos Informativos — APROVADO (OPCIONAL)
**Implementar:** Labels de aspect ratio

```tsx
// Mostrar em mobile
<div className="text-xs text-gray-400 mt-1">
  {aspectRatio === '1:1' && 'Feed quadrado'}
  {aspectRatio === '9:16' && 'Stories vertical'}
  {aspectRatio === '16:9' && 'Thumbnail video'}
</div>

// Desktop: desnecessário
```

**Prioridade:** 🟡 MÉDIA
**Score Impact:** +0.2

---

#### 2. ✅ Indicadores de Estado — APROVADO (OPCIONAL)
**Implementar:** Visual feedback

```tsx
// Estados
- Loading: Skeleton animation
- Success: Imagem + fade in
- Error: ❌ Icon + retry button
- Cached: ⚡ Badge (opcional)

// Componente de Status
<div className="absolute top-2 right-2">
  {isLoading && <Spinner />}
  {isError && <ErrorBadge />}
  {isCached && <CachedBadge />}
</div>
```

**Prioridade:** 🟡 MÉDIA
**Score Impact:** +0.3

---

#### 3. ✅ Animações Suaves — APROVADO (OPCIONAL)
**Implementar:** Transições melhoradas

```tsx
// Image Fade-in
transition-opacity duration-300
opacity-0 → opacity-100

// Expand Animation
max-height transition
Easing: cubic-bezier(0.4, 0, 0.2, 1)

// Skeleton Pulse
animation-pulse duration-2000
Loops infinito até image load
```

**Prioridade:** 🟢 BAIXA
**Score Impact:** +0.2

---

#### 4. ✅ Feedback Visual — APROVADO (OPCIONAL)
**Implementar:** Hover states

```tsx
// Hover Scale
group-hover:scale-105
transition-transform duration-500

// Border Highlight
group-hover:border-green-500/30
transition-colors duration-300

// Shadow Glow
group-hover:shadow-lg
shadow-green-500/10
```

**Prioridade:** 🟢 BAIXA
**Score Impact:** +0.1

---

#### 5. ✅ Cache Local — APROVADO (OPCIONAL)
**Implementar:** IndexedDB para imagens

```tsx
// Cache Strategy
- Check IndexedDB on mount
- If cached + not expired: use cached URL
- If not cached: fetch + cache + display
- TTL: 7 dias
- Max size: 50MB

// Implementation
Use: idb library (npm install idb)
Key format: `historycard_${imageUrl}`
Value: { url, timestamp, aspectRatio }
```

**Prioridade:** 🟢 BAIXA
**Score Impact:** +0.2

---

#### 6. ✅ Error Handling — APROVADO (OPCIONAL)
**Implementar:** Tratamento robusto

```tsx
// Error States
- Timeout (5s): Mostrar fallback
- 404: Mostrar icon + mensagem
- Network error: Retry button
- Permission denied: Informar usuário

// Fallback Image
<div className="w-full h-full bg-gray-800 flex items-center justify-center">
  <ImageIcon className="text-gray-500" />
  <p className="text-xs text-gray-400 mt-2">Imagem indisponível</p>
</div>

// Retry Logic
<button onClick={retryImageLoad}>
  🔄 Tentar novamente
</button>
```

**Prioridade:** 🟡 MÉDIA
**Score Impact:** +0.3

---

## 📋 Priorização Final de Uma

### 🔴 CRÍTICO (Implementar primeiro)
1. Estados de carregamento (Skeleton + blur)
2. Lazy loading
3. Acessibilidade (Alt + ARIA)
4. Performance (Otimização)

**Impacto:** +7.0 pontos (6 → 13, mas capped at 10)
**Duração:** ~2-3h

---

### 🟡 MÉDIO (Implementar se tempo permitir)
1. Indicadores de estado
2. Error handling robusto
3. Títulos informativos

**Impacto:** +0.8 pontos
**Duração:** ~30-45min

---

### 🟢 BAIXO (Nice-to-have)
1. Animações suaves
2. Feedback visual melhorado
3. Cache local (IndexedDB)

**Impacto:** +0.5 pontos
**Duração:** ~30min

---

## 🎯 Especificações de Uma

### Componentes a Usar

```
✅ react-loading-skeleton
   npm install react-loading-skeleton
   import Skeleton from 'react-loading-skeleton'
   import 'react-loading-skeleton/dist/skeleton.css'

✅ next/image (já instalado)
   placeholder="blur"
   loading="lazy"
   quality={75}

✅ lucide-react (icons, já instalado)
   <AlertCircle /> para errors
   <Loader /> para loading
   <Image /> para fallback

✅ idb (para cache opcional)
   npm install idb
   import { openDB } from 'idb'
```

---

### Classes Tailwind Aprovadas

```tsx
// Container
"border border-green-500/20 rounded-xl p-5 bg-gray-900 hover:border-green-500/30"

// Images
"w-full h-full object-cover group-hover:scale-105 transition-transform"

// Skeleton
"bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse rounded-lg"

// States
"opacity-0 group-data-[loaded]:opacity-100 transition-opacity duration-300"

// Focus
"focus-visible:outline-2 outline-green-500 outline-offset-2"
```

---

### ARIA Labels Detalhados

```tsx
// Container
<div
  role="region"
  aria-label={`Clone criado - ${clone.niche} - ${createdDate}`}
>

// Expand Button
<button
  aria-expanded={isExpanded}
  aria-controls={`clone-details-${clone.id}`}
>

// Image Section
<section
  id={`clone-details-${clone.id}`}
  aria-label="Variantes de imagem geradas"
  role="region"
>

// Each Image
<figure aria-label={`Criativo ${index + 1}`}>
  <img alt={`Criativo ${index + 1} - ${clone.niche} - ${aspectRatio}`} />
  <figcaption className="sr-only">
    {aspectRatio}, gerado em {date}
  </figcaption>
</figure>
```

---

## 🔍 Checklist para Dex

- [ ] Instalar react-loading-skeleton
- [ ] Adicionar blur placeholder data URLs
- [ ] Implementar Skeleton loading UI
- [ ] Adicionar lazy loading em todas as imagens
- [ ] Implementar timeout de 5s para imagens
- [ ] Adicionar alt text descritivo
- [ ] Adicionar ARIA labels
- [ ] Implementar error handling com fallback
- [ ] Adicionar retry button
- [ ] Implementar indicators (loading, error, cached)
- [ ] Otimizar imagens (WebP, sizes)
- [ ] Adicionar smooth transitions
- [ ] Testes unitários para:
  - [ ] Skeleton loading
  - [ ] Lazy loading
  - [ ] Error handling
  - [ ] Accessibility (ARIA labels)
- [ ] npm run build ✅
- [ ] npm run lint ✅
- [ ] npm test ✅
- [ ] TypeScript strict mode ✅

---

## 📊 Score Target Após Implementação

```
Antes (Uma avaliou):
├─ Visual:        8/10
├─ Responsividade: 8/10
├─ Acessibilidade: 6/10  ⚠️
├─ Performance:    6/10  ⚠️
└─ UX:            8/10
   TOTAL: 7.8/10

Depois (Target após Dex):
├─ Visual:        8.5/10  ↑
├─ Responsividade: 8.5/10  ↑
├─ Acessibilidade: 8.5/10  ↑ +2.5 (CRÍTICO)
├─ Performance:    8.5/10  ↑ +2.5 (CRÍTICO)
└─ UX:            8.5/10  ↑
   TOTAL: 8.5/10  ↑ +0.7 ✅
```

---

## ✅ Aprovação de Uma

**Status:** ✅ APROVADO
**Data:** 2026-03-23
**Assinado por:** @ux-design-expert (Uma)

**Comentário:**
> "Especificação clara e viável. 4 críticos são essenciais - vão resolver os problemas de acessibilidade e performance. Os 6 opcionais melhoram a experiência. Dex pode começar com confiança. Target de 8.5/10 é alcançável com estas implementações."

---

## 🚀 Próximos Passos para Dex

1. ✅ Revisar esta especificação
2. ✅ Instalar dependências (react-loading-skeleton, idb)
3. ✅ Implementar 4 críticos (2-3h)
4. ✅ Testar build e lint
5. ✅ Implementar 6 opcionais (30-45min) se tempo
6. ✅ Escrever testes unitários
7. ✅ Fazer commit com referência a esta task
8. ✅ Marcar Task #11 como concluída

**Bloqueado por:** ✅ Uma (Task #10) — CONCLUÍDO
**Bloqueando:** Task #12 (Quinn QA)

---

**Dex, está tudo pronto! Você pode começar a implementação! 💻🚀**
