"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Brain,
  Building2,
  Trophy,
  Users,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Search,
  SkipForward,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface LeagueItem {
  league: { id: number; name: string; type: string; logo: string };
  country: { name: string; code: string | null; flag: string | null };
  seasons: Array<{ year: number; current: boolean }>;
}

interface CountryItem {
  name: string;
  code: string | null;
  flag: string | null;
}

interface TeamItem {
  team: { id: number; name: string; code: string; country: string; founded: number; logo: string };
  venue: { name: string; city: string; capacity: number };
}

interface InviteEntry {
  email: string;
  role: "analyst" | "scout" | "viewer";
}

// ============================================
// CONSTANTS
// ============================================

const STEPS = [
  { id: 1, title: "Organizacao", icon: Building2 },
  { id: 2, title: "Liga", icon: Trophy },
  { id: 3, title: "Elenco", icon: Users },
  { id: 4, title: "Equipe", icon: UserPlus },
];

const ORG_TYPES = [
  { value: "club", label: "Clube" },
  { value: "agency", label: "Agencia" },
  { value: "media", label: "Midia/Analytics" },
  { value: "other", label: "Outro" },
];

const COMMON_COUNTRIES = [
  "Brazil",
  "England",
  "Spain",
  "Germany",
  "Italy",
  "France",
  "Portugal",
  "Argentina",
  "Netherlands",
  "Belgium",
  "Turkey",
  "Mexico",
  "USA",
  "Japan",
  "Saudi Arabia",
];

const COUNTRY_FLAGS: Record<string, string> = {
  Brazil: "🇧🇷",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Spain: "🇪🇸",
  Germany: "🇩🇪",
  Italy: "🇮🇹",
  France: "🇫🇷",
  Portugal: "🇵🇹",
  Argentina: "🇦🇷",
  Netherlands: "🇳🇱",
  Belgium: "🇧🇪",
  Turkey: "🇹🇷",
  Mexico: "🇲🇽",
  USA: "🇺🇸",
  Japan: "🇯🇵",
  "Saudi Arabia": "🇸🇦",
};

// ============================================
// COMPONENT
// ============================================

export default function OnboardingPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Organizacao
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [country, setCountry] = useState("");

  // Step 2 — Liga
  const [countrySearch, setCountrySearch] = useState("");
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<LeagueItem | null>(null);

  // Step 3 — Elenco
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Step 4 — Equipe
  const [invites, setInvites] = useState<InviteEntry[]>([{ email: "", role: "analyst" }]);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchCountries = useCallback(async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch("/api/football/leagues?countries=true");
      if (res.ok) {
        const data = await res.json();
        setCountries(data.data ?? []);
      }
    } catch {
      // silently fail — countries list is best effort
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2 && countries.length === 0) {
      fetchCountries();
    }
  }, [step, countries.length, fetchCountries]);

  const fetchLeagues = useCallback(async (countryName: string) => {
    setLoadingLeagues(true);
    setLeagues([]);
    try {
      const res = await fetch(`/api/football/leagues?country=${encodeURIComponent(countryName)}`);
      if (res.ok) {
        const data = await res.json();
        setLeagues(data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingLeagues(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchLeagues(selectedCountry);
    }
  }, [selectedCountry, fetchLeagues]);

  const fetchTeams = useCallback(async (leagueId: number) => {
    setLoadingTeams(true);
    setTeams([]);
    try {
      const res = await fetch(`/api/football/teams?league=${leagueId}&season=2024`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    if (step === 3 && selectedLeague) {
      fetchTeams(selectedLeague.league.id);
    }
  }, [step, selectedLeague, fetchTeams]);

  // ============================================
  // IMPORT SQUAD
  // ============================================

  const handleImportSquad = async (team: TeamItem) => {
    setImporting(true);
    setImportResult(null);
    setError("");

    try {
      // Fetch squad players, then import each
      const squadRes = await fetch(`/api/football/squad?team=${team.team.id}`);
      if (!squadRes.ok) throw new Error("Falha ao buscar elenco");

      const squadData = await squadRes.json();
      const squadPlayers = squadData.data?.[0]?.players ?? squadData.data ?? [];

      let imported = 0;
      let skipped = 0;

      for (const p of squadPlayers) {
        const playerId = p.id ?? p.player?.id;
        if (!playerId) continue;

        try {
          const importRes = await fetch("/api/players/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ externalId: playerId }),
          });

          if (importRes.ok) {
            const result = await importRes.json();
            if (result.imported) imported++;
            else skipped++;
          }
        } catch {
          // skip individual player failures
        }
      }

      setImportResult(`${imported} jogadores importados, ${skipped} ja existiam`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar elenco");
    } finally {
      setImporting(false);
    }
  };

  // ============================================
  // FINISH ONBOARDING
  // ============================================

  const handleFinish = async () => {
    setLoading(true);
    setError("");

    try {
      const validInvites = invites.filter((inv) => inv.email.trim().length > 0);

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgName.trim(),
          orgType: orgType || "other",
          country: country.trim() || undefined,
          leagueId: selectedLeague ? selectedLeague.league.id : undefined,
          invites: validInvites.length > 0 ? validInvites : undefined,
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

  // ============================================
  // INVITE HELPERS
  // ============================================

  const addInviteRow = () => {
    setInvites([...invites, { email: "", role: "analyst" }]);
  };

  const updateInvite = (index: number, field: keyof InviteEntry, value: string) => {
    const updated = [...invites];
    updated[index] = { ...updated[index], [field]: value };
    setInvites(updated);
  };

  const removeInvite = (index: number) => {
    if (invites.length <= 1) return;
    setInvites(invites.filter((_, i) => i !== index));
  };

  // ============================================
  // FILTERED COUNTRIES
  // ============================================

  const filteredCountries = countrySearch.trim()
    ? countries.filter((c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : countries.filter((c) => COMMON_COUNTRIES.includes(c.name));

  // ============================================
  // PROGRESS
  // ============================================

  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Configurar CORTEX FC</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Vamos preparar sua plataforma em {STEPS.length} passos
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1">
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
                <span
                  className={`text-[10px] font-medium ${
                    step >= s.id ? "text-emerald-400" : "text-zinc-600"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-10 h-px mb-4 ${step > s.id ? "bg-emerald-500" : "bg-zinc-800"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          {/* ============================== */}
          {/* STEP 1 — Organizacao           */}
          {/* ============================== */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Configurar Organizacao</h2>
                <p className="text-sm text-zinc-400">
                  Informe os dados basicos da sua organizacao
                </p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Nome da organizacao *
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ex: Nottingham Forest FC"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {ORG_TYPES.map((opt) => (
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

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Pais</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex: Brazil"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
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

          {/* ============================== */}
          {/* STEP 2 — Selecionar Liga       */}
          {/* ============================== */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  Selecionar Liga Principal
                </h2>
                <p className="text-sm text-zinc-400">
                  Escolha a liga que voce mais acompanha para facilitar a importacao de dados
                </p>
              </div>

              {/* Country selector */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Pais da liga</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Buscar pais..."
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {loadingCountries ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                    {filteredCountries.slice(0, 30).map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedCountry(c.name)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                          selectedCountry === c.name
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                            : "bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-750"
                        }`}
                      >
                        {COUNTRY_FLAGS[c.name] ?? c.flag ?? ""} {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Leagues */}
              {selectedCountry && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    Ligas em {selectedCountry}
                  </label>
                  {loadingLeagues ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    </div>
                  ) : leagues.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">
                      Nenhuma liga encontrada
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {leagues.map((l) => (
                        <button
                          key={l.league.id}
                          onClick={() => setSelectedLeague(l)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            selectedLeague?.league.id === l.league.id
                              ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-750 hover:text-white"
                          }`}
                        >
                          {l.league.logo && (
                            <Image
                              src={l.league.logo}
                              alt={l.league.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium">{l.league.name}</p>
                            <p className="text-xs text-zinc-500">
                              {COUNTRY_FLAGS[l.country.name] ?? l.country.flag ?? ""}{" "}
                              {l.country.name} — {l.league.type}
                            </p>
                          </div>
                          {selectedLeague?.league.id === l.league.id && (
                            <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedLeague}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedLeague(null);
                  setStep(3);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 text-xs hover:text-zinc-400 transition-colors"
              >
                <SkipForward className="w-3 h-3" /> Pular este passo
              </button>
            </div>
          )}

          {/* ============================== */}
          {/* STEP 3 — Importar Elenco       */}
          {/* ============================== */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Importar Primeiro Elenco</h2>
                <p className="text-sm text-zinc-400">
                  {selectedLeague
                    ? `Selecione um time da ${selectedLeague.league.name} para importar jogadores`
                    : "Selecione uma liga primeiro ou pule para continuar"}
                </p>
              </div>

              {selectedLeague ? (
                <>
                  {loadingTeams ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      <span className="ml-2 text-sm text-zinc-400">Carregando times...</span>
                    </div>
                  ) : importing ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-sm text-zinc-300">Importando jogadores...</p>
                      <p className="text-xs text-zinc-500">Isso pode levar alguns segundos</p>
                    </div>
                  ) : importResult ? (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-emerald-300">{importResult}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {teams.map((t) => (
                        <button
                          key={t.team.id}
                          onClick={() => setSelectedTeam(t)}
                          className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg text-center transition-colors ${
                            selectedTeam?.team.id === t.team.id
                              ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-750 hover:text-white"
                          }`}
                        >
                          {t.team.logo && (
                            <Image
                              src={t.team.logo}
                              alt={t.team.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-contain"
                            />
                          )}
                          <span className="text-xs font-medium leading-tight">
                            {t.team.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Confirm import */}
                  {selectedTeam && !importing && !importResult && (
                    <div className="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
                      <p className="text-sm text-zinc-300 text-center mb-3">
                        Importar elenco do <span className="text-white font-semibold">{selectedTeam.team.name}</span>?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedTeam(null)}
                          className="flex-1 py-2 bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:bg-zinc-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleImportSquad(selectedTeam)}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-500 transition-colors"
                        >
                          Confirmar importacao
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Nenhuma liga selecionada. Voce pode voltar e escolher uma liga ou pular este
                    passo.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {!importing && !importResult && (
                <button
                  onClick={() => setStep(4)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 text-xs hover:text-zinc-400 transition-colors"
                >
                  <SkipForward className="w-3 h-3" /> Pular este passo
                </button>
              )}
            </div>
          )}

          {/* ============================== */}
          {/* STEP 4 — Convidar Equipe       */}
          {/* ============================== */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Convidar Equipe</h2>
                <p className="text-sm text-zinc-400">
                  Adicione colegas para trabalhar juntos (pode pular e fazer depois)
                </p>
              </div>

              <div className="space-y-3">
                {invites.map((inv, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="email"
                      value={inv.email}
                      onChange={(e) => updateInvite(i, "email", e.target.value)}
                      placeholder="email@exemplo.com"
                      className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <select
                      value={inv.role}
                      onChange={(e) => updateInvite(i, "role", e.target.value)}
                      className="w-28 px-2 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="analyst">Analista</option>
                      <option value="scout">Scout</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {invites.length > 1 && (
                      <button
                        onClick={() => removeInvite(i)}
                        className="px-2 text-zinc-500 hover:text-red-400 transition-colors text-sm"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addInviteRow}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  + Adicionar outro convite
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Configurando...
                    </>
                  ) : (
                    "Iniciar CORTEX FC"
                  )}
                </button>
              </div>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 text-xs hover:text-zinc-400 transition-colors disabled:opacity-40"
              >
                <SkipForward className="w-3 h-3" /> Pular e iniciar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
