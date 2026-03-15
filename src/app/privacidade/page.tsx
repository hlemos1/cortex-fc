import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidade — CORTEX FC",
  description: "Como o CORTEX FC coleta, usa e protege seus dados",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 text-sm hover:underline">
          &larr; Voltar
        </Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">Politica de Privacidade</h1>
        <p className="text-sm text-zinc-500 mb-8">Ultima atualizacao: 15 de marco de 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Dados que Coletamos</h2>
            <p>Coletamos os seguintes dados:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, email, senha (hash bcrypt), organizacao</li>
              <li><strong>Dados de uso:</strong> analises criadas, jogadores consultados, agentes IA utilizados</li>
              <li><strong>Dados de pagamento:</strong> processados diretamente pelo Stripe (nao armazenamos dados de cartao)</li>
              <li><strong>Dados tecnicos:</strong> IP, user agent, timestamps de acesso</li>
              <li><strong>Dados de OAuth:</strong> nome e email do Google (quando login via Google)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Como Usamos seus Dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Autenticacao e gerenciamento de conta</li>
              <li>Processamento de analises neurais e relatorios</li>
              <li>Cobranca e gestao de assinaturas</li>
              <li>Melhoria do produto e algoritmos de IA</li>
              <li>Comunicacao sobre servico (atualizacoes, alertas, suporte)</li>
              <li>Seguranca e prevencao de fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Compartilhamento de Dados</h2>
            <p>Nao vendemos seus dados. Compartilhamos apenas com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Stripe:</strong> processamento de pagamentos</li>
              <li><strong>Anthropic (Claude):</strong> processamento de analises IA (dados anonimizados)</li>
              <li><strong>Neon:</strong> hospedagem do banco de dados (infraestrutura)</li>
              <li><strong>Vercel:</strong> hospedagem da aplicacao</li>
              <li><strong>Autoridades:</strong> quando requerido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Seguranca</h2>
            <p>
              Implementamos medidas de seguranca incluindo: senhas com hash bcrypt (custo 12),
              sessoes JWT com rotacao, rate limiting, CORS restritivo, validacao de inputs,
              e auditoria de todas as operacoes de IA. Dados em transito sao protegidos por TLS 1.3.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Retencao de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Apos exclusao da conta,
              dados pessoais sao removidos em ate 30 dias. Logs de auditoria anonimizados
              podem ser retidos por ate 12 meses para fins de seguranca.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Seus Direitos (LGPD)</h2>
            <p>Em conformidade com a Lei Geral de Protecao de Dados (LGPD), voce tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar exclusao dos seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Obter informacao sobre compartilhamento</li>
            </ul>
            <p>
              Para exercer seus direitos, envie email para:{" "}
              <span className="text-emerald-400">privacidade@cortexfc.com</span>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para autenticacao (session token) e preferencias.
              Nao utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Menores de Idade</h2>
            <p>
              A Plataforma e destinada a profissionais do futebol e nao e direcionada a menores
              de 18 anos. Nao coletamos intencionalmente dados de menores.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Alteracoes</h2>
            <p>
              Podemos atualizar esta politica periodicamente. Alteracoes significativas serao
              comunicadas por email ou notificacao na Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. DPO / Contato</h2>
            <p>
              Encarregado de Protecao de Dados:{" "}
              <span className="text-emerald-400">privacidade@cortexfc.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
