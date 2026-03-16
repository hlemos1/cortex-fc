"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseAutoSaveOptions {
  key: string
  debounceMs?: number
}

export function useAutoSave<T>({ key, debounceMs = 2000 }: UseAutoSaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storageKey = `cortex-draft-${key}`

  const save = useCallback((data: T) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const payload = { data, savedAt: new Date().toISOString() }
        localStorage.setItem(storageKey, JSON.stringify(payload))
        setLastSaved(new Date())
      } catch {
        // localStorage full or unavailable
      }
    }, debounceMs)
  }, [storageKey, debounceMs])

  const load = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      setLastSaved(new Date(parsed.savedAt))
      return parsed.data as T
    } catch {
      return null
    }
  }, [storageKey])

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey)
    setLastSaved(null)
  }, [storageKey])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { save, load, clear, lastSaved }
}
