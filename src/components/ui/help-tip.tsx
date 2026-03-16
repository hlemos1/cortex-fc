"use client"

import { useState } from "react"

interface HelpTipProps {
  content: string
  side?: "top" | "bottom" | "left" | "right"
}

const positionClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
}

export function HelpTip({ content, side = "top" }: HelpTipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-700 text-zinc-400 text-[10px] font-medium cursor-help select-none hover:bg-zinc-600 hover:text-zinc-300 transition-colors">
        ?
      </span>
      {visible && (
        <span
          className={`absolute z-50 ${positionClasses[side]} whitespace-nowrap px-3 py-1.5 rounded-lg text-xs text-zinc-200 bg-zinc-800/95 backdrop-blur-md border border-zinc-700/50 shadow-lg shadow-black/30 animate-fade-in pointer-events-none`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
