"use client"

import { useState } from "react"
import {
  Activity,
  FileText,
  Search,
  Cpu,
  Download,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type ActivityType = "analysis" | "report" | "scouting" | "agent" | "import" | "settings"

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  userName: string
  entityType?: string
  entityId?: string
  createdAt: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
}

const typeConfig: Record<
  ActivityType,
  { color: string; dotColor: string; icon: React.ElementType }
> = {
  analysis: { color: "text-emerald-400", dotColor: "bg-emerald-500", icon: Activity },
  report: { color: "text-blue-400", dotColor: "bg-blue-500", icon: FileText },
  scouting: { color: "text-violet-400", dotColor: "bg-violet-500", icon: Search },
  agent: { color: "text-cyan-400", dotColor: "bg-cyan-500", icon: Cpu },
  import: { color: "text-amber-400", dotColor: "bg-amber-500", icon: Download },
  settings: { color: "text-zinc-400", dotColor: "bg-zinc-500", icon: Settings },
}

function relativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `${diffMin}min atras`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h atras`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d atras`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}m atras`
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const [visibleCount, setVisibleCount] = useState(maxItems)

  const visibleActivities = activities.slice(0, visibleCount)
  const hasMore = activities.length > visibleCount

  if (activities.length === 0) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-300">Atividade Recente</h3>
        </div>
        <p className="text-sm text-zinc-500 text-center py-8">
          Nenhuma atividade recente
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300">Atividade Recente</h3>
      </div>

      <div className="relative">
        {/* Timeline gradient line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/40 via-zinc-700/40 to-transparent" />

        <div className="space-y-0">
          {visibleActivities.map((activity, index) => {
            const config = typeConfig[activity.type]
            const Icon = config.icon

            return (
              <div
                key={activity.id}
                className="relative flex items-start gap-3 py-3 pl-0 animate-slide-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Dot with icon */}
                <div
                  className={`relative z-10 flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center ring-2 ring-zinc-900 ${config.dotColor}/20`}
                >
                  <Icon className={`w-3 h-3 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-200 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-600 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {activity.userName} &bull; {relativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((prev) => prev + maxItems)}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  )
}
