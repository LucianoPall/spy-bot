import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos e condições de uso da plataforma AdClone.",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-slate-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          ← Voltar
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white">Termos de Uso</h1>
        <p className="mt-2 text-sm text-slate-400">
          Última atualização: abril de 2026
        </p>

        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Aceitação</h2>
            <p>
              Ao acessar e utilizar a plataforma AdClone (&quot;Serviço&quot;), você concorda
              integralmente com estes Termos de Uso. Caso não concorde, não utilize o
              Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Descrição do Serviço
            </h2>
            <p>
              O AdClone é uma ferramenta de inteligência publicitária que permite
              analisar anúncios públicos disponíveis em bibliotecas de plataformas de
              anúncios (como Meta Ads Library) e gerar variantes de copy e imagens
              utilizando inteligência artificial.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              3. Uso Permitido
            </h2>
            <p>
              Você concorda em utilizar o AdClone apenas para fins legais e em
              conformidade com os termos de uso das plataformas de origem dos
              anúncios. É vedado: (a) copiar integralmente criativos alheios sem
              adaptação; (b) violar direitos de propriedade intelectual; (c) utilizar
              o Serviço para criar conteúdo enganoso, fraudulento ou ilegal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              4. Conta e Créditos
            </h2>
            <p>
              O Serviço opera por sistema de créditos. Créditos consumidos não são
              reembolsáveis, exceto em caso de falha técnica comprovada do lado do
              AdClone. Planos pagos são cobrados via Stripe e podem ser cancelados a
              qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Limitação de Responsabilidade
            </h2>
            <p>
              O AdClone fornece o Serviço &quot;no estado em que se encontra&quot;. Não
              garantimos resultados publicitários específicos. O uso dos criativos
              gerados é de responsabilidade exclusiva do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              6. Propriedade Intelectual
            </h2>
            <p>
              Os criativos gerados a partir de prompts do usuário pertencem ao
              usuário, respeitadas as políticas dos provedores de IA (OpenAI/DALL-E).
              A marca, interface e código-fonte do AdClone permanecem de propriedade
              da empresa operadora.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              7. Alterações dos Termos
            </h2>
            <p>
              Estes Termos podem ser atualizados a qualquer momento. Alterações
              relevantes serão comunicadas por email aos usuários ativos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Contato</h2>
            <p>
              Dúvidas sobre estes Termos podem ser enviadas para o email de suporte
              disponibilizado na plataforma.
            </p>
          </section>

          <p className="mt-8 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/80">
            ⚠️ Este é um documento modelo. Antes de operar comercialmente,
            recomendamos revisão por advogado especialista em direito digital.
          </p>
        </div>
      </div>
    </main>
  );
}
