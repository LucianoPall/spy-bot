# QA Checklist - Filtros Avançados

**Data de Implementação**: 2026-03-19
**Desenvolvedor**: @dev (Claude)
**QA Responsável**: [_____]

---

## Testes Funcionais

### Filtro por Nicho

- [ ] **TC-001**: Ao clicar em um nicho, apenas clones desse nicho aparecem
  - Passos: Abrir /dashboard/history → Expandir "Filtros Avançados" → Clicar nicho
  - Esperado: Grid atualiza com clones do nicho
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-002**: Ao clicar novamente no nicho selecionado, deseleciona
  - Passos: Selecionar nicho → Clicar novamente
  - Esperado: Retorna ao estado anterior (sem filtro)
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-003**: Com nicho inválido, mostra "Nenhum clone encontrado"
  - Passos: Manual test (niche que não existe nos dados)
  - Esperado: Mensagem "Nenhum clone encontrado" + botão "Limpar filtros"
  - Resultado: ✅/❌ Nota: _______

---

### Filtro por Data

- [ ] **TC-004**: Selecionar data "De" filtra clones a partir dessa data
  - Passos: Selecionar "De: 2026-03-15" → Validar resultados
  - Esperado: Aparecem apenas clones >= 2026-03-15
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-005**: Selecionar data "Até" filtra clones até essa data
  - Passos: Selecionar "Até: 2026-03-18" → Validar resultados
  - Esperado: Aparecem apenas clones <= 2026-03-18 (incluso dia inteiro)
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-006**: Limpar data "De" enquanto "Até" está preenchido funciona
  - Passos: Preencher "De" e "Até" → Limpar "De" → Validar
  - Esperado: Filtra apenas por "Até"
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-007**: Range de data que não tem clones mostra mensagem vazia
  - Passos: Selecionar "De: 2026-04-01" e "Até: 2026-04-30"
  - Esperado: "Nenhum clone encontrado"
  - Resultado: ✅/❌ Nota: _______

---

### Filtro por Status (Favoritos)

- [ ] **TC-008**: Clicar em "Favoritos" mostra apenas clones com is_favorite=true
  - Passos: Clicar "Favoritos" → Validar que todos têm estrela/marcação
  - Esperado: Apenas favoritos aparecem
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-009**: Clicar em "Todos" volta a mostrar todos os clones
  - Passos: Clicar "Favoritos" → Clicar "Todos"
  - Esperado: Volta ao estado normal
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-010**: Status "Todos" é ativo por padrão
  - Passos: Abrir /dashboard/history
  - Esperado: Botão "Todos" tem background verde
  - Resultado: ✅/❌ Nota: _______

---

### Combinação de Filtros (AND Lógico)

- [ ] **TC-011**: Nicho + Data funcionam combinados
  - Passos: Selecionar EMAGRECIMENTO + De: 2026-03-10 + Até: 2026-03-18
  - Esperado: Apenas clones de EMAGRECIMENTO nesse período
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-012**: Nicho + Status funcionam combinados
  - Passos: Selecionar IGAMING + "Favoritos"
  - Esperado: Clones de IGAMING que são favoritos (intersecção)
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-013**: Data + Status funcionam combinados
  - Passos: De: 2026-03-01 + Até: 2026-03-15 + "Favoritos"
  - Esperado: Favoritos criados nesse período
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-014**: Todos 3 filtros funcionam combinados
  - Passos: EMAGRECIMENTO + De: 2026-03-10 + Até: 2026-03-18 + "Favoritos"
  - Esperado: Intersecção de todos 3 critérios
  - Resultado: ✅/❌ Nota: _______

---

### Botão "Limpar"

- [ ] **TC-015**: Botão "Limpar" só aparece quando há filtros ativos
  - Passos: Sem filtros → Com filtros
  - Esperado: Aparece/desaparece dinamicamente
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-016**: Clicar "Limpar" reseta todos os filtros
  - Passos: Ativar vários filtros → Clicar "Limpar"
  - Esperado: Todos os campos voltam ao estado padrão
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-017**: Após clicar "Limpar", mostra todos os clones novamente
  - Passos: Ativar filtros → Clicar "Limpar"
  - Esperado: Grid volta a mostrar todos os clones
  - Resultado: ✅/❌ Nota: _______

---

### Resumo de Filtros

- [ ] **TC-018**: Resumo de filtros mostra descrição legível
  - Passos: Ativar filtros → Verificar texto no resumo
  - Esperado: "Nicho: EMAGRECIMENTO • De: 10/03/2026 • Até: 18/03/2026 • Apenas favoritos"
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-019**: Resumo desaparece quando todos filtros são resetados
  - Passos: Ativar filtros → Clicar "Limpar"
  - Esperado: Seção de resumo desaparece
  - Resultado: ✅/❌ Nota: _______

---

## Testes de UI/UX

### Responsive Design

- [ ] **TC-020**: Mobile (375px): Filtros aparecem em coluna
  - Device: iPhone SE / Simulator
  - Esperado: Campos de data e nicho em stack vertical
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-021**: Tablet (768px): Filtros em layout médio
  - Device: iPad Mini / Simulator
  - Esperado: Nicho em wrap, data em grid 2 colunas
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-022**: Desktop (1024px+): Filtros lado a lado
  - Device: Desktop 1440px
  - Esperado: Todos os campos horizontalmente alinhados
  - Resultado: ✅/❌ Nota: _______

---

### Visual & Styling

- [ ] **TC-023**: Cores seguem tema dark (preto/cinza/verde)
  - Passos: Verificar visuais do componente
  - Esperado: #111, #0a0a0a, #22c55e usado corretamente
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-024**: Estados de botão (hover, active, focus) funcionam
  - Passos: Passar mouse e clicar em botões
  - Esperado: Transições smooth, cores corretas
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-025**: Inputs date têm focus state com border verde
  - Passos: Clicar em input date
  - Esperado: Border #22c55e/50 ao dar focus
  - Resultado: ✅/❌ Nota: _______

---

## Testes de Performance

- [ ] **TC-026**: Filtragem é instantânea (< 100ms) com 50 clones
  - Device: Desktop
  - Passos: Abrir DevTools → Performance → Filtrar
  - Esperado: Render completa em < 100ms
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-027**: Filtragem é instantânea (< 200ms) com 100 clones
  - Device: Desktop
  - Passos: Mesmo processo
  - Esperado: Render em < 200ms
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-028**: Sem lag ao mudar filtros rapidamente
  - Passos: Clicar múltiplos filtros em sequência rápida
  - Esperado: UI responsiva, sem stuttering
  - Resultado: ✅/❌ Nota: _______

---

## Testes de Compatibilidade

- [ ] **TC-029**: Funciona no Chrome/Edge (Chromium)
  - Browser: Chrome latest
  - Passos: Executar todos os TC-001 a TC-028
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-030**: Funciona no Firefox
  - Browser: Firefox latest
  - Passos: Executar subconjunto crítico
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-031**: Funciona no Safari
  - Browser: Safari latest (macOS/iOS)
  - Passos: Executar subconjunto crítico
  - Resultado: ✅/❌ Nota: _______

---

## Testes de Backward Compatibility

- [ ] **TC-032**: Filtros básicos (nicho + busca) continuam funcionando
  - Passos: Sem abrir "Filtros Avançados", usar filtros antigos
  - Esperado: Comportamento idêntico a antes
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-033**: Clones antigos (sem is_favorite) aparecem normalmente
  - Passos: Verificar clones legados no DB
  - Esperado: Aparecem sem erro, is_favorite=undefined/false
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-034**: Nenhuma quebra em componentes dependentes
  - Passos: Verificar HistoryCard, HistoryGallery com dados legados
  - Esperado: Sem console errors
  - Resultado: ✅/❌ Nota: _______

---

## Testes de Edge Cases

- [ ] **TC-035**: Selecionar data "Até" antes de "De"
  - Passos: De: 2026-03-20, Até: 2026-03-10
  - Esperado: Sem clones (ou comportamento lógico)
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-036**: Clicar em nicho com 0 clones
  - Passos: Selecionar nicho vazio
  - Esperado: Mostra "Nenhum clone encontrado"
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-037**: Busca funciona combinada com filtros avançados
  - Passos: Ativar filtros + digitar na busca
  - Esperado: Filtra por ambos
  - Resultado: ✅/❌ Nota: _______

---

## Testes de Acessibilidade

- [ ] **TC-038**: Labels dos campos estão presentes
  - Passos: Verificar HTML / VoiceOver
  - Esperado: Cada campo tem `<label>`
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-039**: Navegação por Tab funciona
  - Passos: Pressionar Tab repetidamente
  - Esperado: Foco se move entre botões/inputs
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-040**: Screen reader descreve filtros corretamente
  - Device: VoiceOver (macOS) ou NVDA (Windows)
  - Esperado: Elementos nomeados apropriadamente
  - Resultado: ✅/❌ Nota: _______

---

## Testes de Integração

- [ ] **TC-041**: Query Supabase inclui campo `is_favorite`
  - Verificar: `/src/app/dashboard/history/page.tsx`
  - Esperado: `.select(..., is_favorite)`
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-042**: Clone interface inclui `is_favorite?: boolean`
  - Verificar: `src/components/HistoryGallery.tsx`
  - Esperado: Type Clone tem campo is_favorite
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-043**: FilterOptions type está correto
  - Verificar: `src/lib/types.ts`
  - Esperado: Interface com niche, dateRange, status
  - Resultado: ✅/❌ Nota: _______

---

## Testes Unitários

- [ ] **TC-044**: Executar `npm test tests/filters.test.ts`
  - Esperado: Todos os 11 testes passam
  - Resultado: ✅/❌ Nota: _______

- [ ] **TC-045**: Coverage dos testes >= 80%
  - Esperado: Boa cobertura de código
  - Resultado: ✅/❌ Nota: _______

---

## Resumo de Resultados

**Total de Testes**: 45
**Testes Passando**: ___/45
**Taxa de Sucesso**: ___%

**Status Geral**: ⚠️ Precisa Revisão / ✅ Pronto para Produção / ❌ Rejeitar

**Observações Gerais**:
_________________________________________________________________
_________________________________________________________________

**QA Responsável**: _________________ **Data**: ___________

**Assinatura**: _________________________

---

## Próximas Ações (se aplicável)

- [ ] Bugs encontrados:
  1. _________________________
  2. _________________________
  3. _________________________

- [ ] Melhorias sugeridas:
  1. _________________________
  2. _________________________

---

**Referência**: IMPLEMENTATION_PLAN.md, Feature 1, Critérios de Sucesso
