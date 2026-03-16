"use client"

import { useLocale } from "next-intl"
import { formatDate, formatDateRelative, formatNumber, formatCurrency, formatPercent } from "@/lib/formatters"
import type { Locale } from "@/i18n/config"

export function useFormatters() {
  const locale = useLocale() as Locale

  return {
    date: (d: Date | string) => formatDate(d, locale),
    dateRelative: (d: Date | string) => formatDateRelative(d, locale),
    number: (n: number) => formatNumber(n, locale),
    currency: (n: number, cur?: string) => formatCurrency(n, locale, cur),
    percent: (n: number) => formatPercent(n, locale),
    locale,
  }
}
