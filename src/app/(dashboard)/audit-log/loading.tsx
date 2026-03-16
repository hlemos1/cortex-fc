import { Skeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function AuditLogLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-52" />
      </div>
      <TableSkeleton rows={12} cols={5} />
    </div>
  )
}
