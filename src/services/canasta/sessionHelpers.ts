import type { CanastaSessionEnvelope, CanastaTeamId, HandTabId } from '@/types/canasta'

/** 4 hours in milliseconds. */
const CURRENT_SESSION_WINDOW_MS = 4 * 60 * 60 * 1000

/**
 * Determines if a session is "current" (created within the last 4 hours).
 * Allows users to resume an interrupted game if they accidentally left the page.
 */
export function isCurrent(sessionId: number, now: number = Date.now()): boolean {
  const age = now - sessionId
  return age >= 0 && age < CURRENT_SESSION_WINDOW_MS
}

/**
 * Determines if a session is "previous" (created 4+ hours ago).
 * These sessions are archived and displayed as historical records.
 */
export function isPrevious(sessionId: number, now: number = Date.now()): boolean {
  const age = now - sessionId
  return age >= CURRENT_SESSION_WINDOW_MS
}

/**
 * Returns the latest session that is within the current 4-hour window.
 * Returns null if no current session exists.
 */
export function getCurrentSession(
  sessions: CanastaSessionEnvelope[],
  now: number = Date.now(),
): CanastaSessionEnvelope | null {
  const currentSessions = sessions.filter((s) => isCurrent(s.sessionId, now))

  if (currentSessions.length === 0) {
    return null
  }

  // Return newest (highest sessionId)
  return currentSessions.reduce((latest, session) =>
    session.sessionId > latest.sessionId ? session : latest,
  )
}

/**
 * Returns all sessions that are archived (4+ hours old), sorted newest first.
 */
export function getPreviousSessions(
  sessions: CanastaSessionEnvelope[],
  now: number = Date.now(),
): CanastaSessionEnvelope[] {
  return sessions
    .filter((s) => isPrevious(s.sessionId, now))
    .sort((a, b) => b.sessionId - a.sessionId)
}

/**
 * Sorts sessions by creation time, newest first.
 */
export function sortSessionsByNewest(sessions: CanastaSessionEnvelope[]): CanastaSessionEnvelope[] {
  return [...sessions].sort((a, b) => b.sessionId - a.sessionId)
}

/**
 * Formats a session as a human-readable label with date and time.
 * Example: "Mon, May 4 at 3:45 PM"
 */
export function formatSessionLabel(session: CanastaSessionEnvelope): string {
  const date = new Date(session.sessionId)
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return `${dayName}, ${monthDay} at ${time}`
}

/**
 * Creates a deterministic snapshot of a session for dirty-check comparison.
 */
export function createSessionSnapshot(session: CanastaSessionEnvelope): string {
  return JSON.stringify(session)
}

/**
 * Checks if two session snapshots differ.
 */
export function hasSessionChanged(before: string, after: string): boolean {
  return before !== after
}

/**
 * Returns true if a session has no scoring data entered across any hand or team.
 */
export function isSessionEmpty(session: CanastaSessionEnvelope): boolean {
  const HAND_TABS: HandTabId[] = ['hand1', 'hand2', 'hand3', 'hand4']
  const TEAMS: CanastaTeamId[] = ['teamA', 'teamB']

  for (const handId of HAND_TABS) {
    for (const teamId of TEAMS) {
      const inputs = session.handState[handId][teamId]
      const hasDetailScores =
        inputs.allRequirements ||
        inputs.wentOut ||
        inputs.requirement7s !== 0 ||
        inputs.requirement5s !== 0 ||
        inputs.requirementWilds !== 0 ||
        inputs.requirementCleans !== 0 ||
        inputs.requirementDirtys !== 0 ||
        inputs.red3s !== 0 ||
        inputs.fastClean10Books !== 0 ||
        inputs.fastClean5Books !== 0 ||
        inputs.fastCleanABooks !== 0 ||
        inputs.cardCount !== 0 ||
        inputs.penaltyCount !== 0
      const hasManualScores =
        inputs.manualBigCount !== null ||
        inputs.manualCardCount !== null ||
        inputs.manualPenaltyCount !== null

      if (hasDetailScores || hasManualScores) {
        return false
      }
    }
  }

  return true
}
