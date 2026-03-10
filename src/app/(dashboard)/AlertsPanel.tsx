import { AlertTriangle, Clock, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Alert {
  id: string
  title: string
  description: string
  severity: "high" | "medium" | "low"
  date: string
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "high": return "text-red-400 bg-red-500/10 border-red-500/20"
    case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20"
    case "low": return "text-blue-400 bg-blue-500/10 border-blue-500/20"
    default: return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "high": return <AlertTriangle className="w-4 h-4 text-red-400" />
    case "medium": return <Clock className="w-4 h-4 text-amber-400" />
    case "low": return <Shield className="w-4 h-4 text-blue-400" />
    default: return null
  }
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Alertas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start gap-2">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{alert.title}</p>
                  <p className="text-[11px] opacity-70 mt-0.5 line-clamp-2">
                    {alert.description}
                  </p>
                  <p className="text-[10px] opacity-50 mt-1">{alert.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
