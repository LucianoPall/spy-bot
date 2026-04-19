# GUIA DE TESTE: Solução do Problema de Nicho

## 📋 Checklist de Verificação

Siga este guia para validar que a solução está funcionando corretamente.

---

## 1️⃣ Teste Unitário: Função `detectNicheFromUrl()`

### Objetivo
Validar que a função de detecção de nicho funciona corretamente com diferentes URLs.

### Passos

```typescript
// Copie e execute este código em um terminal Node.js ou arquivo .ts

import { detectNicheFromUrl } from '@/app/api/spy-engine/route';

const testCases = [
  { url: "https://www.facebook.com/ads/library/?id=1897128917890649", expected: "geral" },
  { url: "https://example.com/weight-loss-diet-plan", expected: "emagrecimento" },
  { url: "https://example.com/casino-online-bet", expected: "igaming" },
  { url: "https://example.com/skincare-facial-lifting", expected: "estetica" },
  { url: "https://example.com/loja-online-shop", expected: "ecommerce" },
  { url: "https://example.com/ganhar-renda-extra-online", expected: "renda_extra" },
];

testCases.forEach(({ url, expected }) => {
  const result = detectNicheFromUrl(url);
  const status = result === expected ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} | ${url} → ${result} (esperado: ${expected})`);
});
```

### Resultado Esperado
```
✅ PASS | https://www.facebook.com/ads/library/?id=1897128917890649 → geral
✅ PASS | https://example.com/weight-loss-diet-plan → emagrecimento
✅ PASS | https://example.com/casino-online-bet → igaming
✅ PASS | https://example.com/skincare-facial-lifting → estetica
✅ PASS | https://example.com/loja-online-shop → ecommerce
✅ PASS | https://example.com/ganhar-renda-extra-online → renda_extra
```

---

## 2️⃣ Teste de Integração: Fluxo Completo

### Objetivo
Testar o fluxo completo de clonagem de anúncio com nicho correto.

### Setup

1. **Abra a aplicação:** `npm run dev`
2. **Navegue para:** `http://localhost:3000`
3. **Login:** Use sua conta
4. **Acesse a feature de "Clone de Anúncio"**

### Teste Case 1: URL de Estética

**Dado:**
- URL: `https://example.com/skincare-lifting-facial`
- Esperado: Imagens de estética (pele, beleza, lifting)

**Passos:**
1. Colar a URL no campo de clonagem
2. Clicar em "Clonar"
3. Aguardar processamento (30-60s)

**Verificar:**
- [ ] Logs mostram: `🎯 Nicho da URL detectado: estetica`
- [ ] Logs mostram: `🔒 FORÇANDO detectedNiche para o valor correto da URL`
- [ ] Imagens geradas são de estética/beleza
- [ ] Nenhuma imagem é de "Renda Extra"

---

### Teste Case 2: URL de iGaming

**Dado:**
- URL: `https://example.com/cassino-online-bet`
- Esperado: Imagens de cassino/aposta

**Passos:**
1. Colar a URL
2. Clicar em "Clonar"

**Verificar:**
- [ ] Logs mostram: `🎯 Nicho da URL detectado: igaming`
- [ ] Imagens geradas são de cassino/poker
- [ ] Nenhuma imagem é de "Renda Extra"

---

### Teste Case 3: URL de Emagrecimento

**Dado:**
- URL: `https://example.com/peso-dieta-fitness`
- Esperado: Imagens de emagrecimento/fitness

**Passos:**
1. Colar a URL
2. Clicar em "Clonar"

**Verificar:**
- [ ] Logs mostram: `🎯 Nicho da URL detectado: emagrecimento`
- [ ] Imagens geradas são de fitness/dieta
- [ ] Nenhuma imagem é de "Renda Extra"

---

### Teste Case 4: URL Original (Facebook Ads Library)

**Dado:**
- URL: `https://www.facebook.com/ads/library/?id=1897128917890649`
- Esperado: Nicho genérico (mas identificado corretamente)

**Passos:**
1. Colar a URL
2. Clicar em "Clonar"

**Verificar:**
- [ ] Logs mostram: `🎯 Nicho da URL detectado: geral`
- [ ] Imagens geradas podem ser genéricas (é esperado para nicho "geral")

---

## 3️⃣ Verificação de Logs

### Onde Procurar os Logs

**No Console do Browser:**
1. Abra DevTools (F12)
2. Clique na aba "Console"
3. Procure por linhas com:
   - `🎯 Nicho da URL detectado`
   - `🔒 FORÇANDO detectedNiche`

**No Console do Server (Terminal):**
```bash
npm run dev

# Procure por:
# [START] 🎯 Nicho da URL detectado
# [DALLE_CALL] 🔒 FORÇANDO detectedNiche
```

### Logs Esperados

```
[START] 🎯 Nicho da URL detectado
├─ url: "https://example.com/skincare-lifting-facial"
├─ detectedNiche: "estetica"
└─ reason: "Detectado cedo para garantir imagePrompts corretos quando Apify falha"

[DALLE_CALL] 🔒 FORÇANDO detectedNiche para o valor correto da URL
├─ forcedNiche: "estetica"
└─ reason: "Garante que imagePrompts e fallback images correspondem ao nicho REAL"

[DALLE_CALL] ImagePrompts recebidos do GPT-4o:
├─ detectedNiche: "estetica"
├─ imagePrompt1: "radiant skin close-up, woman with glowing complexion..."
├─ imagePrompt2: "anti-aging beauty treatment, professional skincare..."
└─ imagePrompt3: "before-after transformation, facial lifting results..."
```

---

## 4️⃣ Teste de Fallback (Apify Falha)

### Objetivo
Validar que mesmo quando Apify falha, as imagens correspondem ao nicho correto.

### Simular Falha de Apify

**Opção 1: Remover chave de API**
```bash
# Comentar APIFY_API_TOKEN em .env
# APIFY_API_TOKEN=seu_token_aqui  # ← comentar esta linha
```

**Opção 2: Usar URL inválida**
```
https://www.facebook.com/ads/library/?id=NUMERO_INVALIDO
```

### Verificar

1. Clonar a URL
2. Apify vai falhar (esperado)
3. **Verificar que:**
   - [ ] Logs mostram: `FALLBACK ATIVADO - Apify falhou`
   - [ ] Mas ainda mostram: `🎯 Nicho da URL detectado: [CORRETO]`
   - [ ] Imagens são do nicho CORRETO (não de "Renda Extra")
   - [ ] Nenhuma imagem é "genérica de fallback"

---

## 5️⃣ Teste de Stress: Múltiplas URLs

### Objetivo
Validar comportamento com URLs de múltiplos nichos.

### Executar

Execute rapidamente várias clonagens com URLs de nichos diferentes:

```
1. URL de Emagrecimento
   └─ Esperar resultado

2. URL de iGaming
   └─ Esperar resultado

3. URL de E-commerce
   └─ Esperar resultado

4. URL de Estética
   └─ Esperar resultado

5. URL de Renda Extra
   └─ Esperar resultado
```

### Verificar

- [ ] Cada URL gera imagens do seu próprio nicho
- [ ] Nenhuma "mistura" de nichos
- [ ] Nenhuma "regressão" para "Renda Extra"

---

## 6️⃣ Checklist Final

### Code Quality

- [ ] Função `detectNicheFromUrl()` está presente (linhas 15-56)
- [ ] Função é chamada na linha 179 (logo após validação)
- [ ] Prompt do GPT-4o menciona `detectedNicheFromUrl` (linhas 490-527)
- [ ] Force enforcement está em lugar (linha 541)
- [ ] Todos os logs informativos estão presentes

### Funcionalidade

- [ ] Detecção de nicho funciona para URLs com keywords
- [ ] Detecção de nicho funciona com URLs genéricas (fallback "geral")
- [ ] GPT-4o recebe instruções de nicho no prompt
- [ ] generatedCopys.detectedNiche é sempre o valor correto
- [ ] Imagens geradas correspondem ao nicho detectado
- [ ] Fallback de imagens também corresponde ao nicho correto
- [ ] Funciona mesmo quando Apify falha

### Performance

- [ ] Tempo de resposta não aumentou significativamente
- [ ] Nenhuma chamada extra foi adicionada (só lógica)
- [ ] Logs não afetam performance

---

## 📊 Matriz de Teste

| Caso de Teste | URL | Nicho Esperado | Status | Data Teste |
|---------------|-----|----------------|--------|-----------|
| 1. Estética | `.../skincare-lifting` | estetica | ☐ PASS | — |
| 2. iGaming | `.../casino-bet` | igaming | ☐ PASS | — |
| 3. Emagrecimento | `.../weight-loss` | emagrecimento | ☐ PASS | — |
| 4. E-commerce | `.../shop-store` | ecommerce | ☐ PASS | — |
| 5. Renda Extra | `.../ganhar-renda` | renda_extra | ☐ PASS | — |
| 6. Genérica | `.../ads/library` | geral | ☐ PASS | — |
| 7. Fallback (Apify) | Inválida | [correto] | ☐ PASS | — |
| 8. Stress Test | Múltiplas | Várias | ☐ PASS | — |

---

## 🐛 Troubleshooting

### Problema: Logs não mostram nicho correto

**Solução:**
1. Verificar que `detectNicheFromUrl()` está sendo chamado (linha 179)
2. Adicionar console.log temporário:
```typescript
const detectedNicheFromUrl = detectNicheFromUrl(adUrl);
console.log("[DEBUG] Detected niche:", detectedNicheFromUrl); // Debug
```

### Problema: Imagens ainda são de "Renda Extra"

**Solução:**
1. Verificar a linha 541 (force enforcement)
2. Confirmar que `generatedCopys.detectedNiche = detectedNicheFromUrl` está presente
3. Verificar logs do GPT-4o para ver se está retornando o nicho correto

### Problema: URL não é identificada (sempre "geral")

**Solução:**
1. Verificar se a URL contém keywords corretas
2. Comparar com a lista de keywords em `detectNicheFromUrl()`
3. Adicionar novas keywords se necessário

---

## ✅ Sign-off

Quando todos os testes passarem, marque como completo:

**Data:** _______________
**Testador:** _______________
**Resultado:** ☐ TODOS OS TESTES PASSARAM

---

## 📞 Suporte

Se encontrar problemas:
1. Consulte `SOLUCAO_PROBLEMA_NICHO.md` para entender a solução
2. Verifique os logs em detalhes
3. Valide a função `detectNicheFromUrl()` isoladamente
4. Confirme que o nicho está sendo forçado na linha 541
