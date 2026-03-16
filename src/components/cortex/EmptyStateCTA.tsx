"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EmptyStateCTAProps {
  icon: React.ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  variant?: "default" | "compact"
}

export function EmptyStateCTA({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "default",
}: EmptyStateCTAProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <span className="text-zinc-500 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200">{title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
        {primaryAction && (
          <Link href={primaryAction.href}>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex-shrink-0"
            >
              {primaryAction.label}
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="relative py-16 text-center animate-fade-in overflow-hidden">
      {/* Subtle background pulse */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-emerald-500/[0.02] blur-3xl animate-pulse" />
      </div>

      {/* Glass card */}
      <div className="relative inline-block mx-auto">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center mx-auto mb-5">
          <span className="text-zinc-500 [&>svg]:w-6 [&>svg]:h-6">{icon}</span>
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {primaryAction && (
            <Link href={primaryAction.href}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-emerald-900/40 hover:-translate-y-0.5">
                {primaryAction.label}
              </Button>
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
