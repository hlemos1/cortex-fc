"use client"

import { useState } from "react"
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
  Eye,
  EyeOff,
  Save,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [showApiFootball, setShowApiFootball] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [claudeModel, setClaudeModel] = useState("claude-sonnet-4-20250514")
  const [maxTokens, setMaxTokens] = useState(4096)
  const [temperature, setTemperature] = useState(0.7)
  const [saved, setSaved] = useState(false)

  const [notifications, setNotifications] = useState({
    contractAlerts: true,
    newReports: true,
    scoutingUpdates: false,
    riskAlerts: true,
  })

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
          className={`transition-all duration-300 shadow-lg ${
            saved
              ? "bg-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-500/20 scale-105"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 hover:-translate-y-0.5"
          }`}
        >
          {saved ? (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <p className="text-xs text-zinc-600">
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
            <p className="text-xs text-zinc-600">
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
                    type={showApiFootball ? "text" : "password"}
                    value="sk-football-a1b2c3d4e5f6g7h8i9j0"
                    readOnly
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono pr-10 rounded-lg"
                  />
                  <button
                    onClick={() => setShowApiFootball(!showApiFootball)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showApiFootball ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  size="sm"
                  className="bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/40 text-xs rounded-lg"
                >
                  Atualizar
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
                    type={showAnthropic ? "text" : "password"}
                    value="sk-ant-api03-xxxxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-sm font-mono pr-10 rounded-lg"
                  />
                  <button
                    onClick={() => setShowAnthropic(!showAnthropic)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showAnthropic ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  size="sm"
                  className="bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/40 text-xs rounded-lg"
                >
                  Atualizar
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
            <p className="text-xs text-zinc-600">
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
                onChange={(e) => setClaudeModel(e.target.value)}
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
                  Max Tokens
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
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-zinc-700/50 accent-emerald-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>256</span>
                <span>8,192</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Temperature
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
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-zinc-700/50 accent-emerald-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
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
            <p className="text-xs text-zinc-600">
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
                  <p className="text-[11px] text-zinc-600 mt-0.5">{item.desc}</p>
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
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] shadow-sm shadow-emerald-500/10">
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
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                  UPGRADE
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-600 mb-3">
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
            <p className="text-xs text-zinc-600">
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
                <p className="text-[10px] text-zinc-600">Jogadores, analises e relatorios</p>
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
                <p className="text-[10px] text-zinc-600">Gerar snapshot completo do sistema</p>
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
                <p className="text-[10px] text-zinc-600">Limpar dados temporarios e cache local</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
