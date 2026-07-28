import type { SwipeSessionEnvelope } from '@/types/swipe'

/** Root key for all Swipe session storage. */
const LS_SWIPE_PREFIX = 'swipe:'

/** Stores array of sessionIds for quick lookup. */
const LS_INDEX_KEY = `${LS_SWIPE_PREFIX}sessions:index`

/** Stores retention window (days) for archived sessions. */
const LS_RETENTION_DAYS_KEY = `${LS_SWIPE_PREFIX}sessions:retentionDays`

/** Stores whether helper tips are shown. */
const LS_TOOLTIPS_ENABLED_KEY = `${LS_SWIPE_PREFIX}settings:tooltipsEnabled`

/** Prefix for individual session data. */
const LS_SESSION_PREFIX = `${LS_SWIPE_PREFIX}session:`

/** Default retention for historical sessions. */
const DEFAULT_SESSION_RETENTION_DAYS = 90

/** Safety bounds for configurable retention. */
const MIN_SESSION_RETENTION_DAYS = 7
const MAX_SESSION_RETENTION_DAYS = 3650

/** Creates full localStorage key for a session by ID. */
function getSessionKey(sessionId: number): string {
  return `${LS_SESSION_PREFIX}${sessionId}`
}

/**
 * Loads the index of all session IDs from localStorage.
 * Returns empty array if index doesn't exist or is corrupted.
 */
export function loadSessionIndex(): number[] {
  try {
    const stored = localStorage.getItem(LS_INDEX_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.every((id) => typeof id === 'number') ? parsed : []
  } catch {
    return []
  }
}

/**
 * Loads a single session from localStorage by ID.
 * Returns null if session doesn't exist or is corrupted.
 */
export function loadSession(sessionId: number): SwipeSessionEnvelope | null {
  try {
    const key = getSessionKey(sessionId)
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const parsed = JSON.parse(stored) as unknown

    if (typeof parsed !== 'object' || parsed === null) return null
    const obj = parsed as Record<string, unknown>

    if (
      typeof obj.sessionId !== 'number' ||
      typeof obj.createdAt !== 'number' ||
      typeof obj.updatedAt !== 'number' ||
      typeof obj.shellState !== 'string' ||
      typeof obj.schemaVersion !== 'number'
    ) {
      return null
    }

    return parsed as SwipeSessionEnvelope
  } catch {
    return null
  }
}

/**
 * Loads all sessions from localStorage.
 * Skips corrupted entries silently.
 */
export function loadAllSessions(): SwipeSessionEnvelope[] {
  const index = loadSessionIndex()
  const sessions: SwipeSessionEnvelope[] = []

  for (const sessionId of index) {
    const session = loadSession(sessionId)
    if (session) {
      sessions.push(session)
    }
  }

  return sessions
}

/**
 * Loads user-configured session retention in days.
 * Returns default value when not configured or invalid.
 */
export function getSessionRetentionDays(): number {
  try {
    const rawValue = localStorage.getItem(LS_RETENTION_DAYS_KEY)
    if (!rawValue) {
      return DEFAULT_SESSION_RETENTION_DAYS
    }

    const parsedValue = Number(rawValue)
    if (!Number.isInteger(parsedValue)) {
      return DEFAULT_SESSION_RETENTION_DAYS
    }

    if (parsedValue < MIN_SESSION_RETENTION_DAYS || parsedValue > MAX_SESSION_RETENTION_DAYS) {
      return DEFAULT_SESSION_RETENTION_DAYS
    }

    return parsedValue
  } catch {
    return DEFAULT_SESSION_RETENTION_DAYS
  }
}

/**
 * Persists user-configured session retention in days.
 * Invalid values are clamped to safe bounds.
 */
export function setSessionRetentionDays(days: number): number {
  const normalizedDays = Math.trunc(days)
  const clampedDays = Math.min(
    MAX_SESSION_RETENTION_DAYS,
    Math.max(MIN_SESSION_RETENTION_DAYS, normalizedDays),
  )

  try {
    localStorage.setItem(LS_RETENTION_DAYS_KEY, String(clampedDays))
  } catch (error) {
    console.error('Failed to save Swipe session retention setting:', error)
  }

  return clampedDays
}

/**
 * Removes sessions older than the configured retention window.
 * Returns the number of deleted sessions.
 */
export function pruneExpiredSessions(
  now: number = Date.now(),
  retentionDays: number = getSessionRetentionDays(),
): number {
  const retentionWindowMs = retentionDays * 24 * 60 * 60 * 1000
  const cutoffTimestamp = now - retentionWindowMs
  let deletedCount = 0

  for (const sessionId of loadSessionIndex()) {
    if (sessionId < cutoffTimestamp) {
      deleteSession(sessionId)
      deletedCount += 1
    }
  }

  return deletedCount
}

/**
 * Saves a session to localStorage and updates the index.
 * Overwrites existing session with same ID.
 */
export function saveSession(session: SwipeSessionEnvelope): void {
  try {
    const key = getSessionKey(session.sessionId)
    localStorage.setItem(key, JSON.stringify(session))

    const index = loadSessionIndex()
    if (!index.includes(session.sessionId)) {
      index.push(session.sessionId)
      localStorage.setItem(LS_INDEX_KEY, JSON.stringify(index))
    }
  } catch (error) {
    console.error('Failed to save Swipe session:', error)
  }
}

/**
 * Deletes a session from localStorage and updates the index.
 */
export function deleteSession(sessionId: number): void {
  try {
    const key = getSessionKey(sessionId)
    localStorage.removeItem(key)

    const index = loadSessionIndex().filter((id) => id !== sessionId)
    localStorage.setItem(LS_INDEX_KEY, JSON.stringify(index))
  } catch (error) {
    console.error('Failed to delete Swipe session:', error)
  }
}

/**
 * Deletes all Swipe sessions and related preferences from localStorage.
 */
export function deleteAllSessions(): void {
  try {
    const index = loadSessionIndex()

    for (const sessionId of index) {
      const key = getSessionKey(sessionId)
      localStorage.removeItem(key)
    }

    localStorage.removeItem(LS_INDEX_KEY)
    localStorage.removeItem(LS_RETENTION_DAYS_KEY)
  } catch (error) {
    console.error('Failed to delete all Swipe sessions:', error)
  }
}

/**
 * Loads whether helper tips are enabled.
 * Returns true by default when not configured.
 */
export function getTooltipsEnabled(): boolean {
  try {
    const rawValue = localStorage.getItem(LS_TOOLTIPS_ENABLED_KEY)
    if (rawValue === null) {
      return true
    }
    return rawValue !== 'false'
  } catch {
    return true
  }
}

/**
 * Persists whether helper tips are enabled.
 */
export function setTooltipsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LS_TOOLTIPS_ENABLED_KEY, String(enabled))
  } catch (error) {
    console.error('Failed to save Swipe tooltips setting:', error)
  }
}
