"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { friendlyError } from "@/lib/error-messages"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  const msg = friendlyError(error.message)
  const isNetworkError = error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network")

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
          {isNetworkError ? (
            <WifiOff className="h-8 w-8 text-amber-400" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          )}
        </div>
        <h2 className="text-lg font-bold text-zinc-200 mb-2">
          Algo deu errado
        </h2>
        <p className="text-zinc-500 text-sm mb-6">{msg}</p>
        <Button
          onClick={reset}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
        {error.digest && (
          <p className="text-zinc-700 text-[10px] font-mono mt-4">
            Codigo: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
