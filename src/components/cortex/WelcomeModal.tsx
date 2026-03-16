"use client"

import { useState, useEffect } from "react"
import { Activity, Users, Cpu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "cortex-welcome-seen"

const features = [
  {
    icon: Activity,
    title: "7 Algoritmos",
    description: "Motor ORACLE com 7 dimensoes de analise",
  },
  {
    icon: Users,
    title: "Scouting IA",
    description: "Pipeline inteligente de alvos",
  },
  {
    icon: Cpu,
    title: "6 Agentes",
    description: "Agentes autonomos de IA especializados",
  },
]

export function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      setOpen(true)
    }
  }, [])

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "1")
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-strong rounded-2xl overflow-hidden animate-scale-in">
        {/* Gradient top bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              CORTEX FC
            </h1>
            <p className="text-[11px] text-zinc-500 font-mono tracking-[0.2em] mt-1">
              Neural Football Analytics
            </p>
          </div>

          {/* Welcome message */}
          <p className="text-sm text-zinc-400 text-center leading-relaxed mb-8">
            Bem-vindo ao Cortex FC. Sua plataforma de inteligencia neural para
            analise e decisao no futebol.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 mb-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30 transition-colors hover:border-emerald-500/20"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-500/20">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {feature.title}
                    </p>
                    <p className="text-xs text-zinc-500">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <Button
            onClick={handleClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-emerald-900/40 h-11 text-sm font-semibold"
          >
            Comecar
          </Button>

          {/* Skip link */}
          <button
            onClick={handleClose}
            className="w-full mt-3 text-xs text-zinc-500 hover:text-zinc-400 transition-colors py-1"
          >
            Ja conhego, pular
          </button>
        </div>
      </div>
    </div>
  )
}
