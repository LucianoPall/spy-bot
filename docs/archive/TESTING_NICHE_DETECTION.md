# Guia de Testes — Niche Detection v2

**Data**: 2026-03-19
**Objetivo**: Validar sistema de detecção de nicho com scores de confiança

---

## 🧪 Testes Manuais Recomendados

### Test 1: Detecção Básica — Emagrecimento

**Setup:**
```
URL: facebook.com/ads/library?id=123&campaign=weight-loss-diet
Copy: "Emagreça 10kg em 30 dias sem academia. Método comprovado cientificamente."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "emagrecimento",
    "confidence": 0.90  // 90%+
  },
  "keywords": ["emagreça", "peso", "dieta", "fitness", "emagrecimento"],
  "source": "url",
  "secondary": null
}
```

**Verificação:**
- [ ] Nicho correto: `emagrecimento`
- [ ] Confiança > 80%
- [ ] Keywords incluem palavras-chave reais
- [ ] Source é "url" (pois URL tem keywords claros)

---

### Test 2: Fallback Inteligente — URL Genérica + Copy Específica

**Setup:**
```
URL: facebook.com/ads/library?id=456
Copy: "Ganhe R$5.000/mês trabalhando em casa! Renda passiva comprovada. Método testado."
```

**Esperado:**
1. Primeira análise (URL): `geral` com baixa confiança (< 30%)
2. Fallback acionado (confiança < 50%)
3. Segunda análise (URL + Copy): `renda_extra` com alta confiança (> 80%)

**Fluxo no Log:**
```
[1] Detecção inicial de URL:
    Nicho: geral (25%)
    Motivo: URL genérica

[2] Fallback inteligente acionado:
    Confiança (25%) < 50%

[3] Reanalisa com copy completo:
    Nicho: renda_extra (87%)
    Keywords: ganhe, renda, dinheiro, trabalho em casa, passiva
    Source: copy

[FINAL] Nicho atualizado para: renda_extra (87%)
```

**Verificação:**
- [ ] Log mostra 2 detecções
- [ ] Primeira com baixa confiança
- [ ] Segunda com alta confiança
- [ ] Nicho final correto

---

### Test 3: Detecção Multilíngue — Alemão

**Setup:**
```
URL: (genérico)
Copy (alemão): "Abnehmen Sie 10 kg mit unserem Gewichts-Protokoll.
              Kalorienarm und wissenschaftlich getestet.
              Fitness-Trainer empfohlen."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "emagrecimento",
    "confidence": 0.85
  },
  "keywords": ["abnehmen", "gewicht", "kalorienarm", "fitness"],
  "source": "copy"
}
```

**Verificação:**
- [ ] Detecta corretamente mesmo em alemão
- [ ] Keywords em alemão inclusos (abnehmen, gewicht)
- [ ] Confiança > 80%

---

### Test 4: Detecção Multilíngue — Espanhol

**Setup:**
```
URL: (genérico)
Copy (espanhol): "Baje de peso en 30 días con nuestra dieta
                 comprobada. Pérdida rápida y segura.
                 Expertos en nutrición disponibles."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "emagrecimiento",  // Will be 'emagrecimento' (PT)
    "confidence": 0.85
  },
  "keywords": ["bajar de peso", "dieta", "perder peso"]
}
```

**Verificação:**
- [ ] Detecta em espanhol
- [ ] Confiança > 80%

---

### Test 5: Nicho Secundário — Ambiguidade

**Setup:**
```
URL: (genérico)
Copy: "Receita de dieta para emagrecer.
       Alimentos saudáveis e deliciosos.
       Método gourmet para perder peso."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "emagrecimento",
    "confidence": 0.92
  },
  "secondary": {
    "niche": "alimentacao",
    "confidence": 0.45
  },
  "keywords": ["emagreça", "dieta", "receita", "alimentos"]
}
```

**Verificação:**
- [ ] Nicho primary correto: emagrecimento (mais matches)
- [ ] Nicho secondary identificado: alimentacao
- [ ] Secondary confidence > 0.25 e < primary

---

### Test 6: iGaming — Alta Prioridade

**Setup:**
```
URL: facebook.com/ads/casino-slots-poker-betting
Copy: "Ganhe no cassino com free spins.
       Jackpot hoje mesmo!
       Jogue poker e ganhe dinheiro real."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "igaming",
    "confidence": 0.95  // iGaming é muito específico
  },
  "keywords": ["cassino", "aposta", "poker", "slots", "gaming"]
}
```

**Verificação:**
- [ ] Detecta igaming com altíssima confiança (> 90%)
- [ ] iGaming tem prioridade sobre renda_extra (mesmo com "ganhe dinheiro")

---

### Test 7: E-commerce — Múltiplos Keywords

**Setup:**
```
URL: loja.com.br/ads/sale-promotion-discount
Copy: "Compre produtos premium com desconto!
       Frete grátis em todo Brasil.
       Confira nossa promoção especial."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "ecommerce",
    "confidence": 0.88
  },
  "keywords": ["loja", "compre", "desconto", "frete", "promo"]
}
```

**Verificação:**
- [ ] Detecta ecommerce
- [ ] Múltiplos keywords encontrados
- [ ] Confiança > 80%

---

### Test 8: Estética — Rejuvenescimento

**Setup:**
```
URL: skincare-clinic.com/ads/anti-aging-lifting
Copy: "Elimine rugas naturalmente!
       Procedimento lifting facial seguro.
       Dermatologista recomenda."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "estetica",
    "confidence": 0.92
  },
  "keywords": ["beleza", "pele", "facial", "anti-aging", "lifting", "dermatol"]
}
```

**Verificação:**
- [ ] Detecta estetica
- [ ] Keywords relevantes (beleza, pele, lifting)
- [ ] Confiança > 85%

---

### Test 9: Alimentação — Receitas/Chef

**Setup:**
```
URL: (genérico)
Copy: "Aprenda receitas gourmet com chef de Michelin.
       Culinária francesa e italiana.
       Curso online de gastronomia profissional."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "alimentacao",
    "confidence": 0.89
  },
  "keywords": ["receita", "chef", "culinaria", "gastronomia", "comida"]
}
```

**Verificação:**
- [ ] Detecta alimentacao
- [ ] Keywords culinários inclusos
- [ ] Confiança > 85%

---

### Test 10: Fallback para Geral — Ambiguidade Extrema

**Setup:**
```
URL: facebook.com/ads/library?id=999
Copy: "Novo produto revolucionário!
       Aproveite a promoção especial.
       Clique agora e saiba mais."
```

**Esperado:**
```json
{
  "primary": {
    "niche": "geral",
    "confidence": 0.15  // Muito baixa
  },
  "keywords": [],
  "secondary": null
}
```

**Verificação:**
- [ ] Nenhum keyword específico encontrado
- [ ] Nicho geral é esperado
- [ ] Confiança < 50% (sistema reconhece ambiguidade)

---

## 🎯 Matriz de Testes Automatizados

| # | URL | Copy | Niche Esperado | Min Confidence | Test Type |
|---|-----|------|----------------|----------------|-----------|
| 1 | `diet-weight` | `emagreça` | emagrecimento | 80% | Unit |
| 2 | genérico | `ganhe dinheiro` | renda_extra | 80% | Fallback |
| 3 | `skincare` | `rugas` | estetica | 75% | Unit |
| 4 | `recipe` | `receita` | alimentacao | 65% | Unit |
| 5 | `casino` | `cassino` | igaming | 90% | Unit |
| 6 | `shop` | `compre` | ecommerce | 70% | Unit |
| 7 | genérico | PT + EN mix | * | > 50% | I18n |
| 8 | genérico | Alemão | emagrecimento | 80% | I18n |
| 9 | genérico | Espanhol | emagrecimento | 80% | I18n |
| 10 | genérico | Genérico | geral | < 50% | Edge Case |

---

## 📊 Métricas de Aceitação

### Target: 85%+ de Acurácia

**Cálculo:**
```
Acurácia = (Testes Passados / Total Testes) × 100

Exemplo:
- Test 1 a 6: Passam ✅ (6/10)
- Test 7 a 9: Passam ✅ (3/10)
- Test 10: Passa ✅ (1/10)
= 10/10 = 100% (Excelente!)
```

**Critérios de Sucesso:**
- [ ] Acurácia geral ≥ 85%
- [ ] Cada nicho ≥ 80% de acurácia
- [ ] Fallback inteligente funcionando
- [ ] Multilíngue suportado (PT, EN, DE, ES, FR)
- [ ] Logs estruturados com confiança

---

## 🔧 Como Executar Testes

### Opção 1: Testes Unitários (TypeScript)

```bash
# Instalar dependências
npm install jest @types/jest ts-jest

# Executar testes
npm test -- src/lib/niche-detection.test.ts

# Com coverage
npm test -- src/lib/niche-detection.test.ts --coverage
```

### Opção 2: Testes Manuais (Browser)

1. Abrir Spy Bot Web no navegador
2. Console DevTools (F12)
3. Importar manualmente:
   ```javascript
   // Em DevTools Console
   import { detectNicheWithScores } from '@/lib/niche-detection';

   // Test 1
   const result = detectNicheWithScores(
     'diet-weight-loss',
     'Emagreça rápido'
   );
   console.log(result);
   // Expected: { primary: { niche: 'emagrecimento', confidence: 0.9+ } }
   ```

### Opção 3: Testes via API

1. Fazer POST para `/api/spy-engine`
2. Verificar response.logs
3. Procurar por:
   ```json
   {
     "stage": "START",
     "message": "Detecção de Nicho com Scores (v2)",
     "nicho": "emagrecimento",
     "confianca": "92%"
   }
   ```

---

## 📋 Checklist de Validação

### Setup Inicial
- [ ] Arquivos criados:
  - [ ] `src/lib/niche-detection.ts`
  - [ ] `src/lib/niche-prompts.ts`
  - [ ] `src/lib/types.ts` (atualizado)
  - [ ] `src/app/api/spy-engine/route.ts` (refatorado)

### Funcionalidade
- [ ] detectNicheWithScores() retorna NicheScores
- [ ] getNicheConfidencePercentage() funciona
- [ ] Fallback para nicho secundário funciona
- [ ] Multilíngue detecta PT, EN, DE, ES, FR
- [ ] Logging estruturado mostra confiança

### Qualidade
- [ ] Sem erros TypeScript
- [ ] Sem warnings de lint
- [ ] Tests passam com >= 85% acurácia
- [ ] Performance aceitável (< 100ms por detecção)

### Integração
- [ ] route.ts usa novo sistema
- [ ] GPT-4o recebe context de nicho
- [ ] Logs aparecem estruturados na response
- [ ] Compatibilidade com código antigo mantida

---

## 🚀 Próximas Etapas

1. **Executar todos os 10 testes manuais** — Verificar matriz acima
2. **Rodar testes unitários** — `npm test niche-detection.test.ts`
3. **Validar acurácia** — Calcular percentual de sucesso
4. **Melhorar keywords** — Se algum nicho < 80%, adicionar mais keywords
5. **Deploy para staging** — Testar com dados reais

---

## 📝 Template de Relatório

```markdown
# Relatório de Testes — Niche Detection v2

**Data**: [DATA]
**Testador**: [NOME]
**Ambiente**: [DEV/STAGING/PROD]

## Resumo Executivo
- Total de testes: 10
- Passaram: X/10 (X%)
- Falharam: Y/10 (Y%)
- Status: ✅ PASSOU / ⚠️ REVISAR

## Testes Individuais

### Test 1: Emagrecimento
- [x] Detectou corretamente
- [x] Confiança > 80%
- Observações: Keywords detectados corretamente

### Test 2: Fallback
- [x] Acionou fallback quando necessário
- [x] Reanalisa com copy
- Observações: Lógica funcionando bem

...

## Problemas Encontrados
- [ ] Nenhum / [ ] Listar abaixo

## Recomendações
- [ ] Pronto para deploy
- [ ] Melhorias necessárias (listar)

---

**Assinado**: _________
**Data**: ___/___/____
```

---

**Guia de Testes — Feature 2: AI Improvements**
Spy Bot Web — 2026-03-19
