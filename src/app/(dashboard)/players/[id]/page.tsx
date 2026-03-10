import Link from "next/link"
import {
  User,
  MapPin,
  Calendar,
  Banknote,
  FileText,
  ArrowLeft,
  Activity,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NeuralRadar } from "@/components/cortex/NeuralRadar"
import { AlgorithmBars } from "@/components/cortex/AlgorithmBars"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { getPlayerById } from "@/db/queries"
import {
  formatPlayerForUI,
  toNeuralLayers,
  toAlgorithmScores,
  toVxComponents,
  toRxComponents,
  formatDate,
} from "@/lib/db-transforms"

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const dbPlayer = await getPlayerById(id)

  if (!dbPlayer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-zinc-500 text-lg">Jogador nao encontrado</p>
          <Link href="/players">
            <Button variant="ghost" className="mt-4 text-emerald-400">
              Voltar para lista
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const player = formatPlayerForUI(dbPlayer)
  const analyses = dbPlayer.analyses.map((a) => ({
    id: a.id,
    date: formatDate(a.createdAt),
    vx: a.vx,
    rx: a.rx,
    vxComponents: toVxComponents(a.vxComponents),
    rxComponents: toRxComponents(a.rxComponents),
    layers: toNeuralLayers(a),
    algorithms: toAlgorithmScores(a),
    decision: a.decision,
    confidence: a.confidence,
    reasoning: a.reasoning,
    createdAt: a.createdAt,
  }))

  const latest = analyses[0] ?? null

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/players">
        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </Link>

      {/* Player Header */}
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
                  <h1 className="text-2xl font-bold text-zinc-100">{player.name}</h1>
                  <p className="text-sm text-zinc-500 mt-1">{player.position}</p>
                </div>
                {latest && (
                  <DecisionBadge decision={latest.decision} size="lg" />
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Nacionalidade</p>
                    <p className="text-zinc-300">{player.nationality}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Idade</p>
                    <p className="text-zinc-300">{player.age ?? "—"} anos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Clube</p>
                    <p className="text-zinc-300">{player.club}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="w-4 h-4 text-zinc-600" />
                  <div>
                    <p className="text-zinc-500 text-xs">Valor de Mercado</p>
                    <p className="text-zinc-300 font-mono">&euro;{player.marketValue}M</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600">
                <span>Salario: &euro;{player.salary}M/ano</span>
                <span>Contrato ate: {player.contractEnd}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {latest ? (
        <>
          {/* VxRx + Decision Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">VxRx Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold font-mono text-emerald-400">
                      {latest.vx.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">Vx (Valor)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold font-mono text-red-400">
                      {latest.rx.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">Rx (Risco)</p>
                  </div>
                </div>
                <Separator className="bg-zinc-800 my-4" />
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-2">Decisao ORACLE</p>
                  <DecisionBadge decision={latest.decision} size="lg" />
                  <p className="text-xs text-zinc-600 mt-2 font-mono">
                    Confianca: {latest.confidence}%
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
                  { label: "T — Tecnico", value: latest.vxComponents.technical },
                  { label: "M — Impacto Mercado", value: latest.vxComponents.marketImpact },
                  { label: "A — Adaptacao Cultural", value: latest.vxComponents.culturalAdaptation },
                  { label: "N — Networking", value: latest.vxComponents.networkingBenefit },
                  { label: "D — Depreciacao Idade", value: latest.vxComponents.ageDepreciation },
                  { label: "L — Passivos", value: latest.vxComponents.liabilities },
                  { label: "R — Risco Regulatorio", value: latest.vxComponents.regulatoryRisk },
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
                    &euro;{latest.vxComponents.totalCost}M
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
                  { label: "Tg — Gap Tatico", value: latest.rxComponents.tacticalGap },
                  { label: "Cx — Fit Contextual", value: latest.rxComponents.contextualFit },
                  { label: "Ep — Experiencia", value: latest.rxComponents.experienceProfile },
                  { label: "Ni — Indice Narrativo", value: latest.rxComponents.narrativeIndex },
                  { label: "Mf — Fortaleza Mental", value: latest.rxComponents.mentalFortitude },
                  { label: "Mi — Risco Lesao", value: latest.rxComponents.injuryMicroRisk },
                  { label: "S — Risco Suspensao", value: latest.rxComponents.suspensionRisk },
                  { label: "Mj — Jitter Mercado", value: latest.rxComponents.marketJitter },
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
                    &euro;{latest.rxComponents.valueAtRisk}M
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
                  layers={latest.layers}
                  playerName={player.name}
                  scnScore={latest.algorithms.SCN_plus}
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
                <AlgorithmBars scores={latest.algorithms} />
              </CardContent>
            </Card>
          </div>

          {/* Reasoning */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Parecer ORACLE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-300 leading-relaxed">{latest.reasoning}</p>
            </CardContent>
          </Card>

          {/* Analysis History */}
          {analyses.length > 1 && (
            <Card className="bg-zinc-900/80 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Historico de Analises</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-2 px-3 text-xs text-zinc-500">Data</th>
                      <th className="text-center py-2 px-3 text-xs text-zinc-500">Vx</th>
                      <th className="text-center py-2 px-3 text-xs text-zinc-500">Rx</th>
                      <th className="text-center py-2 px-3 text-xs text-zinc-500">SCN+</th>
                      <th className="text-center py-2 px-3 text-xs text-zinc-500">Decisao</th>
                      <th className="text-center py-2 px-3 text-xs text-zinc-500">Confianca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((a) => (
                      <tr key={a.id} className="border-b border-zinc-800/50">
                        <td className="py-2 px-3 text-zinc-400 text-xs">{a.date}</td>
                        <td className="py-2 px-3 text-center font-mono text-emerald-400 text-xs">
                          {a.vx.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-red-400 text-xs">
                          {a.rx.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-cyan-400 text-xs">
                          {a.algorithms.SCN_plus}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <DecisionBadge decision={a.decision} size="sm" />
                        </td>
                        <td className="py-2 px-3 text-center text-zinc-500 text-xs font-mono">
                          {a.confidence}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">Nenhuma analise neural disponivel para este jogador.</p>
            <Link href="/analysis/new">
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                Executar ORACLE
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Action button */}
      <div className="flex justify-end">
        <Link href="/analysis/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Activity className="w-4 h-4 mr-2" />
            Nova Analise
          </Button>
        </Link>
      </div>
    </div>
  )
}
