"use client"

import { useState, useEffect } from "react"
import { Database } from "lucide-react"
import { getCacheSize } from "@/lib/offline-cache"

export function CacheIndicator() {
  const [size, setSize] = useState(0)

  useEffect(() => {
    getCacheSize().then(setSize)
  }, [])

  if (size === 0) return null

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-[10px] text-zinc-500">
      <Database className="w-3 h-3" />
      <span>{size} itens em cache</span>
    </div>
  )
}
