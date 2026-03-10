"use client"

import { Download } from "lucide-react"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-900/40 no-print"
    >
      <Download className="w-4 h-4" />
      Gerar PDF
    </button>
  )
}
