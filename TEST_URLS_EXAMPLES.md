# URLs de Teste — Niche Detection v2

Coleção de URLs reais e exemplos para testar o sistema de detecção de nicho.

---

## 🎯 URLs por Nicho

### Emagrecimento (Weight Loss)

#### Português
- `facebook.com/ads/library?id=123&campaign=emagrecer-rápido-dieta`
- `meudietaapp.com.br/ads?source=facebook&niche=weight-loss`
- `https://www.facebook.com/ads/library/?id=fitness-protocol-100kg`

#### English
- `facebook.com/ads/library?id=456&weight-loss-diet`
- `dietapp.com/ads?campaign=lose-weight`
- `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&media_type=all&search_type=keyword_unmatched&sort_by=ad_creation_date_desc&keyword=weight%20loss`

#### Deutsch
- `facebook.com/ads/library?campaign=abnehmen-gewicht`
- `https://www.facebook.com/ads/library/?keyword=abnehmen&country=DE`

#### Español
- `facebook.com/ads/library?campaign=bajar-peso-dieta`
- `https://www.facebook.com/ads/library/?keyword=dieta&country=ES`

---

### Estética (Beauty/Skincare)

#### Português
- `facebook.com/ads/library?id=789&niche=beleza-skincare`
- `https://www.facebook.com/ads/library/?keyword=anti-aging`
- `clinicaestetica.com.br/ads?campaign=lifting-facial`

#### English
- `facebook.com/ads/library?keyword=anti-aging-skincare`
- `beautycare.com/ads?campaign=wrinkles-solution`
- `dermatology-clinic.com/ads?id=botox-lifting`

#### Deutsch
- `facebook.com/ads/library?keyword=hautpflege-anti-aging`
- `gesichtspflege.de/ads?campaign=falten`

---

### Alimentação (Food/Recipes)

#### Português
- `facebook.com/ads/library?campaign=receita-culinaria`
- `chefcurso.com.br/ads?niche=gastronomia`
- `https://www.facebook.com/ads/library/?keyword=receita%20de%20comida`

#### English
- `facebook.com/ads/library?keyword=recipe-cooking`
- `cookingtutorials.com/ads?campaign=chef-recipes`
- `https://www.facebook.com/ads/library/?keyword=gourmet%20food`

#### Deutsch
- `facebook.com/ads/library?keyword=rezepte-kochen`
- `rezepte.de/ads?campaign=gastronomie`

---

### iGaming (Casino/Betting)

#### Português
- `facebook.com/ads/library?campaign=cassino-apostas-slots`
- `casinoplay.com.br/ads?niche=igaming`
- `https://www.facebook.com/ads/library/?keyword=casino%20online`

#### English
- `facebook.com/ads/library?keyword=casino-poker-slots`
- `onlinecasino.com/ads?campaign=jackpot-bonus`
- `https://www.facebook.com/ads/library/?keyword=gambling%20online`

#### Deutsch
- `facebook.com/ads/library?keyword=casino-spielen`
- `wettanbieter.de/ads?campaign=pokerspiele`

---

### E-commerce (Shopping)

#### Português
- `facebook.com/ads/library?campaign=loja-compras-desconto`
- `mijaloja.com.br/ads?niche=ecommerce`
- `https://www.facebook.com/ads/library/?keyword=compra%20online`

#### English
- `facebook.com/ads/library?keyword=shop-store-sale`
- `megastore.com/ads?campaign=black-friday-discount`
- `https://www.facebook.com/ads/library/?keyword=shopping%20online`

#### Deutsch
- `facebook.com/ads/library?keyword=online-shop-versand`
- `onlineshop.de/ads?campaign=rabatt`

---

### Renda Extra (Extra Income)

#### Português
- `facebook.com/ads/library?campaign=ganhar-dinheiro-online-renda-extra`
- `metodorendapassiva.com.br/ads?niche=renda`
- `https://www.facebook.com/ads/library/?keyword=ganhe%20dinheiro%20online`

#### English
- `facebook.com/ads/library?keyword=make-money-online`
- `passiveincome.com/ads?campaign=earn-passive`
- `https://www.facebook.com/ads/library/?keyword=side%20hustle%20income`

#### Deutsch
- `facebook.com/ads/library?keyword=geld-verdienen-online`
- `onlineverdienen.de/ads?campaign=passiveinkommen`

---

## 🧪 URLs Especiais para Testes

### URLs Genéricas (Deve retornar "geral")
```
facebook.com/ads/library?id=999
facebook.com/ads/library/
https://www.facebook.com/ads/library/
google.com/search?q=anuncio
https://www.facebook.com/ads/library/?search_type=keyword_unmatched
```

### URLs Ambíguas (Teste nicho secundário)
```
facebook.com/ads/library?campaign=receita-dieta-emagrecer
# Esperado: primary: emagrecimento, secondary: alimentacao

facebook.com/ads/library?campaign=shop-promo-desconto
# Esperado: primary: ecommerce, secondary: pode variar

facebook.com/ads/library?campaign=cassino-ganhe-dinheiro
# Esperado: primary: igaming, secondary: renda_extra
```

### URLs Multi-idioma (Teste multilíngue)
```
# Português
facebook.com/ads/library?keyword=emagreça%20rápido

# English
facebook.com/ads/library?keyword=weight%20loss%20diet

# Deutsch
facebook.com/ads/library?keyword=abnehmen%20schnell

# Español
facebook.com/ads/library?keyword=bajar%20peso%20rápido

# Français
facebook.com/ads/library?keyword=perdre%20poids
```

---

## 📋 Matriz de Teste

| Nicho | URL Simples | URL Complexa | Expected Confidence |
|-------|------------|-------------|-------------------|
| emagrecimento | `diet-weight` | `ads/emagrecimento?id=123&campaign=emagreça` | 85%+ |
| estetica | `skincare-beauty` | `ads/beleza?id=456&anti-aging` | 80%+ |
| alimentacao | `recipe-cooking` | `ads/receita?id=789&chef` | 75%+ |
| igaming | `casino-poker` | `ads/cassino?id=101&slots-bet` | 90%+ |
| ecommerce | `shop-store` | `ads/loja?id=202&desconto-frete` | 75%+ |
| renda_extra | `money-online` | `ads/renda?id=303&ganhe-dinheiro` | 85%+ |
| geral | `generic-ads` | `fb.com/ads/library/?id=999` | < 50% |

---

## 🛠️ Como Usar em Testes

### Teste Manual 1: Script Node.js

```javascript
// test-niche-detection.js
import { detectNicheWithScores, getNicheConfidencePercentage } from './src/lib/niche-detection.ts';

const testUrls = [
  { url: 'facebook.com/ads/library?campaign=diet-weight-loss', expected: 'emagrecimento' },
  { url: 'facebook.com/ads/library?campaign=skincare-beauty', expected: 'estetica' },
  { url: 'facebook.com/ads/library?campaign=cassino-apostas', expected: 'igaming' },
  { url: 'facebook.com/ads/library?campaign=receita-culinaria', expected: 'alimentacao' },
  { url: 'facebook.com/ads/library?campaign=loja-ecommerce', expected: 'ecommerce' },
  { url: 'facebook.com/ads/library?campaign=ganhar-dinheiro', expected: 'renda_extra' },
  { url: 'facebook.com/ads/library?id=999', expected: 'geral' },
];

let passed = 0;
let failed = 0;

testUrls.forEach(({ url, expected }) => {
  const scores = detectNicheWithScores(url, '');
  const confidence = getNicheConfidencePercentage(scores);

  if (scores.primary.niche === expected) {
    console.log(`✅ PASS: ${url} → ${expected} (${confidence}%)`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${url} → expected ${expected}, got ${scores.primary.niche}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
console.log(`Accuracy: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
```

### Teste Manual 2: Browser Console

```javascript
// Cole no DevTools Console do Spy Bot Web

// 1. Importar função (se disponível globalmente)
const testUrl = 'facebook.com/ads/library?campaign=diet-weight-loss';

// 2. Faz POST para /api/spy-engine com essa URL
fetch('/api/spy-engine', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ adUrl: testUrl })
})
.then(r => r.json())
.then(data => {
  const logs = data.logs;
  const nichoLog = logs.find(l => l.message.includes('Detecção de Nicho'));
  console.log('Niche Detection Result:', nichoLog);
});
```

### Teste Manual 3: cURL

```bash
# Test emagrecimento
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"facebook.com/ads/library?campaign=diet-weight-loss"}'

# Test igaming
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"facebook.com/ads/library?campaign=cassino-apostas-slots"}'

# Test geral (genérico)
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '{"adUrl":"facebook.com/ads/library?id=999"}'
```

---

## 📊 Resultados Esperados

### Exemplo 1: Emagrecimento
```
Input URL: facebook.com/ads/library?campaign=diet-weight-loss
Input Copy: "Emagreça rápido com nossa dieta comprovada"

Expected Output:
{
  "primary": { "niche": "emagrecimento", "confidence": 0.92 },
  "secondary": null,
  "keywords": ["diet", "weight-loss", "emagreça", "dieta"],
  "source": "url",
  "logs": {
    "nichoDetectado": "emagrecimento",
    "confianca": "92%",
    "keywords": ["diet", "weight-loss", "emagreça", "dieta"]
  }
}
```

### Exemplo 2: Ambiguidade (Copy melhora detecção)
```
Input URL: facebook.com/ads/library?id=999 (genérico)
Input Copy: "Ganhe R$5.000/mês trabalhando em casa"

Expected Output:
{
  "logs": {
    "etapa1": { "nicho": "geral", "confianca": "25%" },
    "fallbackAcionado": true,
    "etapa2": { "nicho": "renda_extra", "confianca": "87%" },
    "nichoFinal": "renda_extra"
  }
}
```

---

## 🔍 Validação de Logs

Procure pela estrutura de log ao testar:

```json
{
  "stage": "START",
  "timestamp": "2026-03-19T10:30:45Z",
  "message": "Detecção de Nicho com Scores (v2)",
  "data": {
    "nicho": "emagrecimento",
    "confianca": "92%",
    "keywords": ["emagreça", "dieta", "peso", "fitness"],
    "source": "url",
    "secondary": null,
    "totalMatches": 8
  }
}
```

---

## 💡 Dicas para Testes

1. **URL é melhor para testes iniciais** — Evita lidar com copy que muda
2. **Teste com copy ambígua** — Valida fallback inteligente
3. **Teste multilíngue** — Cada idioma deve funcionar
4. **Monitore logs** — Confiança visível em cada request
5. **Reporte erros** — Se nicho < 80%, adicionar keywords

---

## 📝 Template para Reportar Erro

```markdown
## Teste de Detecção de Nicho

**URL testada**: [URL aqui]
**Copy (se aplicável)**: [Copy aqui]

**Esperado**: [Nicho esperado] com [Confiança esperada]%
**Obtido**: [Nicho obtido] com [Confiança obtida]%

**Resultado**: ❌ FALHOU

**Análise**:
- Keywords detectados: [Lista]
- Fonte detectada: [URL/Copy]
- Timestamp: [Data/hora]

**Sugestão de Fix**:
- Adicionar keywords [Lista]
- Aumentar peso do nicho [Nicho]
```

---

**Guia de URLs de Teste — Feature 2: AI Improvements**
Spy Bot Web — 2026-03-19
