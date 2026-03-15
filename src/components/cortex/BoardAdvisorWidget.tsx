"use client"

import { useState } from "react"
import {
  Bot,
  Briefcase,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  DollarSign,
  AlertTriangle,
  ListChecks,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { BoardAdvisorOutput } from "@/types/cortex"

export function BoardAdvisorWidget() {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BoardAdvisorOutput | null>(null)
  const [error, setError] = useState("")

  // Form state
  const [clubName, setClubName] = useState("")
  const [budget, setBudget] = useState("")
  const [salaryCap, setSalaryCap] = useState("")
  const [windowType, setWindowType] = useState<"summer" | "winter">("summer")
  const [leagueContext, setLeagueContext] = useState("")
  const [goals, setGoals] = useState("")
  const [squadAssessment, setSquadAssessment] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName,
          currentBudget: parseFloat(budget),
          salaryCap: parseFloat(salaryCap),
          strategicGoals: goals.split("\n").filter(Boolean),
          currentSquadAssessment: squadAssessment,
          windowType,
          leagueContext,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao executar Board Advisor")
      } else {
        setResult(data.data)
      }
    } catch {
      setError("Erro de conexao")
    }
    setLoading(false)
  }

  const strategyColor = {
    AGGRESSIVE: "text-red-400 bg-red-500/10 border-red-500/20",
    BALANCED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    CONSERVATIVE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    REBUILD: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  }

  const urgencyColor = {
    CRITICAL: "text-red-400",
    HIGH: "text-amber-400",
    MEDIUM: "text-yellow-400",
    LOW: "text-zinc-400",
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800 card-hover">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20">
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-300">
                Briefing Executivo
              </CardTitle>
              <p className="text-xs text-zinc-600">Board Advisor IA</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {!result ? (
            <>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Clube</label>
                    <Input
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder="Nottingham Forest FC"
                      className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Liga</label>
                    <Input
                      value={leagueContext}
                      onChange={(e) => setLeagueContext(e.target.value)}
                      placeholder="Premier League"
                      className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-xs h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Budget (M EUR)</label>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="50"
                      className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Teto Salarial (M)</label>
                    <Input
                      type="number"
                      value={salaryCap}
                      onChange={(e) => setSalaryCap(e.target.value)}
                      placeholder="120"
                      className="bg-zinc-800/40 border-zinc-700/40 text-zinc-200 text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-medium mb-1 block">Janela</label>
                    <select
                      value={windowType}
                      onChange={(e) => setWindowType(e.target.value as "summer" | "winter")}
                      className="w-full h-8 rounded-md bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-xs px-2"
                    >
                      <option value="summer">Verao</option>
                      <option value="winter">Inverno</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1 block">Objetivos Estrategicos (1 por linha)</label>
                  <textarea
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder={"Classificar para Champions League\nRejuvenescer o elenco\nReduzir folha salarial em 10%"}
                    rows={3}
                    className="w-full rounded-md bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-xs p-2 resize-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-1 block">Avaliacao do Elenco</label>
                  <textarea
                    value={squadAssessment}
                    onChange={(e) => setSquadAssessment(e.target.value)}
                    placeholder="Descreva pontos fortes, fracos, profundidade por setor..."
                    rows={3}
                    className="w-full rounded-md bg-zinc-800/40 border border-zinc-700/40 text-zinc-200 text-xs p-2 resize-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
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
                disabled={loading || !clubName || !budget || !salaryCap || !goals || !squadAssessment || !leagueContext}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    Gerar Briefing Executivo
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Strategy Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${strategyColor[result.windowStrategy.priority]}`}>
                  {result.windowStrategy.priority}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Net: &euro;{result.financialOverview.netPosition}M
                </span>
              </div>

              {/* Executive Summary */}
              <p className="text-xs text-zinc-300 leading-relaxed">
                {result.executiveSummary.slice(0, 300)}
                {result.executiveSummary.length > 300 && "..."}
              </p>

              {/* Squad Priorities */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Prioridades</span>
                </div>
                <div className="space-y-1.5">
                  {result.squadPriorities.slice(0, 4).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-zinc-800/30">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${urgencyColor[p.urgency]}`}>{p.position}</span>
                        <span className="text-zinc-500">{p.urgency}</span>
                      </div>
                      <span className="text-zinc-400 font-mono">&euro;{p.budgetAllocation}M</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded bg-zinc-800/30">
                  <DollarSign className="w-3 h-3 text-emerald-500 mx-auto mb-1" />
                  <p className="text-[10px] text-zinc-600">Gastar</p>
                  <p className="text-xs font-mono text-emerald-400">&euro;{result.financialOverview.recommendedSpend}M</p>
                </div>
                <div className="text-center p-2 rounded bg-zinc-800/30">
                  <DollarSign className="w-3 h-3 text-red-500 mx-auto mb-1" />
                  <p className="text-[10px] text-zinc-600">Vender</p>
                  <p className="text-xs font-mono text-red-400">&euro;{result.financialOverview.recommendedSales}M</p>
                </div>
                <div className="text-center p-2 rounded bg-zinc-800/30">
                  <AlertTriangle className="w-3 h-3 text-amber-500 mx-auto mb-1" />
                  <p className="text-[10px] text-zinc-600">FFP</p>
                  <p className="text-xs font-mono text-amber-400">&euro;{result.financialOverview.ffpHeadroom}M</p>
                </div>
              </div>

              {/* Top Actions */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ListChecks className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Acoes Prioritarias</span>
                </div>
                <div className="space-y-1">
                  {result.actionPlan.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs px-2 py-1.5 rounded bg-zinc-800/30">
                      <span className="text-emerald-500 font-mono font-bold mt-0.5">{a.priority}</span>
                      <div>
                        <p className="text-zinc-300">{a.action}</p>
                        <p className="text-[10px] text-zinc-600">{a.timeline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setResult(null)}
                className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Novo Briefing
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
