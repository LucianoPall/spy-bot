const url = 'https://www.facebook.com/ads/library/?id=2154950355275377';

// Teste 1: Fazer requisição completa ao /api/spy-engine
console.log('\n========================================');
console.log('TESTE 1: Requisição Completa ao /api/spy-engine');
console.log('========================================\n');

const testPayload = {
  adUrl: url,
  brandProfile: null
};

console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('\nComando para testar (copie e cole):');
console.log(`
curl -X POST http://localhost:3000/api/spy-engine \
  -H "Content-Type: application/json" \
  -d '${JSON.stringify(testPayload)}'
`);

// Teste 2: Análise da URL
console.log('\n========================================');
console.log('TESTE 2: Análise da URL');
console.log('========================================\n');

console.log(`URL Testada: ${url}`);
console.log(`Tipo: Facebook Ads Library`);
console.log(`ID do Anúncio: 2154950355275377`);

// Teste 3: Verificar resposta esperada
console.log('\n========================================');
console.log('TESTE 3: Resposta Esperada');
console.log('========================================\n');

const expectedResponse = {
  success: true,
  originalAd: {
    copy: '[copy extraída ou mock]',
    image: '[imagem extraída ou mock]',
    isMockData: true,
    warning: '[aviso se não conseguir extrair]'
  },
  generatedVariations: {
    variante1: '[copy gerada pela IA]',
    variante2: '[copy gerada pela IA]',
    variante3: '[copy gerada pela IA]'
  },
  generatedImages: {
    image1: {
      url: '[URL da imagem 1]',
      type: 'generated',
      isTemporary: false,
      niche: '[nicho detectado]',
      source: { provider: 'supabase|dalle|unsplash|fallback' }
    },
    image2: {
      url: '[URL da imagem 2]',
      type: 'generated',
      isTemporary: false,
      niche: '[nicho detectado]',
      source: { provider: 'supabase|dalle|unsplash|fallback' }
    },
    image3: {
      url: '[URL da imagem 3]',
      type: 'generated',
      isTemporary: false,
      niche: '[nicho detectado]',
      source: { provider: 'supabase|dalle|unsplash|fallback' }
    }
  }
};

console.log(JSON.stringify(expectedResponse, null, 2));

// Teste 4: Checklist de verificação
console.log('\n========================================');
console.log('TESTE 4: Checklist de Verificação');
console.log('========================================\n');

console.log(`
✅ CHECKLIST POS-TESTE:
  [ ] API retorna status 200
  [ ] generalVariations tem 3 cópias (variante1, variante2, variante3)
  [ ] generatedImages tem 3 imagens (image1, image2, image3)
  [ ] Cada imagem tem URL válida (não vazia)
  [ ] Cada imagem tem propriedade 'type' definida
  [ ] Cada imagem tem propriedade 'url' acessível
  [ ] As URLs das imagens conseguem carregar no navegador
  [ ] Nenhuma URL retorna 404 ou erro de acesso
  [ ] As imagens são visíveis no componente VariationCard
  [ ] O proxy /api/proxy-image consegue acessar as URLs
  
🔍 SE AS IMAGENS NÃO CARREGAR:
  [ ] Verificar browser DevTools > Network
  [ ] Ver se há erro CORS
  [ ] Ver status code da resposta do proxy
  [ ] Confirmar se as URLs DALL-E ainda estão válidas
  [ ] Testar fetch das URLs no navegador
`);

// Teste 5: Debug endpoints
console.log('\n========================================');
console.log('TESTE 5: Debug Endpoints');
console.log('========================================\n');

console.log(`
📍 ENDPOINTS PARA TESTAR:
  1. POST /api/spy-engine
     → Gera as variações e imagens
     
  2. GET /api/proxy-image?url=[URL]
     → Proxifica o acesso a imagens DALL-E
     → Trata fallbacks se URL expirada
     
  3. GET /api/spy-engine/logger (se existir)
     → Logs detalhados da execução
     
🧪 TESTE DE PROXY:
  curl "http://localhost:3000/api/proxy-image?url=https://images.unsplash.com/photo-1570172176411-b80fcadc6fb0" -v
`);

console.log('\n========================================\n');
