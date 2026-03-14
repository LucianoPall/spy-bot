# UX Implementation Guide: Melhorias em HistoryCard.tsx

**Guia prático com exemplos de código para implementar as 4 recomendações críticas**

---

## 1. CRÍTICA #1: Adicionar Blur Placeholder e Lazy Loading

### Problema
As imagens carregam sem placeholder visual, criando "pop-in" abrupto que prejudica perceived performance.

### Solução
Usar Next.js Image `placeholder="blur"` + `loading="lazy"`

### Implementação

**Passo 1:** Criar função helper para gerar blur dataURL

```typescript
// src/utils/image-blur.ts
export const generateBlurDataURL = (width: number = 400, height: number = 225, color: string = '#050505'): string => {
    // SVG blur simples (1x1 pixel)
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(color)}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
};
```

**Passo 2:** Atualizar HistoryCard.tsx

```tsx
// ANTES (Linha 69)
<Image
    src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
    alt="Thumbnail do Criativo 1"
    fill
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
/>

// DEPOIS
import { generateBlurDataURL } from "@/utils/image-blur";

<Image
    src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
    alt="Thumbnail do Criativo 1"
    fill
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    placeholder="blur"
    blurDataURL={generateBlurDataURL(400, 225)}
    loading="lazy"
    quality={75}
/>
```

**Mesmo padrão para linhas 105, 123, 141 (imagens expandidas)**

### Resultado Esperado
- ✅ Placeholder visual durante loading
- ✅ "Pop-in" suavizado com fade
- ✅ LCP (Largest Contentful Paint) melhorado
- ✅ Perceived performance +20%

### Tempo de Implementação
**~15 minutos**

---

## 2. CRÍTICA #2: Fixar Aspect Ratio em Mobile

### Problema
No mobile, V3 (9:16) fica significativamente mais alta que V1 e V2 (1:1), quebrando ritmo visual.

```
MOBILE (grid-cols-1):
┌─────────────────┐
│  V1 (1:1)       │ altura = 360px
└─────────────────┘
┌─────────────────┐
│  V2 (1:1)       │ altura = 360px
└─────────────────┘
┌─────────────────┐
│  V3 (9:16)      │ altura = 640px  ❌ DESIGUAL
└─────────────────┘
```

### Solução
Aplicar aspect ratio responsivo: mobile 1:1, desktop 9:16

### Implementação

```tsx
// ANTES (Linha 140)
<div className="w-full aspect-[9/16] bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
    {clone.image3 && <Image src={...} alt="V3" fill className="w-full h-full object-cover" />}
</div>

// DEPOIS
<div className="w-full aspect-square md:aspect-square lg:aspect-[9/16] bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative">
    {clone.image3 && <Image src={...} alt="V3" fill className="w-full h-full object-cover" />}
</div>
```

### Alternativa (mais elegante)
```tsx
// Usando objeto de estilos condicionais
<div className={`
    w-full bg-[#050505] rounded-lg mb-4 overflow-hidden border border-[#222] relative
    ${isExpanded ? 'aspect-square md:aspect-square lg:aspect-[9/16]' : 'aspect-video'}
`}>
    {clone.image3 && <Image src={...} alt="V3" fill className="w-full h-full object-cover" />}
</div>
```

### Resultado Esperado
```
MOBILE (grid-cols-1):
┌─────────────────┐
│  V1 (1:1)       │ altura = 360px
└─────────────────┘
┌─────────────────┐
│  V2 (1:1)       │ altura = 360px
└─────────────────┘
┌─────────────────┐
│  V3 (1:1)       │ altura = 360px ✅ UNIFORME
└─────────────────┘

DESKTOP (grid-cols-3):
┌──────────┐ ┌──────────┐ ┌──────────┐
│ V1 (1:1) │ │ V2 (1:1) │ │ V3 (9:16)│  ✅ INTENCIONAL
│ 300×300  │ │ 300×300  │ │ 300×533  │
└──────────┘ └──────────┘ └──────────┘
```

### Tempo de Implementação
**~10 minutos**

---

## 3. CRÍTICA #3: Melhorar Alt Text Descritivo

### Problema
Alt text atual é genérico ("V1", "V2", "V3") → não descreve conteúdo para leitores de tela

### Solução
Incluir contexto: tipo de variante + nicho + data

### Implementação

**Passo 1:** Criar função helper para gerar alt text

```typescript
// src/utils/alt-text.ts
export const generateAltText = (
    variant: 'thumbnail' | 'v1' | 'v2' | 'v3',
    niche?: string,
    createdAt?: string,
): string => {
    const dateStr = createdAt
        ? new Date(createdAt).toLocaleDateString('pt-BR')
        : 'Sem data';

    const nicheStr = niche || 'Sem Nicho';

    const descriptions = {
        thumbnail: `Thumbnail do Criativo ${nicheStr} criado em ${dateStr}`,
        v1: `Dor Extrema (Variante 1) - Feed 1:1 - Criativo de ${nicheStr}`,
        v2: `Solução Direta (Variante 2) - Feed 1:1 - Criativo de ${nicheStr}`,
        v3: `Storytelling (Variante 3) - Stories 9:16 - Criativo de ${nicheStr}`,
    };

    return descriptions[variant];
};
```

**Passo 2:** Usar em HistoryCard.tsx

```tsx
import { generateAltText } from "@/utils/alt-text";

// ANTES (Linha 69)
<Image
    src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
    alt="Thumbnail do Criativo 1"
    fill
    className="..."
/>

// DEPOIS
<Image
    src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
    alt={generateAltText('thumbnail', clone.niche, clone.created_at)}
    fill
    className="..."
/>
```

**Mesmo padrão para outras imagens:**

```tsx
// Linha 105 - V1
alt={generateAltText('v1', clone.niche)}

// Linha 123 - V2
alt={generateAltText('v2', clone.niche)}

// Linha 141 - V3
alt={generateAltText('v3', clone.niche)}
```

### Exemplos de Output
```
Thumbnail: "Thumbnail do Criativo Marketing Digital criado em 13/03/2026"
V1: "Dor Extrema (Variante 1) - Feed 1:1 - Criativo de Marketing Digital"
V2: "Solução Direta (Variante 2) - Feed 1:1 - Criativo de Marketing Digital"
V3: "Storytelling (Variante 3) - Stories 9:16 - Criativo de Marketing Digital"
```

### Benefícios
- ✅ Screen readers (NVDA, JAWS) descrevem imagem corretamente
- ✅ SEO melhorado com alt text rico
- ✅ Acessibilidade WCAG AA+ atingida
- ✅ Fallback útil quando imagem não carrega

### Tempo de Implementação
**~15 minutos**

---

## 4. CRÍTICA #4: Adicionar Focus-Visible em Botões

### Problema
Usuários navegando por teclado não veem qual botão está focado

### Solução
Adicionar ring de foco visível com cores do tema

### Implementação

**Opção A: Adicionar a todos os botões**

```tsx
// ANTES (Linhas 110, 128, 146)
<button
    onClick={() => handleCopy(clone.variante1, 'v1')}
    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 rounded-lg text-gray-300 font-medium text-xs transition-colors"
>

// DEPOIS
<button
    onClick={() => handleCopy(clone.variante1, 'v1')}
    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#151515] hover:bg-[#252525] border border-[#2a2a2a] py-2 rounded-lg text-gray-300 font-medium text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
>
```

**Padrão para todos os 3 botões "Copiar":**
```tsx
className="...focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
```

**Opção B: Criar classe Tailwind reutilizável**

```css
/* src/app/globals.css */
@layer components {
  .btn-focus {
    @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a];
  }
}
```

Usar em todos os botões:
```tsx
<button className="...btn-focus">Copiar</button>
```

**Botão Expandir (Linha 159-170):**

```tsx
// ANTES
<button
    onClick={() => setIsExpanded(!isExpanded)}
    className={`mt-auto w-full border font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${isExpanded
        ? 'bg-[#151515] hover:bg-[#222] border-[#333] text-gray-400'
        : 'bg-green-600/10 hover:bg-green-600/20 border-green-500/20 text-green-500 hover:border-green-500/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]'
    }`}
>

// DEPOIS
<button
    onClick={() => setIsExpanded(!isExpanded)}
    className={`mt-auto w-full border font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm btn-focus ${isExpanded
        ? 'bg-[#151515] hover:bg-[#222] border-[#333] text-gray-400'
        : 'bg-green-600/10 hover:bg-green-600/20 border-green-500/20 text-green-500 hover:border-green-500/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]'
    }`}
>
```

### Links "Abrir Imagem" (Linhas 114, 132, 150)

```tsx
// ANTES
<a href={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
   download
   target="_blank"
   rel="noopener noreferrer"
   className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors">
   Abrir Imagem em Alta
</a>

// DEPOIS
<a href={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
   download
   target="_blank"
   rel="noopener noreferrer"
   className="mt-2 w-full flex items-center justify-center gap-2 text-green-500/70 hover:text-green-400 text-xs py-1 transition-colors btn-focus">
   Abrir Imagem em Alta
</a>
```

### Teste de Acessibilidade
```bash
# Testar com Tab key
1. Abra o site
2. Pressione Tab repetidamente
3. Verifique se ring verde aparece ao redor de cada elemento focado
4. Verifique se ring offset (espaço) é visível em fundo #0a0a0a
```

### Resultado Visual
```
ANTES:
[Copiar] ← sem foco visual em teclado ❌

DEPOIS (com Tab focado):
┌─────────────────────────────┐
│  ring offset (preto)         │
│ ┌─────────────────────────┐  │
│ │ [Copiar] ring (verde) │  │
│ └─────────────────────────┘  │
└─────────────────────────────┘  ✅ VISÍVEL
```

### Tempo de Implementação
**~10 minutos** (ou ~5 min se usar classe reutilizável)

---

## 5. Checklist de Implementação

### Tarefa 1: Blur Placeholder
- [ ] Criar `src/utils/image-blur.ts`
- [ ] Importar em HistoryCard.tsx
- [ ] Adicionar `placeholder="blur"` em linha 69
- [ ] Adicionar `blurDataURL` em linha 69
- [ ] Adicionar `loading="lazy"` em linha 69
- [ ] Repetir para linhas 105, 123, 141
- [ ] Testar em dev (npm run dev)
- [ ] Verificar Lighthouse Performance

### Tarefa 2: Aspect Ratio Mobile
- [ ] Atualizar classe em linha 140
- [ ] Testar em mobile (360px)
- [ ] Testar em tablet (768px)
- [ ] Testar em desktop (1920px)
- [ ] Verificar uniformidade visual

### Tarefa 3: Alt Text
- [ ] Criar `src/utils/alt-text.ts`
- [ ] Importar em HistoryCard.tsx
- [ ] Substituir alt em linha 69
- [ ] Substituir alt em linhas 105, 123, 141
- [ ] Testar com screen reader (NVDA ou similar)

### Tarefa 4: Focus-Visible
- [ ] Adicionar classe `.btn-focus` em `globals.css` OU adicionar inline
- [ ] Atualizar className em linhas 110, 128, 146
- [ ] Atualizar className em linhas 159, 114, 132, 150
- [ ] Testar navegação por teclado (Tab)
- [ ] Verificar contraste do ring (4.5:1+)

---

## 6. Ordem de Implementação Recomendada

1. **Primeiro:** Alt Text (mais fácil, maior impacto acessibilidade)
2. **Segundo:** Focus-Visible (rápido, melhora keyboard nav)
3. **Terceiro:** Aspect Ratio Mobile (visual fix)
4. **Quarto:** Blur Placeholder (performance, mais complexo)

**Tempo Total Estimado:** 45 minutos para um dev experiente

---

## 7. Testes Pós-Implementação

### Teste de Performance
```bash
npm run build
npm run start

# Abrir em Chrome DevTools > Lighthouse
# Verificar scores:
# - Performance: 75+
# - Accessibility: 90+
# - Best Practices: 85+
```

### Teste de Acessibilidade
```bash
# 1. Screen Reader Test (Windows + Narrator)
Windows key + Ctrl + Enter

# 2. Keyboard Navigation
Tab, Shift+Tab, Enter, Space

# 3. Contrast Check
https://webaim.org/resources/contrastchecker/
```

### Teste Visual
```bash
# Mobile view (DevTools F12 > Ctrl+Shift+M)
- Verificar altura uniforme das 3 variantes
- Verificar placeholders durante loading
- Verificar hover effects funcionam em touch

# Desktop view
- Verificar aspect ratio 9:16 em V3
- Verificar transições suaves
- Verificar foco visível em teclado
```

---

## 8. Rollback (se necessário)

Se precisar reverter:
```bash
git diff src/components/HistoryCard.tsx  # ver mudanças
git checkout src/components/HistoryCard.tsx  # reverter arquivo
```

---

## 9. Documentação Para Código

Adicionar comentários explicativos:

```tsx
// HistoryCard.tsx - Seção de imports
import { generateAltText } from "@/utils/alt-text";
import { generateBlurDataURL } from "@/utils/image-blur";

// ... no JSX das imagens ...
{/*
  Imagem com placeholder blur para melhor perceived performance
  e alt text descritivo para acessibilidade (WCAG AA)
*/}
<Image
    src={`/api/proxy-image?url=${encodeURIComponent(clone.image1)}`}
    alt={generateAltText('thumbnail', clone.niche, clone.created_at)}
    fill
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    placeholder="blur"
    blurDataURL={generateBlurDataURL(400, 225)}
    loading="lazy"
    quality={75}
/>
```

---

## Referências

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WCAG 2.1 Alt Text](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)
- [Focus Visible CSS](https://drafts.csswg.org/selectors-4/#focus-visible-pseudo)
- [Tailwind Focus Styles](https://tailwindcss.com/docs/hover-focus-and-other-states#focus)

---

**Guia Preparado por:** @ux-design-expert (Uma)
**Data:** 13 de Março de 2026
**Versão:** 1.0

