"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    const handler = () => setUpdateAvailable(true)

    navigator.serviceWorker?.addEventListener("controllerchange", handler)

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", handler)
    }
  }, [])

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-zinc-900/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
      <RefreshCw className="h-4 w-4 text-amber-400" />
      <span className="text-xs font-medium text-zinc-300">Nova versao disponivel</span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-500"
      >
        Atualizar
      </button>
    </div>
  )
}
