"use client"

import { memo, useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface ActivityEntry {
  id: string
  action: string
  userName: string | null
  userEmail?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

interface ActivityTimelineProps {
  entityType: string
  entityId: string
  className?: string
}

export const ActivityTimeline = memo(function ActivityTimeline({ entityType, entityId, className }: ActivityTimelineProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations("activity")

  useEffect(() => {
    fetch(`/api/activity?entityType=${entityType}&entityId=${entityId}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [entityType, entityId])

  if (loading) return <div className="animate-pulse h-20 bg-zinc-800/50 rounded-lg" />
  if (entries.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-zinc-400">{t("timeline")}</h3>
      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-zinc-800" />
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex gap-3 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 z-10">
              <User className="h-3 w-3 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-300">
                <span className="font-medium">{entry.userName || "Sistema"}</span>
                {" "}
                <span className="text-zinc-500">{formatAction(entry.action, t)}</span>
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {new Date(entry.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

function formatAction(
  action: string,
  t: (key: string) => string
): string {
  const map: Record<string, string> = {
    "analysis.created": t("createdAnalysis"),
    "analysis.deleted": t("deletedAnalysis"),
    "scouting.created": t("addedToScouting"),
    "scouting.status_changed": t("movedPipeline"),
    "report.generated": t("generatedReport"),
    "player.imported": t("importedPlayer"),
    "comment.created": t("commented"),
    "agent.executed": t("executedAgent"),
  }
  return map[action] || action
}
