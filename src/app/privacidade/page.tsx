import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o AdClone coleta, armazena e utiliza seus dados pessoais, em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-slate-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          ← Voltar
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Última atualização: abril de 2026 — conformidade com LGPD (Lei
          13.709/2018)
        </p>

        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              1. Dados que coletamos
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Dados de cadastro:</strong> nome, email e senha
                criptografada.
              </li>
              <li>
                <strong>Dados de uso:</strong> histórico de análises, criativos
                gerados, consumo de créditos.
              </li>
              <li>
                <strong>Dados de pagamento:</strong> processados diretamente pelo
                Stripe — não armazenamos dados de cartão.
              </li>
              <li>
                <strong>Dados técnicos:</strong> logs de acesso, IP, tipo de
                navegador (para segurança e debugging).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Finalidade do tratamento
            </h2>
            <p>Utilizamos seus dados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer as funcionalidades do Serviço</li>
              <li>Processar pagamentos e emitir comprovantes</li>
              <li>Enviar comunicações operacionais (relatórios, suporte)</li>
              <li>Detectar e prevenir fraudes</li>
              <li>Melhorar o produto de forma agregada e anonimizada</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              3. Compartilhamento com terceiros
            </h2>
            <p>
              Compartilhamos dados apenas com processadores necessários para a
              operação:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Supabase</strong> — banco de dados e autenticação
              </li>
              <li>
                <strong>Stripe</strong> — processamento de pagamentos
              </li>
              <li>
                <strong>OpenAI / DALL-E</strong> — geração de IA (prompts
                enviados)
              </li>
              <li>
                <strong>Apify</strong> — coleta de dados públicos de anúncios
              </li>
              <li>
                <strong>Resend</strong> — envio de emails transacionais
              </li>
              <li>
                <strong>Vercel</strong> — hospedagem da aplicação
              </li>
            </ul>
            <p className="mt-2">
              Não vendemos seus dados pessoais para terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              4. Seus direitos (LGPD)
            </h2>
            <p>Você tem direito a, a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar seus dados</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar exclusão da conta e dados associados</li>
              <li>Exportar seus dados (portabilidade)</li>
              <li>Revogar consentimentos</li>
            </ul>
            <p className="mt-2">
              Exercite esses direitos pelo email de suporte. Responderemos em até
              15 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Retenção de dados
            </h2>
            <p>
              Mantemos dados enquanto a conta estiver ativa. Após solicitação de
              exclusão, dados pessoais são removidos em até 30 dias, exceto quando
              retenção for obrigatória por lei (ex: notas fiscais — 5 anos).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Segurança</h2>
            <p>
              Adotamos medidas técnicas padrão de mercado: conexões HTTPS, senhas
              criptografadas (bcrypt), Row-Level Security no banco, auditoria de
              acessos administrativos e backups automáticos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              7. Cookies e rastreamento
            </h2>
            <p>
              Utilizamos cookies estritamente necessários para autenticação e
              sessão. Não utilizamos cookies de marketing de terceiros no momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              8. Encarregado (DPO)
            </h2>
            <p>
              Dúvidas ou reclamações sobre tratamento de dados devem ser
              endereçadas ao encarregado pelo email de suporte da plataforma.
            </p>
          </section>

          <p className="mt-8 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/80">
            ⚠️ Este é um documento modelo em conformidade com os princípios da
            LGPD. Antes de operar comercialmente em escala, recomendamos revisão
            por advogado especializado em privacidade e proteção de dados.
          </p>
        </div>
      </div>
    </main>
  );
}
