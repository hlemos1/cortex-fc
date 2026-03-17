"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"

interface WatchlistButtonProps {
  playerId: string
  initialWatched: boolean
}

export function WatchlistButton({ playerId, initialWatched }: WatchlistButtonProps) {
  const [watched, setWatched] = useState(initialWatched)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    // Optimistic update
    setWatched((prev) => !prev)

    startTransition(async () => {
      try {
        const res = await fetch("/api/players/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        })
        if (res.ok) {
          const data = await res.json()
          setWatched(data.data.watched)
        } else {
          // Revert on error
          setWatched((prev) => !prev)
        }
      } catch {
        // Revert on error
        setWatched((prev) => !prev)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={watched ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={watched ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border transition-all duration-200 ${
        watched
          ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
          : "bg-zinc-800/60 border-zinc-700/50 text-zinc-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <Heart
        className={`w-4 h-4 transition-all ${watched ? "fill-red-400" : ""}`}
      />
    </button>
  )
}
