# Instruções de Correção - Bug Critical Overflow

## Contexto

Durante o teste de responsividade realizado por QUINN (QA Engineer), foi identificado um bug crítico no arquivo de layout raiz que pode bloquear conteúdo em casos extremos.

## Bug Identificado

**Arquivo:** `src/app/layout.tsx`
**Linha:** 28
**Severidade:** CRÍTICA
**Tempo de Correção:** < 1 minuto

### Problema

```typescript
// CÓDIGO ATUAL (PROBLEMÁTICO)
<body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
  {children}
</body>
```

A classe `overflow-x-hidden` está impedindo scrolling horizontal legítimo em alguns casos extremos de viewport.

### Solução

```typescript
// CÓDIGO CORRIGIDO
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  {children}
</body>
```

Remover simplesmente a classe `overflow-x-hidden` da tag `<body>`.

## Por Que?

1. **overflow-x-hidden no body** é geralmente uma solução para um problema, não a causa
2. **Melhor prática** é deixar o navegador gerenciar overflow e aplicar em componentes individuais quando necessário
3. **Impacto negativo:** Pode bloquear conteúdo legítimo em casos extremos de viewport
4. **Sem impacto positivo:** Não resolve nenhum problema de overflow que já não esteja tratado no CSS

## Como Corrigir

### Passo 1: Abrir arquivo
```bash
cd /c/Users/lucia/Documents/Comunidade/aios-project/spy-bot-web
nano src/app/layout.tsx
# ou seu editor preferido
```

### Passo 2: Localizar linha 28
Procure por:
```typescript
className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
```

### Passo 3: Remover overflow-x-hidden
Alterar para:
```typescript
className={`${geistSans.variable} ${geistMono.variable} antialiased`}
```

### Passo 4: Salvar arquivo

### Passo 5: Testar responsividade
```bash
npm run dev
# Abrir em navegador e testar em diferentes resoluções
```

## Verificação Pós-Correção

- [ ] Arquivo salvo
- [ ] Servidor rodando sem erros
- [ ] Homepage carrega normal
- [ ] Sem scroll horizontal involuntário
- [ ] Responsividade mantida em todos breakpoints

## Próximas Etapas

1. Commitar a mudança com mensagem clara:
   ```bash
   git add src/app/layout.tsx
   git commit -m "fix: remove overflow-x-hidden from body to prevent content blocking"
   ```

2. Push para branch em desenvolvimento

3. Deploy para staging

4. Notify QUINN que correção foi feita para re-teste rápido

## Impacto da Mudança

- **Tamanho do commit:** 1 linha removida
- **Risco:** Muito baixo (melhora UX)
- **Performance:** Sem impacto
- **Compatibilidade:** Melhora cross-browser
- **Necessidade de teste:** Verificação visual em mobile

---

**Relatório Original:** RELATORIO_QA_RESPONSIVIDADE.md
**Data da Identificação:** 16/03/2026
**QA Engineer:** QUINN
