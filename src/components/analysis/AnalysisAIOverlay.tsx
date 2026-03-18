"use client"

import { Brain } from "lucide-react"

// ============================================
// Types
// ============================================

export interface AnalysisAIOverlayProps {
  messageIndex: number
}

const AI_PROGRESS_MESSAGES = [
  "Inicializando ORACLE...",
  "Processando camada C1 \u2014 Tecnico...",
  "Processando camada C2 \u2014 Tatico...",
  "Processando camada C3 \u2014 Fisico...",
  "Calculando matriz VxRx...",
  "Gerando algoritmos proprietarios...",
  "Formulando parecer neural...",
]

export function AnalysisAIOverlay({ messageIndex }: AnalysisAIOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
        <div className="relative">
          <Brain className="w-16 h-16 text-emerald-400 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-emerald-500/30 animate-ping" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-zinc-100">Gerando Analise Neural com IA</p>
          <p className="text-sm text-emerald-400 font-mono animate-pulse">
            {AI_PROGRESS_MESSAGES[messageIndex % AI_PROGRESS_MESSAGES.length]}
          </p>
        </div>
        <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(95, ((messageIndex + 1) / AI_PROGRESS_MESSAGES.length) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500">Isso pode levar 10-30 segundos</p>
      </div>
    </div>
  )
}
