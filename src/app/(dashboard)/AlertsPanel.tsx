import { AlertTriangle, Clock, Shield, Bell } from "lucide-react"
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
    case "high": return "text-red-400 bg-red-500/5 border-red-500/20"
    case "medium": return "text-amber-400 bg-amber-500/5 border-amber-500/20"
    case "low": return "text-blue-400 bg-blue-500/5 border-blue-500/20"
    default: return "text-zinc-400 bg-zinc-500/5 border-zinc-500/20"
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "high": return <AlertTriangle className="w-4 h-4 text-red-400 animate-float" />
    case "medium": return <Clock className="w-4 h-4 text-amber-400" />
    case "low": return <Shield className="w-4 h-4 text-blue-400" />
    default: return null
  }
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800 glass">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
          </div>
          Alertas
          <span className="ml-auto text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
          {alerts.map((alert, index) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-lg animate-slide-up ${getSeverityColor(alert.severity)}`}
              style={{ animationDelay: `${(index + 1) * 80}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex-shrink-0">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold truncate">{alert.title}</p>
                    {alert.severity === "high" && (
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-70 mt-0.5 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>
                  <p className="text-[10px] opacity-50 mt-1.5 font-mono">{alert.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
