import Link from "next/link"
import {
  ArrowLeft,
  Download,
  User,
  MapPin,
  Calendar,
  Banknote,
  Globe,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Brain,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import { AlgorithmBars } from "@/components/cortex/AlgorithmBars"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { getAnalysisById } from "@/db/queries"
import { toAnalysisUI } from "@/lib/db-transforms"
import type { AnalysisUI } from "@/lib/db-transforms"

function generateRisks(analysis: AnalysisUI): string[] {
  const risks: string[] = []
  if (analysis.rxComponents.injuryMicroRisk > 4)
    risks.push("Risco de lesao acima da media — historico de micro-lesoes recorrentes")
  if (analysis.rxComponents.marketJitter > 4)
    risks.push("Alta volatilidade de mercado para este perfil de jogador")
  if (analysis.rxComponents.suspensionRisk > 3)
    risks.push("Historico disciplinar requer atencao — risco de suspensoes")
  if (analysis.player && (analysis.player.age ?? 0) >= 30)
    risks.push("Curva de depreciacao por idade em fase acelerada")
  if (analysis.rxComponents.valueAtRisk > 15)
    risks.push(`Valor em risco estimado de EUR ${analysis.rxComponents.valueAtRisk}M em cenario adverso`)
  if (analysis.vxComponents.liabilities > 4)
    risks.push("Passivos financeiros elevados (salario + custos associados)")
  if (risks.length === 0)
    risks.push("Perfil de risco controlado — sem alertas criticos identificados")
  return risks
}

function generateActions(analysis: AnalysisUI): string[] {
  const actions: string[] = []
  switch (analysis.decision) {
    case "BLINDAR":
      actions.push("Iniciar negociacao de extensao contratual imediatamente")
      actions.push("Incluir clausula de rescisao competitiva (2-3x valor de mercado)")
      actions.push("Avaliar melhoria salarial proporcional ao desempenho")
      break
    case "CONTRATAR":
      actions.push("Abrir canal de negociacao com clube vendedor")
      actions.push("Solicitar relatorio financeiro detalhado ao CFO Modeler")
      actions.push("Agendar avaliacao medica e comportamental presencial")
      break
    case "MONITORAR":
      actions.push("Manter relatorios de scouting atualizados a cada 30 dias")
      actions.push("Acompanhar metricas de performance nas proximas 5 partidas")
      actions.push("Reavaliar na proxima janela de transferencias")
      break
    case "RECUSAR":
      actions.push("Arquivar dossie com justificativa documentada")
      actions.push("Redirecionar recursos de scouting para alvos alternativos")
      actions.push("Reavaliar apenas em caso de mudanca significativa de contexto")
      break
    case "ALERTA_CINZA":
      actions.push("Solicitar investigacao aprofundada do agente ANALISTA")
      actions.push("Coletar dados adicionais de fontes terciarias")
      actions.push("Agendar reuniao de comite para revisao do caso")
      break
    default:
      actions.push("Avaliar proximos passos com comite tecnico")
  }
  // Also include DB-stored recommended actions if available
  if (analysis.recommendedActions.length > 0) {
    actions.push(...analysis.recommendedActions)
  }
  return actions
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const dbAnalysis = await getAnalysisById(id)

  if (!dbAnalysis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-zinc-500 text-lg">Relatorio nao encontrado</p>
          <Link href="/reports">
            <Button variant="ghost" className="mt-4 text-emerald-400">
              Voltar para relatorios
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const analysis = toAnalysisUI(dbAnalysis)
  const risks = analysis.risks.length > 0 ? analysis.risks : generateRisks(analysis)
  const actions = generateActions(analysis)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/reports">
        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </Link>

      {/* Report Header */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo placeholder */}
            <div className="w-28 h-28 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
              <User className="w-14 h-14 text-zinc-600" />
            </div>

            {/* Player info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-zinc-100">
                      {analysis.player?.name ?? "—"}
                    </h1>
                    <DecisionBadge decision={analysis.decision} size="lg" />
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    Parecer ORACLE — Relatorio #{analysis.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Nacionalidade</p>
                    <p className="text-zinc-300">{analysis.player?.nationality ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Idade</p>
                    <p className="text-zinc-300">{analysis.player?.age ?? "—"} anos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Clube</p>
                    <p className="text-zinc-300">{analysis.player?.club ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Valor de Mercado</p>
                    <p className="text-zinc-300 font-mono">&euro;{analysis.player?.marketValue ?? 0}M</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600">
                <span>Posicao: {analysis.player?.position ?? "—"}</span>
                <span>Contrato ate: {analysis.player?.contractEnd ?? "—"}</span>
                <span>Data do relatorio: {analysis.date}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reasoning / Full Parecer */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Parecer ORACLE — Analise Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-300 leading-relaxed">{analysis.reasoning}</p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-600 uppercase">Confianca</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {analysis.confidence}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-600 uppercase">SCN+</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {analysis.algorithms.SCN_plus}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VxRx Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* VxRx Score Card */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">VxRx Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold font-mono text-emerald-400">
                  {analysis.vx.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-600 mt-1">Vx (Valor)</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold font-mono text-red-400">
                  {analysis.rx.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-600 mt-1">Rx (Risco)</p>
              </div>
            </div>
            <Separator className="bg-zinc-800 my-4" />
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-2">Decisao ORACLE</p>
              <DecisionBadge decision={analysis.decision} size="lg" />
              <p className="text-xs text-zinc-600 mt-2 font-mono">
                Confianca: {analysis.confidence}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vx Components */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Componentes Vx</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "T — Tecnico", value: analysis.vxComponents.technical },
              { label: "M — Impacto Mercado", value: analysis.vxComponents.marketImpact },
              { label: "A — Adaptacao Cultural", value: analysis.vxComponents.culturalAdaptation },
              { label: "N — Networking", value: analysis.vxComponents.networkingBenefit },
              { label: "D — Depreciacao Idade", value: analysis.vxComponents.ageDepreciation },
              { label: "L — Passivos", value: analysis.vxComponents.liabilities },
              { label: "R — Risco Regulatorio", value: analysis.vxComponents.regulatoryRisk },
            ].map((comp) => (
              <div key={comp.label} className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{comp.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${comp.value * 10}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 w-6 text-right">
                    {comp.value}
                  </span>
                </div>
              </div>
            ))}
            <Separator className="bg-zinc-800 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">C — Custo Total</span>
              <span className="text-xs font-mono text-emerald-400">
                &euro;{analysis.vxComponents.totalCost}M
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rx Components */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Componentes Rx</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Tg — Gap Tatico", value: analysis.rxComponents.tacticalGap },
              { label: "Cx — Fit Contextual", value: analysis.rxComponents.contextualFit },
              { label: "Ep — Experiencia", value: analysis.rxComponents.experienceProfile },
              { label: "Ni — Indice Narrativo", value: analysis.rxComponents.narrativeIndex },
              { label: "Mf — Fortaleza Mental", value: analysis.rxComponents.mentalFortitude },
              { label: "Mi — Risco Lesao", value: analysis.rxComponents.injuryMicroRisk },
              { label: "S — Risco Suspensao", value: analysis.rxComponents.suspensionRisk },
              { label: "Mj — Jitter Mercado", value: analysis.rxComponents.marketJitter },
            ].map((comp) => (
              <div key={comp.label} className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{comp.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${comp.value * 10}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 w-6 text-right">
                    {comp.value}
                  </span>
                </div>
              </div>
            ))}
            <Separator className="bg-zinc-800 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">Va — Valor em Risco</span>
              <span className="text-xs font-mono text-red-400">
                &euro;{analysis.rxComponents.valueAtRisk}M
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Neural Radar + Algorithm Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Radar Neural — 7 Camadas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <NeuralRadar
              layers={analysis.layers}
              playerName={analysis.player?.name}
              scnScore={analysis.algorithms.SCN_plus}
              size={340}
            />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Algoritmos Proprietarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlgorithmBars scores={analysis.algorithms} />
          </CardContent>
        </Card>
      </div>

      {/* Risks + Recommended Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risks */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Riscos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks.map((risk, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-red-500/10 bg-red-500/5 p-3"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400 leading-relaxed">{risk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Acoes Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-400 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 text-xs">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar aos relatorios
          </Button>
        </Link>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Download className="w-4 h-4" />
          Gerar PDF
        </Button>
      </div>
    </div>
  )
}
