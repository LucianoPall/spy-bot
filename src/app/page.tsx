'use client';

import { useState } from 'react';

export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const testimonials = [
    {
      name: 'Pedro Alves',
      role: 'Gestor de Tráfego',
      location: 'São Paulo',
      text: 'Com o Spy Bot, aumentei meu ROI em 3x em apenas 15 dias. Antes eu gastava dias criando criativos.',
      rating: 5,
    },
    {
      name: 'Mariana Costa',
      role: 'E-commerce de Moda',
      location: 'Belo Horizonte',
      text: 'Reduzi o custo de criativo em 80%. Agora tenho variantes prontas em minutos, não dias.',
      rating: 5,
    },
    {
      name: 'Rafael Souza',
      role: 'Infoprodutor',
      location: 'Recife',
      text: 'Melhor investimento que fiz. Os criativos analisados pelo Spy Bot converteram muito mais.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: 'Funciona para qualquer nicho?',
      a: 'Sim! O Spy Bot funciona com qualquer nicho — e-commerce, infoprodutos, serviços, B2B, tudo. A IA aprende padrões de conversão universais.',
    },
    {
      q: 'Preciso ter conta no Facebook Ads?',
      a: 'Você precisa acessar a Biblioteca de Anúncios do Facebook para colar links dos anúncios que quer analisar. Conta gratuita do Facebook é suficiente.',
    },
    {
      q: 'Como recebo o acesso?',
      a: 'Após o pagamento, você recebe um email com seu login e senha. Acessa a plataforma imediatamente e começa a usar.',
    },
    {
      q: 'Posso cancelar quando quiser?',
      a: 'Claro. Seu plano é mensal. Você pode cancelar a qualquer momento sem perguntas. Temos 7 dias de garantia também.',
    },
    {
      q: 'Preciso saber programar?',
      a: 'Não. O Spy Bot é uma plataforma visual. Basta colar o link do anúncio e clicar — toda a mágica acontece automaticamente.',
    },
  ];

  const features = [
    {
      title: 'Análise de Copy com IA',
      desc: 'A IA descobre exatamente qual parte do texto converte mais.',
    },
    {
      title: 'Geração de Imagem DALL-E 3',
      desc: 'Cria variantes de imagem alinhadas ao seu produto.',
    },
    {
      title: '3 Variantes por Análise',
      desc: 'Recebe 3 opções prontas em 12 segundos.',
    },
    {
      title: 'Histórico Completo',
      desc: 'Guarde todas as análises e variantes em um só lugar.',
    },
    {
      title: 'Perfil de Marca Personalizado',
      desc: 'A IA aprende seu tom e adapta análises conforme.',
    },
    {
      title: 'Funciona com Qualquer Nicho',
      desc: 'E-commerce, infoprodutos, serviços, B2B — tudo funciona.',
    },
  ];

  const painPoints = [
    {
      title: 'Criativo que não converte',
      desc: 'Você sobe um anúncio, gasta R$ 500 em tráfego, e nada.',
    },
    {
      title: 'Contratando designer caro',
      desc: 'Pagar R$ 1.500-3.000 por criativo que talvez não funcione.',
    },
    {
      title: 'Demorando dias para subir',
      desc: 'Briefing → design → aprovação → ajustes = 5 dias perdidos.',
    },
  ];

  return (
    <main className="min-h-screen bg-dark-900 text-slate-100 flex flex-col">
      {/* ===== NAVBAR FIXA ===== */}
      <nav className="fixed top-0 w-full bg-dark-900/80 backdrop-blur-md border-b border-slate-800/50 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-brand-500">Spy Bot</div>
          <a
            href="#checkout-ticto"
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-6 rounded-lg transition-all"
          >
            Garantir Acesso
          </a>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center mt-16">
        <div className="inline-block py-1 px-3 rounded-full bg-brand-900/50 border border-brand-500/30 text-brand-500 text-sm font-medium mb-6">
          ✨ Usado por +847 anunciantes brasileiros
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Pare de criar anúncios do zero.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-500">
            Clone os milionários.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          A primeira ferramenta do Brasil que rastreia, analisa e recria os melhores criativos do mercado usando Inteligência Artificial. Suba campanhas em 12 segundos.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <a
            href="#checkout-ticto"
            className="bg-brand-600 hover:bg-brand-500 text-white text-lg font-semibold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
          >
            Quero Garantir Acesso Agora
          </a>
          <button className="bg-dark-800 border border-slate-700 hover:border-brand-500/50 text-white text-lg font-semibold py-4 px-10 rounded-xl transition-all">
            Ver Como Funciona
          </button>
        </div>

        {/* Social Proof */}
        <div className="flex items-center gap-4 justify-center text-slate-400">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500"></div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500"></div>
          </div>
          <span className="text-sm">847+ anunciantes usando Spy Bot</span>
        </div>
      </section>

      {/* ===== PAIN SECTION ===== */}
      <section className="w-full bg-dark-800/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Você está cometendo esse erro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {painPoints.map((pain, idx) => (
              <div
                key={idx}
                className="bg-dark-900 p-8 rounded-2xl border border-slate-800 hover:border-brand-500/30 transition-all"
              >
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{pain.title}</h3>
                <p className="text-slate-400">{pain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Como funciona (em 3 passos)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Cole o Link do Anúncio',
              desc: 'Encontre um anúncio bom na Biblioteca de Anúncios do Facebook e cole aqui. Leva 5 segundos.',
            },
            {
              step: '2',
              title: 'IA Analisa por que Converte',
              desc: 'Nosso algoritmo descobre o gatilho psicológico, o tom exato, e por que aquela imagem funciona.',
            },
            {
              step: '3',
              title: 'Baixe 3 Variantes em 12 Segundos',
              desc: 'A IA gera 3 novas opções únicas, alinhadas ao SEU produto e nicho.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-dark-800 p-8 rounded-2xl border border-slate-800 flex flex-col items-center text-center hover:border-brand-500/30 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-500 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="w-full bg-dark-800/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">O que você ganha com Spy Bot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-dark-900 p-8 rounded-2xl border border-slate-800">
                <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center mb-4 text-brand-500 font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEPOIMENTOS ===== */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">O que dizem nossos clientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <div key={idx} className="bg-dark-800 p-8 rounded-2xl border border-slate-800">
              <div className="flex gap-1 mb-4">
                {[...Array(test.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400">
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-slate-300 mb-6 italic">"{test.text}"</p>
              <div className="border-t border-slate-700 pt-4">
                <p className="font-semibold">{test.name}</p>
                <p className="text-sm text-slate-400">
                  {test.role} • {test.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== GARANTIA ===== */}
      <section className="w-full bg-dark-800/50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block p-4 bg-brand-900/20 rounded-full mb-6">
            <span className="text-4xl">🛡️</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">7 Dias de Garantia Total</h2>
          <p className="text-lg text-slate-400">
            Não gostou? Devolvemos 100% do seu dinheiro — sem perguntas. Sem burocracias. Sem risco.
          </p>
        </div>
      </section>

      {/* ===== PRICING / CTA FINAL ===== */}
      <section
        id="checkout-ticto"
        className="w-full max-w-4xl mx-auto px-6 py-20"
      >
        <div className="bg-gradient-to-b from-dark-800 to-dark-900 p-10 md:p-16 rounded-3xl border border-brand-500/20 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-3xl rounded-full"></div>

          <h2 className="text-4xl font-bold mb-4">Acesso Ilimitado ao Spy Bot</h2>
          <p className="text-slate-400 mb-12 mx-auto max-w-xl">
            Pare de pagar R$ 1.500+ para designers ou copywriters freelancers que atrasam suas campanhas.
          </p>

          <div className="flex justify-center items-end gap-2 mb-10">
            <span className="text-2xl text-slate-500 line-through">R$ 197</span>
            <span className="text-6xl font-bold text-white">R$ 47</span>
            <span className="text-2xl text-slate-400">/mês</span>
          </div>

          <div className="bg-dark-900/50 p-6 rounded-2xl mb-10 text-left max-w-xl mx-auto">
            <h3 className="font-semibold mb-4 text-lg">Você recebe:</h3>
            <ul className="space-y-3 text-slate-300">
              <li>✅ Análise ilimitada de anúncios</li>
              <li>✅ 3 variantes geradas por análise</li>
              <li>✅ Imagens com DALL-E 3</li>
              <li>✅ Histórico completo de análises</li>
              <li>✅ Acesso ao perfil de marca personalizado</li>
              <li>✅ Suporte por email</li>
              <li>✅ 7 dias de garantia 100% reembolso</li>
            </ul>
          </div>

          <a
            href="https://pay.ticto.app/XXXXX"
            className="block bg-white text-brand-900 hover:bg-slate-100 text-lg font-bold py-4 px-12 rounded-xl transition-all w-full md:w-auto mb-6"
          >
            Quero Acesso Agora por R$ 47/mês
          </a>

          <p className="text-sm text-slate-500">
            🔥 Oferta por tempo limitado — Preço pode aumentar em breve
          </p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="w-full bg-dark-800/50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Dúvidas Frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="bg-dark-900 rounded-xl border border-slate-800 overflow-hidden open:border-brand-500/30"
              >
                <summary
                  onClick={() =>
                    setOpenFaqIndex(openFaqIndex === idx ? null : idx)
                  }
                  className="px-6 py-4 cursor-pointer font-semibold hover:text-brand-400 transition-colors flex items-center justify-between"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl">
                    {openFaqIndex === idx ? '−' : '+'}
                  </span>
                </summary>
                <div className="px-6 pb-4 text-slate-400 border-t border-slate-800">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="w-full bg-dark-800 border-t border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="text-2xl font-bold text-brand-500 mb-2">
                Spy Bot
              </div>
              <p className="text-slate-500">
                © 2024 Spy Bot. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex gap-8 text-slate-500 text-sm">
              <a href="#" className="hover:text-brand-400 transition-colors">
                Termos de Serviço
              </a>
              <a href="#" className="hover:text-brand-400 transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="hover:text-brand-400 transition-colors">
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
