"use client"

import { BarChart3 } from "lucide-react"
import { EmptyStateCTA } from "@/components/cortex/EmptyStateCTA"

interface AnalyticsEmptyProps {
  hasData: boolean
  children: React.ReactNode
}

export function AnalyticsEmpty({ hasData, children }: AnalyticsEmptyProps) {
  if (!hasData) {
    return (
      <div className="p-6">
        <EmptyStateCTA
          icon={<BarChart3 />}
          title="Sem dados de analytics"
          description="Execute sua primeira analise para gerar insights"
          primaryAction={{
            label: "Nova Analise",
            href: "/analysis/new",
          }}
        />
      </div>
    )
  }

  return <>{children}</>
}
