import { Skeleton, StatsSkeleton, ChartSkeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPI stat cards — 5 rectangles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>

      {/* Risk alerts row */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3.5 flex items-center gap-3"
            >
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-zinc-900/60 border border-zinc-800/60 border-l-4 border-l-zinc-700 rounded-xl p-4 flex items-start gap-3"
          >
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table skeleton */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1 max-w-[120px]" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/30"
          >
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-3 flex-1 max-w-[100px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
