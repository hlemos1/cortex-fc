"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Settings,
  Building2,
  Key,
  Brain,
  Bell,
  CreditCard,
  Database,
  Download,
  HardDrive,
  Trash2,
  Check,
  Crown,
  Save,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LanguageSection } from "./LanguageSection"
import { DensitySection } from "./DensitySection"
import { SoundSection } from "./SoundSection"
import { OfflineDataManager } from "@/components/cortex/OfflineDataManager"
import { useToast } from "@/components/ui/toast"

interface UserPrefs {
  aiModel: string
  maxTokens: number
  temperature: number
  notifyContracts: boolean
  notifyReports: boolean
  notifyScouting: boolean
  notifyRisk: boolean
  density: string
  language: string
  soundEnabled: boolean
  hapticEnabled: boolean
  soundVolume: number
}

const DEFAULT_PREFS: UserPrefs = {
  aiModel: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  temperature: 0.7,
  notifyContracts: true,
  notifyReports: true,
  notifyScouting: true,
  notifyRisk: true,
  density: "normal",
  language: "pt-BR",
  soundEnabled: false,
  hapticEnabled: true,
  soundVolume: 0.3,
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()

  // Derived state for backward-compat
  const claudeModel = prefs.aiModel
  const maxTokens = prefs.maxTokens
  const temperature = prefs.temperature
  const notifications = {
    contractAlerts: prefs.notifyContracts,
    newReports: prefs.notifyReports,
    scoutingUpdates: prefs.notifyScouting,
    riskAlerts: prefs.notifyRisk,
  }

  // Load preferences on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const json = await res.json()
          if (json.data) {
            setPrefs((prev) => ({ ...prev, ...json.data }))
          }
        }
      } catch {
        // silently fall back to defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updatePref = useCallback(<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  function toggleNotification(key: "contractAlerts" | "newReports" | "scoutingUpdates" | "riskAlerts") {
    const map: Record<string, keyof UserPrefs> = {
      contractAlerts: "notifyContracts",
      newReports: "notifyReports",
      scoutingUpdates: "notifyScouting",
      riskAlerts: "notifyRisk",
    }
    const prefKey = map[key]
    updatePref(prefKey, !prefs[prefKey])
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiModel: prefs.aiModel,
          maxTokens: prefs.maxTokens,
          temperature: prefs.temperature,
          notifyContracts: prefs.notifyContracts,
          notifyReports: prefs.notifyReports,
          notifyScouting: prefs.notifyScouting,
          notifyRisk: prefs.notifyRisk,
          density: prefs.density,
          language: prefs.language,
          soundEnabled: prefs.soundEnabled,
          hapticEnabled: prefs.hapticEnabled,
          soundVolume: prefs.soundVolume,
        }),
      })

      if (res.ok) {
        setSaved(true)
        toast({ type: "success", title: "Preferencias salvas com sucesso" })
        setTimeout(() => setSaved(false), 2000)
      } else {
        const json = await res.json().catch(() => ({}))
        toast({
          type: "error",
          title: "Erro ao salvar",
          description: json.error ?? "Tente novamente",
        })
      }
    } catch {
      toast({ type: "error", title: "Erro de conexao", description: "Verifique sua rede" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-500" />
            Configuracoes
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gerenciamento do sistema CORTEX FC
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`transition-all duration-300 shadow-lg ${
            saved
              ? "bg-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-500/20 scale-105"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 hover:-translate-y-0.5"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4 mr-2 animate-scale-in" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="ml-2 text-sm text-zinc-500">Carregando preferencias...</span>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Idioma / Language */}
        <LanguageSection />

        {/* Densidade da Interface */}
        <DensitySection />

        {/* Efeitos Sonoros */}
        <SoundSection />

        {/* Organizacao */}
        <Card className="glass rounded-xl card-hover animate-slide-up stagger-1 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              Organizacao
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Informacoes do clube vinculado
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Nome do Clube
              </Label>
              <Input
                value="Nottingham Forest"
                readOnly
                className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm cursor-not-allowed opacity-80 rounded-lg focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Liga
              </Label>
              <Input
                value="Premier League"
                readOnly
                className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm cursor-not-allowed opacity-80 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Temporada
              </Label>
              <Input
                value="2025/26"
                readOnly
                className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono cursor-not-allowed opacity-80 rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="glass rounded-xl card-hover animate-slide-up stagger-2 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Key className="w-3.5 h-3.5 text-amber-400" />
              </div>
              API Keys
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Chaves de integracao com servicos externos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                API-Football Key
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="password"
                    value=""
                    placeholder="Insira sua chave API"
                    readOnly
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono pr-10 rounded-lg"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/40 text-xs rounded-lg"
                >
                  Configurar
                </Button>
              </div>
            </div>
            <Separator className="bg-zinc-800/50" />
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Anthropic API Key
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="password"
                    value=""
                    placeholder="Insira sua chave API"
                    readOnly
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono pr-10 rounded-lg"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/40 text-xs rounded-lg"
                >
                  Configurar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modelo IA */}
        <Card className="glass rounded-xl card-hover animate-slide-up stagger-3 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              Modelo IA
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Configuracao do motor neural CORTEX
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Modelo Claude
              </Label>
              <select
                value={claudeModel}
                onChange={(e) => updatePref("aiModel", e.target.value)}
                className="w-full h-9 rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 font-mono transition-all"
              >
                <option value="claude-sonnet-4-20250514">claude-sonnet-4-20250514</option>
                <option value="claude-opus-4-20250514">claude-opus-4-20250514</option>
                <option value="claude-haiku-4-5-20251001">claude-haiku-4-5-20251001</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Max. Tokens
                </Label>
                <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
                  {maxTokens.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={256}
                max={8192}
                step={256}
                value={maxTokens}
                onChange={(e) => updatePref("maxTokens", Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-zinc-700/50 accent-emerald-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400"
              />
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>256</span>
                <span>8,192</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Temperatura
                </Label>
                <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
                  {temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => updatePref("temperature", Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-zinc-700/50 accent-emerald-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400"
              />
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>0.0</span>
                <span>1.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificacoes */}
        <Card className="glass rounded-xl card-hover animate-slide-up stagger-4 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-violet-400" />
              </div>
              Notificacoes
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Controle de alertas e notificacoes do sistema
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            {([
              { key: "contractAlerts" as const, label: "Alertas de contrato", desc: "Vencimentos e renovacoes proximas" },
              { key: "newReports" as const, label: "Novos relatorios", desc: "Relatorios de analise concluidos" },
              { key: "scoutingUpdates" as const, label: "Atualizacoes de scouting", desc: "Novos dados de jogadores monitorados" },
              { key: "riskAlerts" as const, label: "Alertas de risco", desc: "Mudancas nos indices Rx dos jogadores" },
            ]).map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-3.5 border-b border-zinc-800/30 last:border-0 group hover:bg-zinc-800/10 px-2 -mx-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm text-zinc-300">{item.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    notifications[item.key]
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                      : "bg-zinc-700/80"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                      notifications[item.key] ? "translate-x-5 shadow-emerald-500/20" : "translate-x-0"
                    }`}
                  />
                  {notifications[item.key] && (
                    <span className="absolute inset-0 rounded-full animate-pulse-glow" />
                  )}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Plano & Assinatura */}
        <Card className="glass rounded-xl card-hover animate-slide-up stagger-5 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              Plano & Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 animate-pulse-glow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-zinc-100">
                    Club Professional
                  </span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs shadow-sm shadow-emerald-500/10">
                  ATIVO
                </Badge>
              </div>
              <ul className="space-y-2">
                {[
                  "Analises neurais ilimitadas",
                  "Modulo ORACLE completo",
                  "Scouting com ate 500 jogadores",
                  "Exportacao de dados CSV/PDF",
                  "Suporte prioritario",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-xs text-zinc-400"
                  >
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Separator className="bg-zinc-800/30" />
            <div className="rounded-xl border border-zinc-700/40 bg-zinc-800/20 p-4 hover:border-amber-500/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-zinc-300">
                    Holding Multi-Club
                  </span>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                  UPGRADE
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Gerencie multiplos clubes com painel unificado, benchmarking cruzado e analise de sinergia entre elencos.
              </p>
              <Link href="/pricing" className="block w-full">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5 transition-all">
                  Upgrade para Multi-Club
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Dados Offline */}
        <OfflineDataManager />

        {/* Dados & Exportacao */}
        <Card className="glass rounded-xl card-hover animate-slide-up overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-blue-400" />
              </div>
              Dados & Exportacao
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Gerenciamento de dados e backups do sistema
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-zinc-800/30 border-zinc-700/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 hover:border-emerald-500/20 h-12 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm">Exportar Dados (CSV)</p>
                <p className="text-xs text-zinc-500">Jogadores, analises e relatorios</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-zinc-800/30 border-zinc-700/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 hover:border-blue-500/20 h-12 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm">Backup Completo</p>
                <p className="text-xs text-zinc-500">Gerar snapshot completo do sistema</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-zinc-800/30 border-zinc-700/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 hover:border-red-500/20 h-12 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm">Limpar Cache</p>
                <p className="text-xs text-zinc-500">Limpar dados temporarios e cache local</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  )
}
