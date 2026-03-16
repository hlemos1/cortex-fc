"use client"

import { useState, useEffect, useCallback } from "react"
import { getCached, setCache } from "@/lib/offline-cache"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"

interface UseOfflineQueryOptions<T> {
  key: string
  fetcher: () => Promise<T>
  ttl?: number // cache TTL in ms, default 1h
  enabled?: boolean
}

interface UseOfflineQueryResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  isFromCache: boolean
  refetch: () => Promise<void>
}

export function useOfflineQuery<T>({
  key,
  fetcher,
  ttl = 3600000,
  enabled = true,
}: UseOfflineQueryOptions<T>): UseOfflineQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const isOnline = useOnlineStatus()

  const fetchData = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)

    // Try online fetch first
    if (isOnline) {
      try {
        const result = await fetcher()
        setData(result)
        setIsFromCache(false)
        // Cache for offline use
        await setCache(key, result, ttl)
        setIsLoading(false)
        return
      } catch {
        // Online fetch failed, fall through to cache
      }
    }

    // Fallback to cache
    const cached = await getCached<T>(key)
    if (cached !== null) {
      setData(cached)
      setIsFromCache(true)
      setIsLoading(false)
    } else {
      setError(isOnline ? "Erro ao carregar dados" : "Sem conexao e sem dados em cache")
      setIsLoading(false)
    }
  }, [key, fetcher, ttl, enabled, isOnline])

  useEffect(() => {
    queueMicrotask(() => fetchData())
  }, [fetchData])

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && isFromCache && enabled) {
      queueMicrotask(() => fetchData())
    }
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, isFromCache, refetch: fetchData }
}
