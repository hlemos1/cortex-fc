import { Skeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function PlayersLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-44 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 max-w-md rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={10} cols={7} />
    </div>
  )
}
