"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getTierLimits, TIER_NAMES, isTierAtLeast, getUsageQuotaLimits, getUsagePercent } from "@/lib/feature-gates";

interface OrgInfo {
  tier: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  trialEndsAt: string | null;
}

interface UsageData {
  analyses: number;
  agentRuns: number;
  tokensUsed: number;
}

const PLANS = [
  {
    tier: "scout_individual" as const,
    price: { monthly: 49, yearly: 39 },
    currency: "EUR",
  },
  {
    tier: "club_professional" as const,
    price: { monthly: 299, yearly: 239 },
    currency: "EUR",
    popular: true,
  },
  {
    tier: "holding_multiclub" as const,
    price: { monthly: 899, yearly: 719 },
    currency: "EUR",
  },
];

const FEATURE_ROWS = [
  { key: "analysesPerMonth", label: "analyses" },
  { key: "usersPerOrg", label: "users" },
  { key: "agents", label: "aiAgents" },
  { key: "algorithms", label: "algorithms" },
  { key: "scoutingTargets", label: "scoutingTargets" },
  { key: "reportsPerMonth", label: "reports" },
  { key: "apiAccess", label: "apiAccess" },
  { key: "whiteLabel", label: "whiteLabel" },
  { key: "sso", label: "sso" },
  { key: "exportFormats", label: "exportFormats" },
] as const;

const TIER_BADGE_COLORS: Record<string, string> = {
  free: "bg-zinc-500/20 text-zinc-400",
  scout_individual: "bg-blue-500/20 text-blue-400",
  club_professional: "bg-emerald-500/20 text-emerald-400",
  holding_multiclub: "bg-purple-500/20 text-purple-400",
};

function formatFeatureValue(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Sim" : "--";
  if (typeof value === "number") return value === -1 ? "Ilimitado" : String(value);
  if (Array.isArray(value)) return value.length === 0 ? "--" : value.join(", ");
  return String(value);
}

function getBarColor(percent: number): string {
  if (percent >= 80) return "bg-red-500";
  if (percent >= 60) return "bg-yellow-500";
  return "bg-emerald-500";
}

function getBarTrackColor(percent: number): string {
  if (percent >= 80) return "bg-red-500/10";
  if (percent >= 60) return "bg-yellow-500/10";
  return "bg-emerald-500/10";
}

// ============================================
// Skeleton loader
// ============================================

function UsageSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-800/50 rounded-lg p-4 animate-pulse">
          <div className="h-4 w-24 bg-zinc-700 rounded mb-3" />
          <div className="h-6 w-16 bg-zinc-700 rounded mb-3" />
          <div className="h-2 w-full bg-zinc-700 rounded" />
        </div>
      ))}
    </div>
  );
}

function PlanHeaderSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-20 bg-zinc-700 rounded mb-2" />
          <div className="h-6 w-40 bg-zinc-700 rounded mb-2" />
          <div className="h-4 w-60 bg-zinc-700 rounded" />
        </div>
        <div className="h-10 w-40 bg-zinc-700 rounded-lg" />
      </div>
    </div>
  );
}

// ============================================
// Progress bar component
// ============================================

function UsageProgressBar({
  label,
  current,
  limit,
  t,
}: {
  label: string;
  current: number | null;
  limit: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const isUnlimited = limit === -1;
  const percent = current != null ? getUsagePercent(current, limit) : 0;
  const barColor = getBarColor(percent);
  const trackColor = getBarTrackColor(percent);

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4">
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white mb-2">
        {current ?? "--"}
        {!isUnlimited && (
          <span className="text-sm font-normal text-zinc-500">
            {" "}{t("usageOf")} {limit}
          </span>
        )}
        {isUnlimited && (
          <span className="text-sm font-normal text-zinc-500">
            {" "}({t("unlimited")})
          </span>
        )}
      </p>
      {!isUnlimited && (
        <div className={`w-full h-2 rounded-full ${trackColor}`}>
          <div
            className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="w-full h-2 rounded-full bg-emerald-500/10">
          <div className="h-2 rounded-full bg-emerald-500 w-full opacity-30" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Main page
// ============================================

export default function BillingPage() {
  const t = useTranslations("billing");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState(false);

  const currentTier = orgInfo?.tier ?? "free";

  const fetchOrgInfo = useCallback(async () => {
    setOrgLoading(true);
    try {
      const res = await fetch("/api/org/info");
      if (res.ok) {
        const data = await res.json();
        setOrgInfo(data);
      }
    } catch {
      // silently fail — will show free tier
    } finally {
      setOrgLoading(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    setUsageError(false);
    try {
      const res = await fetch("/api/billing/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      } else {
        setUsageError(true);
      }
    } catch {
      setUsageError(true);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgInfo();
    fetchUsage();
  }, [fetchOrgInfo, fetchUsage]);

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
  const quotaLimits = getUsageQuotaLimits(currentTier);

  // Check if any usage is near the limit (>80%)
  const analysisPercent = usage ? getUsagePercent(usage.analyses, quotaLimits.analysesPerMonth) : 0;
  const agentPercent = usage ? getUsagePercent(usage.agentRuns, quotaLimits.agentRunsPerMonth) : 0;
  const showUsageWarning = analysisPercent > 80 || agentPercent > 80;

  // Trial info
  const trialEndsAt = orgInfo?.trialEndsAt ? new Date(orgInfo.trialEndsAt) : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const isTrialActive = trialDaysLeft !== null && trialDaysLeft > 0;

  // Has Stripe customer (show portal button)
  const hasStripeCustomer = !!orgInfo?.stripeCustomerId;

  // Check URL params for success/canceled
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const showSuccess = params?.get("success") === "true";
  const showCanceled = params?.get("canceled") === "true";

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="text-zinc-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* Status messages */}
      {showSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-400">
          {t("subscriptionActivated")}
        </div>
      )}
      {showCanceled && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-400">
          {t("checkoutCanceled")}
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

      {/* Usage warning banner */}
      {showUsageWarning && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-yellow-400 text-sm font-medium">{t("usageWarning")}</span>
          <button
            onClick={() => {
              document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="ml-auto px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors"
          >
            {t("upgrade")}
          </button>
        </div>
      )}

      {/* Current plan + manage */}
      {orgLoading ? (
        <PlanHeaderSkeleton />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">{t("currentPlan")}</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xl font-semibold text-white">
                  {TIER_NAMES[currentTier as keyof typeof TIER_NAMES] ?? "Free"}
                </p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TIER_BADGE_COLORS[currentTier] ?? TIER_BADGE_COLORS.free}`}>
                  {currentTier === "free" ? "Free" : t("currentPlanBadge")}
                </span>
                {isTrialActive && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                    {t("trialActive")} — {trialDaysLeft} {t("daysLeft")}
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-sm text-zinc-500">
                <span>
                  {limits.analysesPerMonth === -1
                    ? t("unlimited")
                    : `${limits.analysesPerMonth} ${t("analyses").toLowerCase()}/mes`}
                </span>
                <span>
                  {limits.usersPerOrg === -1
                    ? t("unlimited")
                    : `${limits.usersPerOrg} usuario(s)`}
                </span>
                <span>{limits.agents.length} agente(s) IA</span>
              </div>
            </div>
            {hasStripeCustomer && (
              <button
                onClick={handlePortal}
                disabled={loading === "portal"}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {loading === "portal" ? "Abrindo..." : t("manageSub")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Usage this month */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t("usage")}</h3>
        {usageLoading ? (
          <UsageSkeleton />
        ) : usageError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-sm text-red-400">Erro ao carregar dados de uso.</p>
            <button
              onClick={fetchUsage}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UsageProgressBar
              label={t("analyses")}
              current={usage?.analyses ?? null}
              limit={quotaLimits.analysesPerMonth}
              t={t}
            />
            <UsageProgressBar
              label={t("agentRuns")}
              current={usage?.agentRuns ?? null}
              limit={quotaLimits.agentRunsPerMonth}
              t={t}
            />
            <UsageProgressBar
              label={t("tokensUsed")}
              current={usage?.tokensUsed ?? null}
              limit={quotaLimits.tokensPerMonth}
              t={t}
            />
          </div>
        )}
      </div>

      {/* Interval toggle */}
      <div id="plans-section" className="flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "monthly"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          {t("monthly")}
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "yearly"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          {t("yearly")}
          <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            -20%
          </span>
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentTier === plan.tier;
          const isDowngrade = isTierAtLeast(currentTier, plan.tier) && !isCurrentPlan;
          const isUpgrade = !isTierAtLeast(currentTier, plan.tier);
          const price = plan.price[interval];
          const planLimits = getTierLimits(plan.tier);

          return (
            <div
              key={plan.tier}
              className={`relative bg-zinc-900 border rounded-xl p-6 flex flex-col ${
                isCurrentPlan
                  ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                  : plan.popular
                  ? "border-emerald-500/30 ring-1 ring-emerald-500/10"
                  : "border-zinc-800"
              }`}
            >
              {plan.popular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {t("currentPlanBadge")}
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {TIER_NAMES[plan.tier]}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    {"\u20AC"}{price}
                  </span>
                  <span className="text-zinc-400 text-sm">{t("perMonth")}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.analysesPerMonth === -1
                    ? "Analises ilimitadas"
                    : `${planLimits.analysesPerMonth} analises/mes`}
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.agents.length} agentes IA
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.algorithms.length} algoritmos
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.usersPerOrg === -1
                    ? "Usuarios ilimitados"
                    : `Ate ${planLimits.usersPerOrg} usuario(s)`}
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckIcon />
                  {planLimits.scoutingTargets === -1
                    ? "Scouting ilimitado"
                    : `${planLimits.scoutingTargets} alvos de scouting`}
                </li>
                {planLimits.apiAccess && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    Acesso API
                  </li>
                )}
                {planLimits.whiteLabel && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    White-label
                  </li>
                )}
                {planLimits.sso && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    SSO / SAML
                  </li>
                )}
                {planLimits.exportFormats.length > 0 && (
                  <li className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckIcon />
                    Export: {planLimits.exportFormats.join(", ").toUpperCase()}
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleCheckout(plan.tier)}
                disabled={isCurrentPlan || isDowngrade || loading === plan.tier}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                  isCurrentPlan
                    ? "bg-emerald-500/10 text-emerald-400 cursor-not-allowed border border-emerald-500/30"
                    : isDowngrade
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : plan.popular
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {loading === plan.tier
                  ? "Redirecionando..."
                  : isCurrentPlan
                  ? t("currentPlan")
                  : isDowngrade
                  ? t("currentPlan")
                  : isUpgrade
                  ? t("upgrade")
                  : t("upgrade")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">{t("compare")}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-400 pb-3 pr-4">Recurso</th>
              <th className={`text-center pb-3 px-4 ${currentTier === "free" ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}>
                Free
                {currentTier === "free" && <span className="block text-[10px] text-emerald-500 mt-0.5">{t("currentPlanBadge")}</span>}
              </th>
              {PLANS.map((plan) => {
                const isCurrent = currentTier === plan.tier;
                return (
                  <th
                    key={plan.tier}
                    className={`text-center pb-3 px-4 ${isCurrent ? "text-emerald-400 font-semibold" : "text-zinc-400"}`}
                  >
                    {TIER_NAMES[plan.tier]}
                    {isCurrent && <span className="block text-[10px] text-emerald-500 mt-0.5">{t("currentPlanBadge")}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row) => {
              const freeLimits = getTierLimits("free");
              return (
                <tr key={row.key} className="border-b border-zinc-800/50">
                  <td className="py-3 pr-4 text-zinc-300">{t(`feature_${row.label}`)}</td>
                  <td className={`py-3 px-4 text-center ${currentTier === "free" ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-500"}`}>
                    {formatFeatureValue(row.key, freeLimits[row.key])}
                  </td>
                  {PLANS.map((plan) => {
                    const planLimits = getTierLimits(plan.tier);
                    const isCurrent = currentTier === plan.tier;
                    return (
                      <td
                        key={plan.tier}
                        className={`py-3 px-4 text-center ${isCurrent ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-300"}`}
                      >
                        {formatFeatureValue(row.key, planLimits[row.key])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invoice history placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t("invoiceHistory")}</h3>
        <p className="text-sm text-zinc-500">{t("invoiceHistoryPlaceholder")}</p>
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

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
