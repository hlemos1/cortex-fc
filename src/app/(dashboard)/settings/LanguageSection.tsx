"use client"

import { useLocale } from "next-intl"
import { useLocaleSwitcher } from "@/hooks/useLocaleSwitcher"
import { locales, type Locale } from "@/i18n/config"
import { Globe, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const localeLabels: Record<Locale, { flag: string; name: string; shortCode: string }> = {
  "pt-BR": { flag: "BR", name: "Portugues (Brasil)", shortCode: "PT-BR" },
  en: { flag: "EN", name: "English", shortCode: "EN" },
}

export function LanguageSection() {
  const currentLocale = useLocale() as Locale
  const { switchLocale, isPending } = useLocaleSwitcher()

  return (
    <Card className="glass rounded-xl card-hover animate-slide-up stagger-1 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          Idioma / Language
        </CardTitle>
        <p className="text-xs text-zinc-600">
          Selecione o idioma da interface
        </p>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="flex items-center gap-2 mb-3 text-xs text-emerald-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Reiniciando...</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {locales.map((locale) => {
            const info = localeLabels[locale]
            const isActive = locale === currentLocale

            return (
              <button
                key={locale}
                onClick={() => {
                  if (!isActive && !isPending) {
                    switchLocale(locale)
                  }
                }}
                disabled={isPending}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-800/20 hover:border-zinc-700 hover:bg-zinc-800/40"
                } ${isPending ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40"
                  }`}
                >
                  {info.flag}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${isActive ? "text-emerald-400" : "text-zinc-300"}`}>
                    {info.name}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                    {info.shortCode}
                  </p>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
