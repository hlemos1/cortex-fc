import { Skeleton } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Current plan card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 min-h-[400px] space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24" />
            <div className="space-y-2 pt-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-full rounded-md mt-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
