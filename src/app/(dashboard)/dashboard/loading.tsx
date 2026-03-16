import { Skeleton, StatsSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Stat cards */}
      <StatsSkeleton count={4} />

      {/* Chart */}
      <ChartSkeleton />

      {/* Table */}
      <TableSkeleton rows={5} cols={5} />
    </div>
  )
}
