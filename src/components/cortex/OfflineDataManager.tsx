"use client"

import { useState, useEffect, useCallback } from "react"
import { HardDrive, Trash2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCacheSize, clearCache } from "@/lib/offline-cache"

export function OfflineDataManager() {
  const [cacheCount, setCacheCount] = useState(0)
  const [offlineEnabled, setOfflineEnabled] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const refreshCacheInfo = useCallback(async () => {
    const size = await getCacheSize()
    setCacheCount(size)
  }, [])

  useEffect(() => {
    refreshCacheInfo()
    // Read preference from localStorage
    try {
      const stored = localStorage.getItem("cortex-fc-offline-enabled")
      if (stored !== null) setOfflineEnabled(stored === "true")
      const syncTime = localStorage.getItem("cortex-fc-last-sync")
      if (syncTime) setLastSync(syncTime)
    } catch {
      // localStorage not available
    }
  }, [refreshCacheInfo])

  function toggleOffline() {
    const next = !offlineEnabled
    setOfflineEnabled(next)
    try {
      localStorage.setItem("cortex-fc-offline-enabled", String(next))
    } catch {
      // Silently fail
    }
  }

  async function handleClear() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    await clearCache()
    setCacheCount(0)
    setConfirming(false)
    try {
      localStorage.removeItem("cortex-fc-last-sync")
      setLastSync(null)
    } catch {
      // Silently fail
    }
  }

  return (
    <Card className="glass rounded-xl card-hover animate-slide-up overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <HardDrive className="w-3.5 h-3.5 text-orange-400" />
          </div>
          Dados Offline
        </CardTitle>
        <p className="text-xs text-zinc-600">
          Cache local para acesso sem conexao
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache info */}
        <div className="rounded-xl border border-zinc-700/40 bg-zinc-800/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Items em cache
            </span>
            <span className="text-sm font-mono text-orange-400">
              {cacheCount}
            </span>
          </div>
          {lastSync && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Ultimo sync
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {lastSync}
              </span>
            </div>
          )}
        </div>

        {/* Toggle offline saving */}
        <div className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-zinc-800/10 transition-colors">
          <div>
            <p className="text-sm text-zinc-300">Salvar dados para uso offline</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Armazena respostas da API localmente
            </p>
          </div>
          <button
            onClick={toggleOffline}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
              offlineEnabled
                ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                : "bg-zinc-700/80"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                offlineEnabled ? "translate-x-5 shadow-emerald-500/20" : "translate-x-0"
              }`}
            />
            {offlineEnabled && (
              <span className="absolute inset-0 rounded-full animate-pulse-glow" />
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCacheInfo}
            className="flex-1 bg-zinc-800/30 border-zinc-700/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 text-xs rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            onBlur={() => setConfirming(false)}
            className={`flex-1 text-xs rounded-lg transition-all ${
              confirming
                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                : "bg-zinc-800/30 border-zinc-700/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {confirming ? "Confirmar limpeza" : "Limpar cache"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
