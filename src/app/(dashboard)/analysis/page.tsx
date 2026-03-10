import { getAnalyses } from "@/db/queries"
import { toAnalysisUI } from "@/lib/db-transforms"
import { AnalysisClient } from "./AnalysisClient"

export default async function AnalysisPage() {
  const dbAnalyses = await getAnalyses()
  const analyses = dbAnalyses.map(toAnalysisUI)

  return <AnalysisClient analyses={analyses} />
}
