"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

interface TabNavProps {
  tabs: Tab[]
  defaultTab?: string
  children: (activeTab: string) => React.ReactNode
  className?: string
}

export function TabNav({ tabs, defaultTab, children, className }: TabNavProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "")
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const updateIndicator = useCallback(() => {
    const el = tabRefs.current.get(activeTab)
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      })
    }
  }, [activeTab])

  useEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-[#09090b]/95 backdrop-blur-xl py-3 -mx-1 px-1">
        <div className="relative overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 relative">
            {/* Sliding indicator */}
            <div
              className="absolute bottom-0 h-0.5 bg-emerald-500 rounded-full transition-all duration-300 ease-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />

            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el)
                }}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border",
                  activeTab === tab.id
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-transparent"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count != null && (
                  <span
                    className={cn(
                      "ml-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-mono px-1.5",
                      activeTab === tab.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div>{children(activeTab)}</div>
    </div>
  )
}
