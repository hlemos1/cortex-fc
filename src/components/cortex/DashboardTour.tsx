"use client"

import { useState, useCallback } from "react"
import { GuidedTour, TourRestartButton } from "@/components/ui/guided-tour"
import type { TourStep } from "@/components/ui/guided-tour"

const TOUR_ID = "dashboard-intro"

const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='stats-cards']",
    title: "Seus KPIs",
    description: "Acompanhe metricas chave: jogadores, analises, alvos de scouting e score medio.",
    position: "bottom",
  },
  {
    target: "[data-tour='vxrx-scatter']",
    title: "Mapa Valor vs Risco",
    description: "Visualize todos os jogadores analisados no espaco decisorio. Verde = contratar, vermelho = recusar.",
    position: "top",
  },
  {
    target: "[data-tour='alerts-panel']",
    title: "Alertas Inteligentes",
    description: "Contratos expirando, oportunidades de mercado e decisoes pendentes aparecem aqui.",
    position: "left",
  },
  {
    target: "[data-tour='new-analysis']",
    title: "Nova Analise",
    description: "Clique aqui para executar o motor ORACLE em qualquer jogador. A IA analisa 7 dimensoes.",
    position: "bottom",
  },
  {
    target: "[data-tour='sidebar-nav']",
    title: "Navegacao",
    description: "Acesse jogadores, scouting, relatorios e configuracoes pela barra lateral. Use Cmd+K para busca rapida.",
    position: "right",
  },
]

export function DashboardTour() {
  const [key, setKey] = useState(0)

  const handleRestart = useCallback(() => {
    setKey((k) => k + 1)
  }, [])

  return (
    <>
      <GuidedTour
        key={key}
        steps={DASHBOARD_TOUR_STEPS}
        tourId={TOUR_ID}
      />
      <TourRestartButton tourId={TOUR_ID} onRestart={handleRestart} />
    </>
  )
}
