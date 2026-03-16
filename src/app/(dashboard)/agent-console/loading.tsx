import { Skeleton } from "@/components/ui/skeleton"

export default function AgentConsoleLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Quick Actions row */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`qa-${i}`} className="h-9 w-36 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Templates row — 6 card skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`tpl-${i}`} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* Runs table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex gap-2 ml-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`filter-${i}`} className="h-7 w-16 rounded-lg" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/50">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
