import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-900 text-slate-100 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center">
        <div className="inline-block py-1 px-3 rounded-full bg-brand-900/50 border border-brand-500/30 text-brand-500 text-sm font-medium mb-6">
          ✨ A nova era da espionagem de anúncios
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Pare de criar anúncios do zero.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-500">
            Clone os milionários.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          A primeira ferramenta do Brasil que rastreia, analisa e recria os melhores criativos do mercado usando Inteligência Artificial. Suba campanhas lucrativas hoje em exatos 12 segundos.
        </p>
        <button className="bg-brand-600 hover:bg-brand-500 text-white text-lg font-semibold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
          Quero clonar anúncios lucrativos
        </button>
      </section>

      {/* Como Funciona Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Como a mágica acontece</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Cole o Link', desc: 'Ache um anúncio bom na Biblioteca do Facebook e cole aqui.' },
            { step: '2', title: 'IA Analisa o Oculto', desc: 'Nosso algoritmo descobre por que a copy e a imagem deles convertem tanto.' },
            { step: '3', title: 'Baixe 3 Variantes', desc: 'Em 12 segundos, a IA gera 3 novas opções únicas focadas no SEU produto.' }
          ].map((item) => (
            <div key={item.step} className="bg-dark-800 p-8 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20 mb-20">
        <div className="bg-gradient-to-b from-dark-800 to-dark-900 p-10 rounded-3xl border border-brand-500/20 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-3xl rounded-full"></div>
          <h2 className="text-3xl font-bold mb-4">Acesso Ilimitado ao Spy Bot</h2>
          <p className="text-slate-400 mb-8 mx-auto max-w-xl">Pare de pagar R$ 1.500 para um designer ou copywriter que atrasa as entregas da sua campanha.</p>
          <div className="flex justify-center items-end gap-2 mb-8">
            <span className="text-2xl text-slate-500 line-through">R$ 197</span>
            <span className="text-5xl font-bold text-white">R$ 47</span>
            <span className="text-xl text-slate-400 mb-1">/mês</span>
          </div>
          <button className="bg-white text-brand-900 hover:bg-slate-200 text-lg font-bold py-4 px-12 rounded-xl transition-all w-full md:w-auto">
            Garantir Meu Acesso Agora
          </button>
        </div>
      </section>
    </main>
  );
}
