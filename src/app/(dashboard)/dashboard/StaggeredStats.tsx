"use client"

import { StaggerList, StaggerItem } from "@/components/ui/motion"
import { StatCard } from "@/components/cortex/StatCard"

interface StatData {
  title: string
  value: number
  iconName: "users" | "activity" | "search" | "trending"
  change: string
  color: string
  bgColor: string
  borderColor: string
}

export function StaggeredStats({ stats }: { stats: StatData[] }) {
  return (
    <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StaggerItem key={stat.title}>
          <StatCard
            title={stat.title}
            value={stat.value}
            iconName={stat.iconName}
            change={stat.change}
            color={stat.color}
            bgColor={stat.bgColor}
            borderColor={stat.borderColor}
          />
        </StaggerItem>
      ))}
    </StaggerList>
  )
}
