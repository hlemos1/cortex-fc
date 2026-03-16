import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
