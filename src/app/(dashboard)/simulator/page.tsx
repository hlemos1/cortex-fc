"use client"

import { useState } from "react"
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  Scale,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Transfer {
  id: string
  playerName: string
  position: string
  direction: "in" | "out"
  fee: number        // millions EUR
  salary: number     // annual, millions EUR
  contractYears: number
  scnPlus?: number
  age?: number
}

interface Scenario {
  id: string
  name: string
  transfers: Transfer[]
}

const POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"]

function createTransfer(direction: "in" | "out"): Transfer {
  return {
    id: crypto.randomUUID(),
    playerName: "",
    position: "CM",
    direction,
    fee: 0,
    salary: 0,
    contractYears: 4,
    scnPlus: undefined,
    age: undefined,
  }
}

function calcScenarioFinancials(transfers: Transfer[]) {
  const incoming = transfers.filter((t) => t.direction === "in")
  const outgoing = transfers.filter((t) => t.direction === "out")

  const totalSpend = incoming.reduce((s, t) => s + t.fee, 0)
  const totalRevenue = outgoing.reduce((s, t) => s + t.fee, 0)
  const netSpend = totalSpend - totalRevenue

  const annualSalaryIncrease = incoming.reduce((s, t) => s + t.salary, 0)
  const annualSalarySavings = outgoing.reduce((s, t) => s + t.salary, 0)
  const netSalaryImpact = annualSalaryIncrease - annualSalarySavings

  const totalAmortization = incoming.reduce(
    (s, t) => s + (t.contractYears > 0 ? t.fee / t.contractYears : 0),
    0
  )

  const totalCostYear1 = totalSpend + annualSalaryIncrease
  const ffpImpact = totalAmortization + annualSalaryIncrease - annualSalarySavings

  return {
    totalSpend,
    totalRevenue,
    netSpend,
    annualSalaryIncrease,
    annualSalarySavings,
    netSalaryImpact,
    totalAmortization,
    totalCostYear1,
    ffpImpact,
    inCount: incoming.length,
    outCount: outgoing.length,
  }
}

function calcTacticalImpact(transfers: Transfer[]) {
  const incoming = transfers.filter((t) => t.direction === "in" && t.scnPlus)
  const outgoing = transfers.filter((t) => t.direction === "out" && t.scnPlus)

  const avgScnIn = incoming.length > 0
    ? incoming.reduce((s, t) => s + (t.scnPlus ?? 0), 0) / incoming.length
    : 0
  const avgScnOut = outgoing.length > 0
    ? outgoing.reduce((s, t) => s + (t.scnPlus ?? 0), 0) / outgoing.length
    : 0

  const positionsIn = [...new Set(incoming.map((t) => t.position))]
  const positionsOut = [...new Set(outgoing.map((t) => t.position))]

  return { avgScnIn, avgScnOut, scnDelta: avgScnIn - avgScnOut, positionsIn, positionsOut }
}

export default function SimulatorPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "a", name: "Cenario A", transfers: [] },
    { id: "b", name: "Cenario B", transfers: [] },
  ])
  const [activeTab, setActiveTab] = useState("a")

  const activeScenario = scenarios.find((s) => s.id === activeTab)!

  function updateScenario(id: string, fn: (s: Scenario) => Scenario) {
    setScenarios((prev) => prev.map((s) => (s.id === id ? fn(s) : s)))
  }

  function addTransfer(direction: "in" | "out") {
    updateScenario(activeTab, (s) => ({
      ...s,
      transfers: [...s.transfers, createTransfer(direction)],
    }))
  }

  function removeTransfer(transferId: string) {
    updateScenario(activeTab, (s) => ({
      ...s,
      transfers: s.transfers.filter((t) => t.id !== transferId),
    }))
  }

  function updateTransfer(transferId: string, data: Partial<Transfer>) {
    updateScenario(activeTab, (s) => ({
      ...s,
      transfers: s.transfers.map((t) =>
        t.id === transferId ? { ...t, ...data } : t
      ),
    }))
  }

  function addScenario() {
    const id = crypto.randomUUID().slice(0, 8)
    const letter = String.fromCharCode(65 + scenarios.length) // C, D, E...
    setScenarios((prev) => [
      ...prev,
      { id, name: `Cenario ${letter}`, transfers: [] },
    ])
    setActiveTab(id)
  }

  const fin = calcScenarioFinancials(activeScenario.transfers)
  const tact = calcTacticalImpact(activeScenario.transfers)

  function fmt(n: number) {
    return `€${Math.abs(n).toFixed(1)}M`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-emerald-500" />
            Simulador de Janela
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            "E se contratarmos X e vendermos Y?" — simule cenarios de transferencia
          </p>
        </div>
        <Button
          onClick={addScenario}
          variant="outline"
          size="sm"
          className="text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Novo Cenario
        </Button>
      </div>

      {/* Scenario tabs */}
      <div className="flex gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === s.id
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-800/30 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Transfer list — 2 cols */}
        <div className="xl:col-span-2 space-y-4">
          {/* Add buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => addTransfer("in")}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Contratacao
            </Button>
            <Button
              onClick={() => addTransfer("out")}
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Venda / Saida
            </Button>
          </div>

          {/* Transfers */}
          {activeScenario.transfers.length === 0 ? (
            <Card className="glass rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ArrowRightLeft className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-600">
                  Adicione contratacoes e vendas para simular
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeScenario.transfers.map((t) => (
                <Card
                  key={t.id}
                  className={cn(
                    "glass rounded-xl overflow-hidden relative",
                    t.direction === "in"
                      ? "border-l-2 border-l-emerald-500/50"
                      : "border-l-2 border-l-red-500/50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Badge
                        className={cn(
                          "text-[10px] mt-1",
                          t.direction === "in"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}
                      >
                        {t.direction === "in" ? "ENTRADA" : "SAIDA"}
                      </Badge>

                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="col-span-2 md:col-span-1">
                          <Label className="text-[10px] text-zinc-600 uppercase">Jogador</Label>
                          <Input
                            value={t.playerName}
                            onChange={(e) => updateTransfer(t.id, { playerName: e.target.value })}
                            placeholder="Nome"
                            className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs h-8 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-zinc-600 uppercase">Posicao</Label>
                          <select
                            value={t.position}
                            onChange={(e) => updateTransfer(t.id, { position: e.target.value })}
                            className="w-full h-8 rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-2 text-xs text-zinc-300"
                          >
                            {POSITIONS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[10px] text-zinc-600 uppercase">
                            {t.direction === "in" ? "Custo (€M)" : "Receita (€M)"}
                          </Label>
                          <Input
                            type="number"
                            value={t.fee || ""}
                            onChange={(e) => updateTransfer(t.id, { fee: Number(e.target.value) })}
                            placeholder="0"
                            className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs h-8 font-mono rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-zinc-600 uppercase">Salario/ano (€M)</Label>
                          <Input
                            type="number"
                            value={t.salary || ""}
                            onChange={(e) => updateTransfer(t.id, { salary: Number(e.target.value) })}
                            placeholder="0"
                            className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs h-8 font-mono rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-zinc-600 uppercase">Contrato (anos)</Label>
                          <Input
                            type="number"
                            value={t.contractYears}
                            onChange={(e) => updateTransfer(t.id, { contractYears: Number(e.target.value) })}
                            className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs h-8 font-mono rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-zinc-600 uppercase">SCN+</Label>
                          <Input
                            type="number"
                            value={t.scnPlus ?? ""}
                            onChange={(e) => updateTransfer(t.id, { scnPlus: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="0-100"
                            className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs h-8 font-mono rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-zinc-600 uppercase">Idade</Label>
                          <Input
                            type="number"
                            value={t.age ?? ""}
                            onChange={(e) => updateTransfer(t.id, { age: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="--"
                            className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs h-8 font-mono rounded-lg"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => removeTransfer(t.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Impact panel — 1 col */}
        <div className="space-y-4">
          {/* Financial impact */}
          <Card className="glass rounded-xl overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Impacto Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-800/30 p-3">
                  <p className="text-[10px] text-zinc-600 uppercase">Gasto Total</p>
                  <p className="text-lg font-bold text-red-400 font-mono">{fmt(fin.totalSpend)}</p>
                  <p className="text-[10px] text-zinc-600">{fin.inCount} contratacoes</p>
                </div>
                <div className="rounded-lg bg-zinc-800/30 p-3">
                  <p className="text-[10px] text-zinc-600 uppercase">Receita Vendas</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono">{fmt(fin.totalRevenue)}</p>
                  <p className="text-[10px] text-zinc-600">{fin.outCount} saidas</p>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Investimento Liquido</span>
                  <span className={cn("font-mono font-bold", fin.netSpend > 0 ? "text-red-400" : "text-emerald-400")}>
                    {fin.netSpend >= 0 ? "-" : "+"}{fmt(fin.netSpend)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Folha Salarial (delta/ano)</span>
                  <span className={cn("font-mono", fin.netSalaryImpact > 0 ? "text-red-400" : "text-emerald-400")}>
                    {fin.netSalaryImpact >= 0 ? "+" : ""}{fmt(fin.netSalaryImpact)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Amortizacao Anual</span>
                  <span className="font-mono text-amber-400">{fmt(fin.totalAmortization)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-zinc-800 pt-2">
                  <span className="text-zinc-400 font-medium">Custo Total Ano 1</span>
                  <span className="font-mono font-bold text-zinc-200">{fmt(fin.totalCostYear1)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Impacto FFP</span>
                  <span className={cn("font-mono font-bold", fin.ffpImpact > 0 ? "text-red-400" : "text-emerald-400")}>
                    {fin.ffpImpact >= 0 ? "+" : ""}{fmt(fin.ffpImpact)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tactical impact */}
          <Card className="glass rounded-xl overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-500" />
                Impacto Tatico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-zinc-800/30 p-3 text-center">
                  <p className="text-[10px] text-zinc-600 uppercase">SCN+ Entradas</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono">
                    {tact.avgScnIn > 0 ? tact.avgScnIn.toFixed(1) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/30 p-3 text-center">
                  <p className="text-[10px] text-zinc-600 uppercase">SCN+ Saidas</p>
                  <p className="text-lg font-bold text-red-400 font-mono">
                    {tact.avgScnOut > 0 ? tact.avgScnOut.toFixed(1) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/30 p-3 text-center">
                  <p className="text-[10px] text-zinc-600 uppercase">Delta SCN+</p>
                  <p className={cn(
                    "text-lg font-bold font-mono",
                    tact.scnDelta > 0 ? "text-emerald-400" : tact.scnDelta < 0 ? "text-red-400" : "text-zinc-500"
                  )}>
                    {tact.scnDelta !== 0 ? (tact.scnDelta > 0 ? "+" : "") + tact.scnDelta.toFixed(1) : "—"}
                  </p>
                </div>
              </div>

              {(tact.positionsIn.length > 0 || tact.positionsOut.length > 0) && (
                <div className="rounded-lg border border-zinc-800 p-3 space-y-2">
                  {tact.positionsIn.length > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-zinc-500">Reforcos em:</span>
                      <div className="flex gap-1">
                        {tact.positionsIn.map((p) => (
                          <Badge key={p} className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {tact.positionsOut.length > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-zinc-500">Saidas em:</span>
                      <div className="flex gap-1">
                        {tact.positionsOut.map((p) => (
                          <Badge key={p} className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compare scenarios */}
          {scenarios.length >= 2 && (
            <Card className="glass rounded-xl overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-500" />
                  Comparacao de Cenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-2 text-zinc-600 font-medium">Metrica</th>
                        {scenarios.map((s) => (
                          <th key={s.id} className="text-right py-2 text-zinc-500 font-medium">
                            {s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Investimento Liq.", key: "netSpend" },
                        { label: "Folha Delta", key: "netSalaryImpact" },
                        { label: "Custo Ano 1", key: "totalCostYear1" },
                        { label: "Impacto FFP", key: "ffpImpact" },
                      ].map((metric) => (
                        <tr key={metric.key} className="border-b border-zinc-800/50">
                          <td className="py-2 text-zinc-400">{metric.label}</td>
                          {scenarios.map((s) => {
                            const f = calcScenarioFinancials(s.transfers)
                            const val = f[metric.key as keyof typeof f] as number
                            return (
                              <td key={s.id} className={cn(
                                "py-2 text-right font-mono",
                                val > 0 ? "text-red-400" : val < 0 ? "text-emerald-400" : "text-zinc-500"
                              )}>
                                {fmt(val)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
