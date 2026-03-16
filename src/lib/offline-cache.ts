const DB_NAME = "cortex-fc-offline"
const DB_VERSION = 1
const STORE_NAME = "api-cache"

interface CacheEntry {
  key: string
  data: unknown
  timestamp: number
  ttl: number // milliseconds
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined
        if (!entry) return resolve(null)
        // For offline, stale data is better than no data
        resolve(entry.data as T)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCache(key: string, data: unknown, ttlMs: number = 3600000): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.put({ key, data, timestamp: Date.now(), ttl: ttlMs })
  } catch {
    // Silently fail — cache is best-effort
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).clear()
  } catch {
    // Silently fail
  }
}

export async function getCacheSize(): Promise<number> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}
