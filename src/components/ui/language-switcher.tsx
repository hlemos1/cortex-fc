"use client"

import { useState, useRef, useEffect } from "react"
import { useLocale } from "next-intl"
import { useLocaleSwitcher } from "@/hooks/useLocaleSwitcher"
import { locales } from "@/i18n/config"
import type { Locale } from "@/i18n/config"
import { Globe } from "lucide-react"

const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Portugues",
  en: "English",
}

const LOCALE_FLAGS: Record<Locale, string> = {
  "pt-BR": "BR",
  en: "EN",
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const { switchLocale, isPending } = useLocaleSwitcher()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{LOCALE_FLAGS[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-lg border border-white/10 bg-zinc-900/90 p-1 shadow-xl backdrop-blur-md">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                switchLocale(l)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                l === locale
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xs font-bold">{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
