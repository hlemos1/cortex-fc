"use client"

import {
  Search,
  XCircle,
  Plus,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// ============================================
// Types
// ============================================

interface SearchResult {
  id: string
  name: string
  position: string
  club: string
}

export interface ScoutingSearchPanelProps {
  addPlayerSearch: string
  onSearchChange: (value: string) => void
  addSearchResults: SearchResult[]
  onAddTarget: (playerId: string) => void
  onClose: () => void
}

export function ScoutingSearchPanel({
  addPlayerSearch,
  onSearchChange,
  addSearchResults,
  onAddTarget,
  onClose,
}: ScoutingSearchPanelProps) {
  return (
    <Card className="bg-zinc-900/95 border-emerald-500/20 animate-slide-up">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white font-medium">Adicionar jogador ao pipeline</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-red-400">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar jogador..."
            value={addPlayerSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-zinc-800/40 border-zinc-700/40 text-zinc-200"
          />
        </div>
        {addSearchResults.length > 0 && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {addSearchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => onAddTarget(p.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-white">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.position} — {p.club}</p>
                </div>
                <Plus className="w-4 h-4 text-emerald-500" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
