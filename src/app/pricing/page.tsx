"use client"

import { useState } from "react"
import Link from "next/link"
import { Brain, Check, ChevronDown, ChevronUp, Sparkles, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Scout Individual",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Para scouts e analistas independentes",
    features: [
      "Até 50 análises neurais/mês",
      "3 algoritmos (AST, CLF, SCN+)",
      "Camadas C1-C3 (Técnico, Tático, Físico)",
      "Dashboard básico",
      "Exportação CSV",
      "1 usuário",
    ],
    cta: "Começar Grátis",
    ctaSubtext: "7 dias de trial grátis",
    href: "/register",
    popular: false,
  },
  {
    name: "Club Professional",
    monthlyPrice: 299,
    yearlyPrice: 239,
    description: "Para clubes profissionais e departamentos de scouting",
    features: [
      "Análises neurais ilimitadas",
      "Todos os 7 algoritmos",
      "Todas as 7 camadas neurais",
      "6 Agentes de IA (ORACLE, SCOUT, ANALISTA, CFO, BOARD, COACHING)",
      "Relatórios PDF executivos",
      "Scouting pipeline (até 500 alvos)",
      "API access",
      "Até 10 usuários",
      "Suporte prioritário",
    ],
    cta: "Iniciar Trial Grátis",
    ctaSubtext: "14 dias de trial grátis",
    href: "/register",
    popular: true,
  },
  {
    name: "Holding Multi-Club",
    monthlyPrice: 899,
    yearlyPrice: 719,
    description: "Para holdings e grupos multi-clube",
    features: [
      "Tudo do Professional",
      "Gestão multi-clube (até 5 clubes)",
      "Benchmarking entre clubes",
      "White-label (logo personalizado)",
      "SSO/SAML",
      "Usuários ilimitados",
      "SLA dedicado (99.9%)",
      "Account manager dedicado",
    ],
    cta: "Falar com Vendas",
    ctaSubtext: "Demo personalizada incluída",
    href: "/register",
    popular: false,
  },
]

const faqs = [
  {
    question: "Posso testar antes de pagar?",
    answer:
      "Sim! Oferecemos 7 dias grátis em qualquer plano. Não é necessário cartão de crédito para começar.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Aceitamos pagamento por cartão de crédito ou fatura mensal. Para planos anuais, o pagamento pode ser feito em parcela única ou trimestral.",
  },
  {
    question: "Posso trocar de plano?",
    answer:
      "Claro! Você pode fazer upgrade ou downgrade a qualquer momento. O valor é ajustado proporcionalmente ao período restante.",
  },
  {
    question: "Os dados são seguros?",
    answer:
      "Absolutamente. Utilizamos criptografia end-to-end, servidores na Europa e somos totalmente LGPD compliant. Seus dados de scouting são seu ativo mais valioso — tratamos com esse nível de seriedade.",
  },
  {
    question: "Quanto tempo para configurar?",
    answer:
      "Setup completo em até 24h com onboarding dedicado. Nossa equipe configura a plataforma, importa dados e treina sua equipe.",
  },
  {
    question: "Tem desconto para clubes brasileiros?",
    answer:
      "Sim, temos condições especiais para clubes brasileiros. Entre em contato com nossa equipe comercial para saber mais.",
  },
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-zinc-800/60 glass-strong sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-100 tracking-tight">CORTEX FC</span>
              <span className="text-[10px] text-zinc-600 font-mono tracking-widest ml-2">NEURAL ANALYTICS</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-20 pb-12 px-6 text-center animate-fade-in">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight">
            Escolha o plano ideal{" "}
            <span className="gradient-text">para seu clube</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Inteligência neural ao alcance de qualquer departamento de futebol.
            Comece grátis e escale conforme sua operação cresce.
          </p>
        </div>

        {/* Toggle */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium transition-colors ${
              !isAnnual ? "text-zinc-100" : "text-zinc-500"
            }`}
          >
            Mensal
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              isAnnual ? "bg-emerald-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium transition-colors ${
              isAnnual ? "text-zinc-100" : "text-zinc-500"
            }`}
          >
            Anual
          </span>
          {isAnnual && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium animate-scale-in">
              -20% desconto
            </span>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-[1px] animate-slide-up stagger-${index + 1} ${
                plan.popular
                  ? "bg-gradient-to-b from-emerald-500/50 to-emerald-500/0"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-emerald-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-900/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    MAIS POPULAR
                  </span>
                </div>
              )}
              <div
                className={`glass rounded-2xl p-8 h-full flex flex-col card-hover ${
                  plan.popular ? "ring-1 ring-emerald-500/30" : ""
                }`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>
                </div>

                <div className="mt-6 mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-zinc-100 font-mono">
                      €{isAnnual ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-zinc-500 text-sm">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-zinc-600 mt-1">
                      Cobrado anualmente (€{plan.yearlyPrice * 12}/ano)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link
                    href={plan.href}
                    className={`block w-full text-center py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      plan.popular
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:-translate-y-0.5"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <p className="text-center text-xs text-zinc-600 mt-2">
                    {plan.ctaSubtext}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-100 text-center mb-10">
            Perguntas Frequentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="glass rounded-xl overflow-hidden card-hover"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium text-zinc-200">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 animate-fade-in">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-zinc-100">
            Ainda tem dúvidas?
          </h2>
          <p className="text-zinc-400 mt-2 text-sm">
            Agende uma demo personalizada e veja o CORTEX FC em ação com os
            dados do seu clube.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:-translate-y-0.5"
          >
            Agendar Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
