"use client"

import { useState, useEffect, useCallback } from "react"

interface SearchPreferences {
  sortField: string
  sortDir: "asc" | "desc"
  filters: Record<string, string>
}

const DEFAULT_PREFS: SearchPreferences = {
  sortField: "",
  sortDir: "asc",
  filters: {},
}

function getStorageKey(pageKey: string) {
  return `cortex-fc:search-prefs:${pageKey}`
}

export function useSearchPreferences(pageKey: string) {
  const [prefs, setPrefs] = useState<SearchPreferences>(DEFAULT_PREFS)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount (in useEffect to avoid hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(pageKey))
      if (raw) {
        const parsed = JSON.parse(raw) as SearchPreferences
        setPrefs(parsed)
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true)
  }, [pageKey])

  // Save to localStorage whenever prefs change (skip initial load)
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(getStorageKey(pageKey), JSON.stringify(prefs))
    } catch {
      // Ignore storage errors
    }
  }, [prefs, pageKey, loaded])

  const setSortField = useCallback((field: string) => {
    setPrefs((prev) => ({ ...prev, sortField: field }))
  }, [])

  const setSortDir = useCallback((dir: "asc" | "desc") => {
    setPrefs((prev) => ({ ...prev, sortDir: dir }))
  }, [])

  const setFilter = useCallback((key: string, value: string) => {
    setPrefs((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setPrefs((prev) => ({ ...prev, filters: {} }))
  }, [])

  return {
    prefs,
    loaded,
    setSortField,
    setSortDir,
    setFilter,
    clearFilters,
  }
}
