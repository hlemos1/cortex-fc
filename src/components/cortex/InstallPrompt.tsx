"use client"

import { useState, useEffect } from "react"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { Smartphone, X } from "lucide-react"

const DISMISS_KEY = "cortex-install-dismissed"

export function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(true)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true")
  }, [])

  if (!canInstall || dismissed) return null

  const handleInstall = async () => {
    setInstalling(true)
    await install()
    setInstalling(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true")
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 animate-slide-up rounded-xl border border-zinc-700/50 bg-zinc-900/90 p-4 shadow-2xl backdrop-blur-xl">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        aria-label="Fechar"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
          <Smartphone className="h-4.5 w-4.5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-100">Instalar Cortex FC</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Acesse rapido direto da tela inicial.
          </p>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-2.5 rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {installing ? "Instalando..." : "Instalar"}
          </button>
        </div>
      </div>
    </div>
  )
}
