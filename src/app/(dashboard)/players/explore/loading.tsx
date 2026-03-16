import { CardSkeleton } from "@/components/ui/skeleton"

export default function ExploreLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-72 bg-zinc-800/60 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
