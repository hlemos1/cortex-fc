"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Building2, Upload, Users, ArrowRight, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Organizacao", icon: Building2 },
  { id: 2, title: "Perfil", icon: Upload },
  { id: 3, title: "Equipe", icon: Users },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<string>("");
  const [inviteEmails, setInviteEmails] = useState("");

  const handleFinish = async () => {
    setLoading(true);
    setError("");

    try {
      const emails = inviteEmails
        .split("\n")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgName.trim(),
          orgType: orgType || "other",
          inviteEmails: emails.length > 0 ? emails : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao completar onboarding");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao completar onboarding");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Configurar CORTEX FC</h1>
          <p className="text-zinc-400 text-sm mt-1">Vamos preparar sua plataforma em 3 passos</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step > s.id
                    ? "bg-emerald-500 text-white"
                    : step === s.id
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-px ${step > s.id ? "bg-emerald-500" : "bg-zinc-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Sua Organizacao</h2>
                <p className="text-sm text-zinc-400">Como se chama seu clube, agencia ou empresa?</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Nome da organizacao</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ex: Nottingham Forest FC"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "club", label: "Clube de Futebol" },
                    { value: "agency", label: "Agencia / Empresario" },
                    { value: "media", label: "Midia / Jornalismo" },
                    { value: "other", label: "Outro" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOrgType(opt.value)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        orgType === opt.value
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!orgName.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Logo (opcional)</h2>
                <p className="text-sm text-zinc-400">Personalize seu dashboard com o logo da sua organizacao</p>
              </div>
              <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-zinc-600 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Arraste ou clique para fazer upload</p>
                <p className="text-xs text-zinc-600 mt-1">PNG, SVG ou JPG (max 2MB)</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Convidar Equipe</h2>
                <p className="text-sm text-zinc-400">Adicione colegas para trabalhar juntos (pode pular e fazer depois)</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Emails (um por linha)</label>
                <textarea
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder={"analista@seuclube.com\nscout@seuclube.com"}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <p className="text-xs text-zinc-600 mt-1">Convites serao enviados como &quot;Analista&quot; (podem ser promovidos depois)</p>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {loading ? "Configurando..." : "Iniciar CORTEX FC"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skip — removed to enforce onboarding */}
      </div>
    </div>
  );
}
