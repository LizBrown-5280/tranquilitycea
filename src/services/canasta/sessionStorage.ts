import type { CanastaSessionEnvelope } from '@/types/canasta'

/** Root key for all Canasta session storage. */
const LS_CANASTA_PREFIX = 'canasta:'

/** Stores array of sessionIds for quick lookup. */
const LS_INDEX_KEY = `${LS_CANASTA_PREFIX}sessions:index`

/** Stores retention window (days) for archived sessions. */
const LS_RETENTION_DAYS_KEY = `${LS_CANASTA_PREFIX}sessions:retentionDays`

/** Stores whether tooltip info icons are shown. */
const LS_TOOLTIPS_ENABLED_KEY = `${LS_CANASTA_PREFIX}settings:tooltipsEnabled`

/** Prefix for individual session data. */
const LS_SESSION_PREFIX = `${LS_CANASTA_PREFIX}session:`

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
export function loadSession(sessionId: number): CanastaSessionEnvelope | null {
  try {
    const key = getSessionKey(sessionId)
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const parsed = JSON.parse(stored) as unknown

    // Basic schema validation
    if (typeof parsed !== 'object' || parsed === null) return null
    const obj = parsed as Record<string, unknown>

    if (
      typeof obj.sessionId !== 'number' ||
      typeof obj.createdAt !== 'number' ||
      typeof obj.updatedAt !== 'number' ||
      typeof obj.sessionType !== 'string' ||
      typeof obj.activeTab !== 'string' ||
      typeof obj.handState !== 'object' ||
      typeof obj.schemaVersion !== 'number'
    ) {
      return null
    }

    // Reject sessions saved before the teamWe/teamThey rename (schema version 1 with old keys).
    const handState = obj.handState as Record<string, Record<string, unknown>>
    const firstHand = handState['hand1']
    if (firstHand && ('teamA' in firstHand || 'teamB' in firstHand)) {
      return null
    }

    return parsed as CanastaSessionEnvelope
  } catch {
    return null
  }
}

/**
 * Loads all sessions from localStorage.
 * Skips corrupted entries silently.
 */
export function loadAllSessions(): CanastaSessionEnvelope[] {
  const index = loadSessionIndex()
  const sessions: CanastaSessionEnvelope[] = []

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
    console.error('Failed to save Canasta session retention setting:', error)
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
export function saveSession(session: CanastaSessionEnvelope): void {
  try {
    const key = getSessionKey(session.sessionId)
    localStorage.setItem(key, JSON.stringify(session))

    // Update index
    const index = loadSessionIndex()
    if (!index.includes(session.sessionId)) {
      index.push(session.sessionId)
      localStorage.setItem(LS_INDEX_KEY, JSON.stringify(index))
    }
  } catch (error) {
    console.error('Failed to save Canasta session:', error)
  }
}

/**
 * Deletes a session from localStorage and updates the index.
 */
export function deleteSession(sessionId: number): void {
  try {
    const key = getSessionKey(sessionId)
    localStorage.removeItem(key)

    // Update index
    const index = loadSessionIndex().filter((id) => id !== sessionId)
    localStorage.setItem(LS_INDEX_KEY, JSON.stringify(index))
  } catch (error) {
    console.error('Failed to delete Canasta session:', error)
  }
}

/**
 * Deletes all Canasta sessions and the index from localStorage.
 */
export function deleteAllSessions(): void {
  try {
    const index = loadSessionIndex()

    // Delete each session
    for (const sessionId of index) {
      const key = getSessionKey(sessionId)
      localStorage.removeItem(key)
    }

    // Delete index
    localStorage.removeItem(LS_INDEX_KEY)
    localStorage.removeItem(LS_RETENTION_DAYS_KEY)
  } catch (error) {
    console.error('Failed to delete all Canasta sessions:', error)
  }
}

/**
 * Loads whether tooltip info icons are enabled.
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
 * Persists whether tooltip info icons are enabled.
 */
export function setTooltipsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LS_TOOLTIPS_ENABLED_KEY, String(enabled))
  } catch (error) {
    console.error('Failed to save Canasta tooltips setting:', error)
  }
}
