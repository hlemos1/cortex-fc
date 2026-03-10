import { getPlayers } from "@/db/queries"
import { formatPlayerForUI, toAlgorithmScores } from "@/lib/db-transforms"
import { PlayersClient } from "./PlayersClient"
import type { CortexDecision } from "@/types/cortex"

export default async function PlayersPage() {
  const dbPlayers = await getPlayers()

  const players = dbPlayers.map((player) => {
    const base = formatPlayerForUI(player)
    const latest = player.latestAnalysis
    return {
      ...base,
      scn: latest ? (toAlgorithmScores(latest).SCN_plus) : undefined,
      decision: latest ? (latest.decision as CortexDecision) : undefined,
      vx: latest?.vx,
      rx: latest?.rx,
    }
  })

  return <PlayersClient players={players} />
}
