"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { getTierLimits, TIER_NAMES, isTierAtLeast } from "@/lib/feature-gates";

const PLANS = [
  {
    tier: "scout_individual" as const,
    name: "Scout Individual",
    price: { monthly: 49, yearly: 39 },
    currency: "EUR",
    features: [
      "50 analises neurais/mes",
      "3 algoritmos (SCN+, AST, CLF)",
      "2 agentes IA (Oracle, Scout)",
      "25 alvos de scouting",
      "10 relatorios/mes",
      "Exportacao CSV",
      "1 usuario",
    ],
  },
  {
    tier: "club_professional" as const,
    name: "Club Professional",
    price: { monthly: 299, yearly: 239 },
    currency: "EUR",
    popular: true,
    features: [
      "Analises ilimitadas",
      "Todos os 7 algoritmos",
      "6 agentes IA completos",
      "Scouting ilimitado",
      "Relatorios ilimitados",
      "Exportacao CSV + PDF",
      "Ate 10 usuarios",
      "Acesso API",
    ],
  },
  {
    tier: "holding_multiclub" as const,
    name: "Holding Multi-Club",
    price: { monthly: 899, yearly: 719 },
    currency: "EUR",
    features: [
      "Tudo do Club Professional",
      "Multi-clube (grupo/holding)",
      "Usuarios ilimitados",
      "White-label",
      "SSO / SAML",
      "Exportacao XLSX",
      "Suporte dedicado",
      "SLA 99.9%",
    ],
  },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get current tier from session — defaults to free
  const currentTier: string = "free"; // TODO: fetch from org via API

  const handleCheckout = async (tier: string) => {
    setLoading(tier);
    setMessage(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erro ao criar checkout" });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexao" });
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: data.error ?? "Erro ao abrir portal" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexao" });
    } finally {
      setLoading(null);
    }
  };

  const limits = getTierLimits(currentTier);

  // Check URL params for success/canceled
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const showSuccess = params?.get("success") === "true";
  const showCanceled = params?.get("canceled") === "true";

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Assinatura & Billing</h1>
        <p className="text-zinc-400 mt-1">
          Gerencie seu plano e acesso as funcionalidades do Cortex FC
        </p>
      </div>

      {/* Status messages */}
      {showSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-400">
          Assinatura ativada com sucesso! Seu plano sera atualizado em instantes.
        </div>
      )}
      {showCanceled && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-400">
          Checkout cancelado. Voce pode tentar novamente quando quiser.
        </div>
      )}
      {message && (
        <div
          className={`rounded-lg p-4 border ${
            message.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current plan */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Plano atual</p>
            <p className="text-xl font-semibold text-white mt-1">
              {TIER_NAMES[currentTier as keyof typeof TIER_NAMES] ?? "Free"}
            </p>
            <div className="flex gap-4 mt-2 text-sm text-zinc-500">
              <span>{limits.analysesPerMonth === -1 ? "Ilimitado" : `${limits.analysesPerMonth} analises/mes`}</span>
              <span>{limits.usersPerOrg === -1 ? "Ilimitado" : `${limits.usersPerOrg} usuario(s)`}</span>
              <span>{limits.agents.length} agente(s) IA</span>
            </div>
          </div>
          {currentTier !== "free" && (
            <button
              onClick={handlePortal}
              disabled={loading === "portal"}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {loading === "portal" ? "Abrindo..." : "Gerenciar Assinatura"}
            </button>
          )}
        </div>
      </div>

      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "monthly"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "yearly"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Anual
          <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            -20%
          </span>
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentTier === plan.tier;
          const isUpgrade = !isTierAtLeast(currentTier, plan.tier);
          const price = plan.price[interval];

          return (
            <div
              key={plan.tier}
              className={`relative bg-zinc-900 border rounded-xl p-6 flex flex-col ${
                plan.popular
                  ? "border-emerald-500/50 ring-1 ring-emerald-500/20"
                  : "border-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    {"\u20AC"}{price}
                  </span>
                  <span className="text-zinc-400 text-sm">/mes</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.tier)}
                disabled={isCurrentPlan || loading === plan.tier}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                  isCurrentPlan
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : plan.popular
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {loading === plan.tier
                  ? "Redirecionando..."
                  : isCurrentPlan
                  ? "Plano atual"
                  : isUpgrade
                  ? "Fazer upgrade"
                  : "Mudar plano"}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ / Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informacoes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
          <div>
            <p className="font-medium text-zinc-300">Trial gratuito</p>
            <p>Todos os novos planos incluem 14 dias de trial gratis. Cancele a qualquer momento.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-300">Pagamento seguro</p>
            <p>Processado via Stripe. Aceitamos Visa, Mastercard, American Express e SEPA.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-300">Downgrade</p>
            <p>Voce pode fazer downgrade a qualquer momento. O acesso premium continua ate o fim do ciclo pago.</p>
          </div>
          <div>
            <p className="font-medium text-zinc-300">Enterprise / Volume</p>
            <p>Para grupos com 3+ clubes ou necessidades customizadas, entre em contato: enterprise@cortexfc.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
