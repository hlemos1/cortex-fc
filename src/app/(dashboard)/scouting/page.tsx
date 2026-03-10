import { getPlayers, getAnalyses } from "@/db/queries"
import { toScoutingPlayerUI, toAnalysisUI } from "@/lib/db-transforms"
import { ScoutingClient } from "./ScoutingClient"

export default async function ScoutingPage() {
  const [dbPlayers, dbAnalyses] = await Promise.all([
    getPlayers(),
    getAnalyses(),
  ])

  // Transform players for UI — getPlayers() returns latestAnalysis attached
  const allPlayers = dbPlayers.map(toScoutingPlayerUI)

  // Filter to external players (not belonging to the main org club)
  // For now, filter out "Nottingham Forest" as the "home" club
  const externalPlayers = allPlayers.filter((p) => p.club !== "Nottingham Forest")

  // Build a lookup of analyses by player id for the pipeline
  const analysesByPlayer = new Map<string, ReturnType<typeof toAnalysisUI>>()
  for (const a of dbAnalyses) {
    const ui = toAnalysisUI(a)
    if (ui.player?.id && !analysesByPlayer.has(ui.player.id)) {
      analysesByPlayer.set(ui.player.id, ui)
    }
  }

  return (
    <ScoutingClient
      scoutingTargets={externalPlayers}
    />
  )
}
