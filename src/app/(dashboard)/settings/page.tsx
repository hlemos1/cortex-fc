"use client"

import { useState } from "react"
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

  const [notifications, setNotifications] = useState({
    contractAlerts: true,
    newReports: true,
    scoutingUpdates: false,
    riskAlerts: true,
  })

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-500" />
          Configurações
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gerenciamento do sistema CORTEX FC
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organização */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              Organização
            </CardTitle>
            <p className="text-xs text-zinc-600">
              Informações do clube vinculado
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                Nome do Clube
              </Label>
              <Input
                value="Nottingham Forest"
                readOnly
                className="bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm cursor-not-allowed opacity-80"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                Liga
              </Label>
              <Input
                value="Premier League"
                readOnly
                className="bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm cursor-not-allowed opacity-80"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                Temporada
              </Label>
              <Input
                value="2025/26"
                readOnly
                className="bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm font-mono cursor-not-allowed opacity-80"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              API Keys
            </CardTitle>
            <p className="text-xs text-zinc-600">
              Chaves de integração com serviços externos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                API-Football Key
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiFootball ? "text" : "password"}
                    value="sk-football-a1b2c3d4e5f6g7h8i9j0"
                    readOnly
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm font-mono pr-10"
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
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs"
                >
                  Atualizar
                </Button>
              </div>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                Anthropic API Key
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showAnthropic ? "text" : "password"}
                    value="sk-ant-api03-xxxxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm font-mono pr-10"
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
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs"
                >
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modelo IA */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              Modelo IA
            </CardTitle>
            <p className="text-xs text-zinc-600">
              Configuração do motor neural CORTEX
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                Modelo Claude
              </Label>
              <select
                value={claudeModel}
                onChange={(e) => setClaudeModel(e.target.value)}
                className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300 outline-none focus:border-emerald-500 font-mono"
              >
                <option value="claude-sonnet-4-20250514">claude-sonnet-4-20250514</option>
                <option value="claude-opus-4-20250514">claude-opus-4-20250514</option>
                <option value="claude-haiku-4-5-20251001">claude-haiku-4-5-20251001</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Max Tokens
                </Label>
                <span className="text-xs font-mono text-emerald-400">
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
                className="w-full h-1.5 rounded-full appearance-none bg-zinc-700 accent-emerald-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>256</span>
                <span>8,192</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Temperature
                </Label>
                <span className="text-xs font-mono text-emerald-400">
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
                className="w-full h-1.5 rounded-full appearance-none bg-zinc-700 accent-emerald-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-md"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>0.0</span>
                <span>1.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />
              Notificações
            </CardTitle>
            <p className="text-xs text-zinc-600">
              Controle de alertas e notificações do sistema
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            {([
              { key: "contractAlerts" as const, label: "Alertas de contrato", desc: "Vencimentos e renovações próximas" },
              { key: "newReports" as const, label: "Novos relatórios", desc: "Relatórios de análise concluídos" },
              { key: "scoutingUpdates" as const, label: "Atualizações de scouting", desc: "Novos dados de jogadores monitorados" },
              { key: "riskAlerts" as const, label: "Alertas de risco", desc: "Mudanças nos índices Rx dos jogadores" },
            ]).map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0"
              >
                <div>
                  <p className="text-sm text-zinc-300">{item.label}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    notifications[item.key]
                      ? "bg-emerald-500"
                      : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      notifications[item.key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Plano & Assinatura */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Plano & Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-zinc-100">
                    Club Professional
                  </span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  ATIVO
                </Badge>
              </div>
              <ul className="space-y-2">
                {[
                  "Análises neurais ilimitadas",
                  "Módulo ORACLE completo",
                  "Scouting com até 500 jogadores",
                  "Exportação de dados CSV/PDF",
                  "Suporte prioritário",
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
            <Separator className="bg-zinc-800" />
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-300">
                  Holding Multi-Club
                </span>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                  UPGRADE
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-600 mb-3">
                Gerencie múltiplos clubes com painel unificado, benchmarking cruzado e análise de sinergia entre elencos.
              </p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Upgrade para Multi-Club
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dados & Exportação */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Dados & Exportação
            </CardTitle>
            <p className="text-xs text-zinc-600">
              Gerenciamento de dados e backups do sistema
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-11"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm">Exportar Dados (CSV)</p>
                <p className="text-[10px] text-zinc-600">Jogadores, análises e relatórios</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-11"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm">Backup Completo</p>
                <p className="text-[10px] text-zinc-600">Gerar snapshot completo do sistema</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-11"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm">Limpar Cache</p>
                <p className="text-[10px] text-zinc-600">Limpar dados temporários e cache local</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
