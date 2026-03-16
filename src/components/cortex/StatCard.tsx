"use client"

import { Users, Activity, Search, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"

const ICONS = {
  users: Users,
  activity: Activity,
  search: Search,
  trending: TrendingUp,
} as const

type IconName = keyof typeof ICONS

interface StatCardProps {
  title: string
  value: number
  iconName: IconName
  change: string
  color: string
  bgColor: string
  borderColor: string
  delay?: number
}

export function StatCard({
  title,
  value,
  iconName,
  change,
  color,
  bgColor,
  borderColor,
  delay = 0,
}: StatCardProps) {
  const Icon = ICONS[iconName]

  return (
    <Card
      className={`bg-zinc-900/80 border-zinc-800 border-l-[3px] ${borderColor} card-hover animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-zinc-100 mt-1 font-mono tracking-tight">
              <AnimatedNumber value={value} />
            </p>
            <p className="text-[11px] text-zinc-600 mt-1">{change}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center ring-1 ring-white/5`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
