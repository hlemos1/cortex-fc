import { getAnalyses } from "@/db/queries"
import { toAnalysisUI } from "@/lib/db-transforms"
import { ReportsClient } from "./ReportsClient"

export default async function ReportsPage() {
  const dbAnalyses = await getAnalyses()
  const analyses = dbAnalyses.map(toAnalysisUI)

  return <ReportsClient analyses={analyses} />
}
