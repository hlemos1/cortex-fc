"use client"

import { useState } from "react"
import {
  Banknote,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bot,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import type { CfoOutput } from "@/types/cortex"

interface Props {
  playerId: string
  playerName: string
  marketValue: number
  isOpen: boolean
  onClose: () => void
}

export function CfoModal({ playerId, playerName, marketValue, isOpen, onClose }: Props) {
  const [proposedFee, setProposedFee] = useState(marketValue.toString())
  const [proposedSalary, setProposedSalary] = useState("")
  const [contractYears, setContractYears] = useState("4")
  const [sellingClubAsk, setSellingClubAsk] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CfoOutput | null>(null)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/cfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          proposedFee: parseFloat(proposedFee),
          proposedSalary: parseFloat(proposedSalary),
          contractYears: parseInt(contractYears),
          sellingClubAsk: parseFloat(sellingClubAsk),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao executar CFO")
      } else {
        setResult(data.data)
      }
    } catch {
      setError("Erro de conexao")
    }
    setLoading(false)
  }

  const recColor =
    result?.recommendation === "PROCEED"
      ? "text-emerald-400"
      : result?.recommendation === "NEGOTIATE"
        ? "text-amber-400"
        : "text-red-400"

  const RecIcon =
    result?.recommendation === "PROCEED"
      ? CheckCircle
      : result?.recommendation === "WALK_AWAY"
        ? XCircle
        : AlertTriangle

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Banknote className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">CFO Modeler</h2>
              <p className="text-xs text-zinc-500">Simular Contratacao — {playerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!result ? (
            <>
              {/* Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Fee Proposto (M EUR)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={proposedFee}
                    onChange={(e) => setProposedFee(e.target.value)}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-sm"
                    placeholder="15.0"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Pedido do Clube (M EUR)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={sellingClubAsk}
                    onChange={(e) => setSellingClubAsk(e.target.value)}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-sm"
                    placeholder="20.0"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Salario Anual (M EUR)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={proposedSalary}
                    onChange={(e) => setProposedSalary(e.target.value)}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-sm"
                    placeholder="3.0"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Anos de Contrato</label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={contractYears}
                    onChange={(e) => setContractYears(e.target.value)}
                    className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-sm"
                    placeholder="4"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading || !proposedFee || !proposedSalary || !contractYears || !sellingClubAsk}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Modelando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Executar CFO Modeler
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Result */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <RecIcon className={`w-6 h-6 ${recColor}`} />
                  <div>
                    <p className="text-xs text-zinc-500">Recomendacao</p>
                    <p className={`text-lg font-bold font-mono ${recColor}`}>
                      {result.recommendation}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Fair Value</p>
                  <p className="text-lg font-bold font-mono text-cyan-400">
                    &euro;{result.fairValue}M
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-zinc-800/30 border-zinc-700/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-zinc-600 uppercase font-medium">ROI Projetado</p>
                    <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      {result.roiProjection}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-800/30 border-zinc-700/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-zinc-600 uppercase font-medium">Amortizacao/Ano</p>
                    <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                      &euro;{result.amortizationPerYear}M
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-800/30 border-zinc-700/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-zinc-600 uppercase font-medium">Custo Total</p>
                    <p className="text-xl font-bold font-mono text-red-400 mt-1">
                      &euro;{result.totalCostOverContract}M
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-800/30 border-zinc-700/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-zinc-600 uppercase font-medium">Salario/Receita</p>
                    <p className="text-xl font-bold font-mono text-zinc-300 mt-1">
                      {result.salaryAsPercentOfRevenue}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Analise</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{result.reasoning}</p>
              </div>

              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-200"
              >
                Nova Simulacao
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
