"use client"

import { useState } from "react"
import { CheckSquare, Square, FileText, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface BatchActionsProps {
  selectedIds: string[]
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBatchGenerate: (template: string) => Promise<void>
}

export function BatchActions({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBatchGenerate,
}: BatchActionsProps) {
  const [generating, setGenerating] = useState(false)
  const t = useTranslations("reports")

  if (selectedIds.length === 0) return null

  const handleGenerate = async (template: string) => {
    setGenerating(true)
    try {
      await onBatchGenerate(template)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
      <button
        onClick={selectedIds.length === totalCount ? onDeselectAll : onSelectAll}
        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
      >
        {selectedIds.length === totalCount ? (
          <CheckSquare className="w-4 h-4" />
        ) : (
          <Square className="w-4 h-4" />
        )}
        {selectedIds.length} {t("selected")}
      </button>

      <div className="h-4 w-px bg-zinc-600" />

      <button
        onClick={() => handleGenerate("player_report")}
        disabled={generating}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
      >
        {generating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <FileText className="w-3 h-3" />
        )}
        {t("batchGeneratePdf")}
      </button>

      <button
        onClick={onDeselectAll}
        className="text-sm text-zinc-500 hover:text-zinc-300 ml-auto"
      >
        {t("clearSelection")}
      </button>
    </div>
  )
}
