import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — CORTEX FC",
  description: "Termos e condições de uso da plataforma CORTEX FC",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 text-sm hover:underline">
          &larr; Voltar
        </Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">Termos de Uso</h1>
        <p className="text-sm text-zinc-500 mb-8">Ultima atualizacao: 15 de marco de 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Aceitacao dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma CORTEX FC (&quot;Plataforma&quot;), voce concorda com estes Termos de Uso.
              Se voce nao concordar, nao utilize a Plataforma. O uso continuado constitui aceitacao de quaisquer
              alteracoes futuras nestes termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Descricao do Servico</h2>
            <p>
              O CORTEX FC e uma plataforma de inteligencia artificial aplicada a analise de futebol profissional.
              Oferecemos ferramentas de analise neural, scouting, relatorios e agentes de IA para apoiar decisoes
              estrategicas no mercado de transferencias e gestao de elencos.
            </p>
            <p>
              As analises geradas pela IA sao ferramentas de apoio a decisao e nao constituem recomendacoes
              financeiras, juridicas ou contratuais. Decisoes baseadas nos dados da Plataforma sao de responsabilidade
              exclusiva do usuario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Cadastro e Conta</h2>
            <p>
              Para utilizar a Plataforma, voce deve criar uma conta com informacoes veridicas. Voce e responsavel
              por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.
              Notifique-nos imediatamente em caso de uso nao autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Planos e Pagamento</h2>
            <p>
              A Plataforma oferece planos de assinatura com diferentes niveis de acesso. Os precos sao publicados
              na pagina de precos e podem ser alterados com aviso previo de 30 dias. Pagamentos sao processados
              via Stripe. Cancelamentos podem ser feitos a qualquer momento pelo painel de billing, com efeito
              ao final do periodo pago.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteudo da Plataforma — incluindo algoritmos (AST, CLF, GNE, WSE, RBL, SACE, SCN+),
              metodologia Cortex (camadas C1-C7, indices Vx/Rx), interface, codigo e marca — e propriedade
              exclusiva da CORTEX FC. E proibida a reproducao, distribuicao ou engenharia reversa sem autorizacao.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Uso Aceitavel</h2>
            <p>Voce concorda em nao:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Compartilhar credenciais de acesso com terceiros</li>
              <li>Usar a Plataforma para fins ilegais ou antidesportivos</li>
              <li>Tentar extrair dados em massa (scraping) ou acessar APIs sem autorizacao</li>
              <li>Revender ou redistribuir analises sem autorizacao por escrito</li>
              <li>Manipular ou falsificar dados inseridos na Plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Limitacao de Responsabilidade</h2>
            <p>
              A Plataforma e fornecida &quot;como esta&quot;. Nao garantimos precisao absoluta das analises geradas por IA.
              Em nenhuma hipotese a CORTEX FC sera responsavel por danos indiretos, perda de lucros ou decisoes
              de negocio baseadas nas informacoes da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Rescisao</h2>
            <p>
              Podemos suspender ou encerrar sua conta em caso de violacao destes termos, com notificacao previa
              quando possivel. Voce pode encerrar sua conta a qualquer momento pelo painel de configuracoes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Legislacao Aplicavel</h2>
            <p>
              Estes termos sao regidos pelas leis da Republica Federativa do Brasil. Qualquer disputa sera
              resolvida no foro da comarca do Rio de Janeiro, RJ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Contato</h2>
            <p>
              Para questoes sobre estes termos: <span className="text-emerald-400">legal@cortexfc.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
