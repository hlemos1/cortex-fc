"use client"

import { useState } from "react"
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { AnalysisUI } from "@/lib/db-transforms"
import { downloadCSV, downloadJSON, downloadXLSX } from "@/lib/export"

interface ExportMenuProps {
  analyses: AnalysisUI[]
  selectedIds?: string[]
}

export function ExportMenu({ analyses, selectedIds }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations("reports")

  const data = selectedIds?.length
    ? analyses.filter((a) => selectedIds.includes(a.id))
    : analyses

  const count = data.length

  const handleExport = (format: "csv" | "json" | "xlsx") => {
    const timestamp = new Date().toISOString().slice(0, 10)
    switch (format) {
      case "csv":
        downloadCSV(data, `cortex-analises-${timestamp}.csv`)
        break
      case "json":
        downloadJSON(data, `cortex-analises-${timestamp}.json`)
        break
      case "xlsx":
        downloadXLSX(data, `cortex-analises-${timestamp}.xml`)
        break
    }
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
      >
        <Download className="w-4 h-4" />
        {t("export")} ({count})
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl overflow-hidden">
            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="font-medium">CSV</div>
                <div className="text-xs text-zinc-500">
                  {t("exportCsvDesc")}
                </div>
              </div>
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <div className="font-medium">Excel</div>
                <div className="text-xs text-zinc-500">
                  {t("exportXlsxDesc")}
                </div>
              </div>
            </button>
            <button
              onClick={() => handleExport("json")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <FileJson className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="font-medium">JSON</div>
                <div className="text-xs text-zinc-500">
                  {t("exportJsonDesc")}
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
