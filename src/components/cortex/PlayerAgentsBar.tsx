"use client"

import { useState } from "react"
import { Banknote, GraduationCap, Download, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CfoModal } from "./CfoModal"
import type { PlayerCluster } from "@/types/cortex"

interface Props {
  playerId: string
  playerName: string
  position: PlayerCluster
  age: number
  currentClub: string
  marketValue: number
  analysisId?: string
}

export function PlayerAgentsBar({
  playerId,
  playerName,
  marketValue,
  analysisId,
}: Props) {
  const [cfoOpen, setCfoOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    if (!analysisId) return
    setDownloading(true)
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "player_report", analysisId }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `parecer-${playerName.replace(/\s+/g, "-").toLowerCase()}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
    setDownloading(false)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 animate-fade-in">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCfoOpen(true)}
          className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 gap-1.5 text-xs"
        >
          <Banknote className="w-3.5 h-3.5" />
          Simular Contratacao
        </Button>

        {analysisId && (
          <Button
            variant="outline"
            size="sm"
            disabled={downloading}
            onClick={handleDownloadPdf}
            className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? "Gerando..." : "PDF Parecer"}
          </Button>
        )}
      </div>

      <CfoModal
        playerId={playerId}
        playerName={playerName}
        marketValue={marketValue}
        isOpen={cfoOpen}
        onClose={() => setCfoOpen(false)}
      />
    </>
  )
}
