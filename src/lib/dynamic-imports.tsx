import dynamic from "next/dynamic"

// Heavy chart components — only load when needed
export const LazyNeuralRadar = dynamic(
  () => import("@/components/cortex/NeuralRadar").then((mod) => ({ default: mod.NeuralRadar })),
  {
    ssr: false,
    loading: () => null,
  }
)

export const LazyVxRxScatter = dynamic(
  () => import("@/components/cortex/VxRxScatter").then((mod) => ({ default: mod.VxRxScatter })),
  {
    ssr: false,
    loading: () => null,
  }
)

// External player search — only needed when user clicks search
export const LazyExternalPlayerSearch = dynamic(
  () => import("@/components/players/ExternalPlayerSearch").then((mod) => ({ default: mod.ExternalPlayerSearch })),
  {
    ssr: false,
    loading: () => null,
  }
)

// Agent launch modal — only when user triggers agent
export const LazyAgentLaunchModal = dynamic(
  () => import("@/components/cortex/AgentLaunchModal").then((mod) => ({ default: mod.AgentLaunchModal })),
  {
    ssr: false,
  }
)

// Sprint 8 chart components — Recharts heavy, lazy load
export const LazyAnalysesPerDayChart = dynamic(
  () => import("@/components/cortex/AnalysesPerDayChart").then((mod) => ({ default: mod.AnalysesPerDayChart })),
  {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-zinc-800/50 rounded-xl animate-pulse" />,
  }
)

export const LazyAgentCostChart = dynamic(
  () => import("@/components/cortex/AgentCostChart").then((mod) => ({ default: mod.AgentCostChart })),
  {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-zinc-800/50 rounded-xl animate-pulse" />,
  }
)

export const LazyScnTrendChart = dynamic(
  () => import("@/components/cortex/ScnTrendChart").then((mod) => ({ default: mod.ScnTrendChart })),
  {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-zinc-800/50 rounded-xl animate-pulse" />,
  }
)
