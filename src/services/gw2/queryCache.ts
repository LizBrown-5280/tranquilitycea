import { getActiveEndpointProfileKey } from '@/services/gw2/endpointManifest'
import type { Gw2EndpointRunResult } from '@/types/gw2'

export const PUBLIC_STALE_TIME_MS = 1000 * 60 * 60 * 48
export const ACCOUNT_STALE_TIME_MS = 1000 * 60 * 60 * 12

const QUERY_CACHE_PREFIX = 'gw2:query-cache:'
const ACCOUNT_CACHE_PREFIX = `${QUERY_CACHE_PREFIX}account:`

interface CachedQueryEntry {
  storedAt: number
  results: Gw2EndpointRunResult[]
}

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function makePublicCacheKey(sectionKey: string): string {
  return `${QUERY_CACHE_PREFIX}public:${getActiveEndpointProfileKey()}:${sectionKey}`
}

function makeAccountCacheKey(apiKey: string): string {
  return `${ACCOUNT_CACHE_PREFIX}${getActiveEndpointProfileKey()}:${apiKey}`
}

function readCacheEntry(cacheKey: string): CachedQueryEntry | undefined {
  if (!canUseStorage()) {
    return undefined
  }

  try {
    const rawValue = localStorage.getItem(cacheKey)
    if (!rawValue) {
      return undefined
    }

    const parsed = JSON.parse(rawValue) as Partial<CachedQueryEntry>
    if (!parsed || typeof parsed.storedAt !== 'number' || !Array.isArray(parsed.results)) {
      return undefined
    }

    return {
      storedAt: parsed.storedAt,
      results: parsed.results as Gw2EndpointRunResult[],
    }
  } catch {
    return undefined
  }
}

function writeCacheEntry(cacheKey: string, results: Gw2EndpointRunResult[]) {
  if (!canUseStorage()) {
    return
  }

  try {
    const payload: CachedQueryEntry = {
      storedAt: Date.now(),
      results,
    }
    localStorage.setItem(cacheKey, JSON.stringify(payload))
  } catch {
    // Ignore storage failures and continue with in-memory query data.
  }
}

function isFresh(storedAt: number, staleTimeMs: number): boolean {
  return Date.now() - storedAt <= staleTimeMs
}

export function getFreshPublicQueryCache(
  sectionKey: string,
  staleTimeMs: number = PUBLIC_STALE_TIME_MS,
): Gw2EndpointRunResult[] | undefined {
  const entry = readCacheEntry(makePublicCacheKey(sectionKey))
  if (!entry || !isFresh(entry.storedAt, staleTimeMs)) {
    return undefined
  }

  return entry.results
}

export function setPublicQueryCache(sectionKey: string, results: Gw2EndpointRunResult[]) {
  writeCacheEntry(makePublicCacheKey(sectionKey), results)
}

export function getFreshAccountQueryCache(
  apiKey: string,
  staleTimeMs: number = ACCOUNT_STALE_TIME_MS,
): Gw2EndpointRunResult[] | undefined {
  const entry = readCacheEntry(makeAccountCacheKey(apiKey))
  if (!entry || !isFresh(entry.storedAt, staleTimeMs)) {
    return undefined
  }

  return entry.results
}

export function setAccountQueryCache(apiKey: string, results: Gw2EndpointRunResult[]) {
  writeCacheEntry(makeAccountCacheKey(apiKey), results)
}

export function hasFreshAccountQueryCache(
  apiKey: string,
  staleTimeMs: number = ACCOUNT_STALE_TIME_MS,
): boolean {
  return Boolean(getFreshAccountQueryCache(apiKey, staleTimeMs))
}

export function clearAllAccountQueryCache() {
  if (!canUseStorage()) {
    return
  }

  try {
    const keysToDelete: string[] = []

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key && key.startsWith(ACCOUNT_CACHE_PREFIX)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage failures.
  }
}
