"use client"

import { Sparkles, ArrowRight, Lock } from "lucide-react"
import Link from "next/link"

interface UpgradePromptProps {
  feature: string
  description: string
  requiredTier: "scout_individual" | "club_professional" | "holding_multiclub"
  variant?: "inline" | "overlay" | "banner"
}

const tierLabels = {
  scout_individual: "Scout Individual",
  club_professional: "Club Professional",
  holding_multiclub: "Holding Multi-Club",
}

export function UpgradePrompt({
  feature,
  description,
  requiredTier,
  variant = "inline",
}: UpgradePromptProps) {
  const tierLabel = tierLabels[requiredTier]

  if (variant === "banner") {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] via-cyan-500/[0.04] to-emerald-500/[0.06] p-4 animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.08),_transparent_60%)]" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{feature}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            </div>
          </div>
          <Link href="/pricing">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-900/40">
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade para {tierLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (variant === "overlay") {
    return (
      <div className="relative">
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-[2px] bg-zinc-900/60 border border-zinc-700/50">
          <div className="text-center p-6 max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/5">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-200 mb-1">{feature}</p>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{description}</p>
            <Link href="/pricing">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-900/40">
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade para {tierLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // inline variant (default)
  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-6 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/5">
        <Lock className="w-5 h-5 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-200 mb-1">{feature}</p>
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
      <Link href="/pricing">
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-900/40">
          <Sparkles className="w-3.5 h-3.5" />
          Upgrade para {tierLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </Link>
    </div>
  )
}
