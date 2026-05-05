import { describe, expect, it } from 'vitest'

import {
  createSessionSnapshot,
  formatSessionLabel,
  getCurrentSession,
  getPreviousSessions,
  hasSessionChanged,
  isCurrent,
  isPrevious,
  sortSessionsByNewest,
} from '@/services/canasta/sessionHelpers'
import { createEmptyCanastaSessionEnvelope, type CanastaSessionEnvelope } from '@/types/canasta'

describe('sessionHelpers', () => {
  const now = 1000000000000 // May 9, 2001, 01:46:40 GMT

  describe('isCurrent', () => {
    it('returns true for session created within 4 hours', () => {
      const sessionId = now - 1 * 60 * 60 * 1000 // 1 hour ago
      expect(isCurrent(sessionId, now)).toBe(true)
    })

    it('returns true for session created right now', () => {
      expect(isCurrent(now, now)).toBe(true)
    })

    it('returns false for session created exactly 4 hours ago', () => {
      const sessionId = now - 4 * 60 * 60 * 1000
      expect(isCurrent(sessionId, now)).toBe(false)
    })

    it('returns false for session created more than 4 hours ago', () => {
      const sessionId = now - 5 * 60 * 60 * 1000
      expect(isCurrent(sessionId, now)).toBe(false)
    })

    it('returns false for future session', () => {
      const sessionId = now + 1000
      expect(isCurrent(sessionId, now)).toBe(false)
    })
  })

  describe('isPrevious', () => {
    it('returns false for session created within 4 hours', () => {
      const sessionId = now - 1 * 60 * 60 * 1000
      expect(isPrevious(sessionId, now)).toBe(false)
    })

    it('returns true for session created exactly 4 hours ago', () => {
      const sessionId = now - 4 * 60 * 60 * 1000
      expect(isPrevious(sessionId, now)).toBe(true)
    })

    it('returns true for session created more than 4 hours ago', () => {
      const sessionId = now - 5 * 60 * 60 * 1000
      expect(isPrevious(sessionId, now)).toBe(true)
    })

    it('returns false for future session', () => {
      const sessionId = now + 1000
      expect(isPrevious(sessionId, now)).toBe(false)
    })
  })

  describe('getCurrentSession', () => {
    it('returns null when no sessions exist', () => {
      expect(getCurrentSession([], now)).toBeNull()
    })

    it('returns null when only previous sessions exist', () => {
      const sessions: CanastaSessionEnvelope[] = [
        createEmptyCanastaSessionEnvelope('bothTeams', now - 5 * 60 * 60 * 1000),
      ]
      expect(getCurrentSession(sessions, now)).toBeNull()
    })

    it('returns the only current session', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', now - 1 * 60 * 60 * 1000)
      expect(getCurrentSession([session], now)).toEqual(session)
    })

    it('returns the newest current session when multiple exist', () => {
      const old = createEmptyCanastaSessionEnvelope('bothTeams', now - 3 * 60 * 60 * 1000)
      const newer = createEmptyCanastaSessionEnvelope('bothTeams', now - 1 * 60 * 60 * 1000)

      const result = getCurrentSession([old, newer], now)
      expect(result?.sessionId).toBe(newer.sessionId)
    })

    it('ignores previous sessions when finding newest current', () => {
      const current = createEmptyCanastaSessionEnvelope('bothTeams', now - 1 * 60 * 60 * 1000)
      const previous = createEmptyCanastaSessionEnvelope('bothTeams', now - 5 * 60 * 60 * 1000)

      const result = getCurrentSession([previous, current], now)
      expect(result?.sessionId).toBe(current.sessionId)
    })
  })

  describe('getPreviousSessions', () => {
    it('returns empty array when no sessions exist', () => {
      expect(getPreviousSessions([], now)).toEqual([])
    })

    it('returns empty array when only current sessions exist', () => {
      const sessions: CanastaSessionEnvelope[] = [
        createEmptyCanastaSessionEnvelope('bothTeams', now - 1 * 60 * 60 * 1000),
      ]
      expect(getPreviousSessions(sessions, now)).toEqual([])
    })

    it('returns all previous sessions sorted newest first', () => {
      const old = createEmptyCanastaSessionEnvelope('bothTeams', now - 10 * 60 * 60 * 1000)
      const newer = createEmptyCanastaSessionEnvelope('bothTeams', now - 5 * 60 * 60 * 1000)

      const result = getPreviousSessions([old, newer], now)
      expect(result).toHaveLength(2)
      expect(result[0]!.sessionId).toBe(newer.sessionId)
      expect(result[1]!.sessionId).toBe(old.sessionId)
    })

    it('filters out current sessions', () => {
      const current = createEmptyCanastaSessionEnvelope('bothTeams', now - 1 * 60 * 60 * 1000)
      const previous = createEmptyCanastaSessionEnvelope('bothTeams', now - 5 * 60 * 60 * 1000)

      const result = getPreviousSessions([current, previous], now)
      expect(result).toHaveLength(1)
      expect(result[0]!.sessionId).toBe(previous.sessionId)
    })
  })

  describe('sortSessionsByNewest', () => {
    it('returns empty array unchanged', () => {
      expect(sortSessionsByNewest([])).toEqual([])
    })

    it('sorts single session', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', now)
      expect(sortSessionsByNewest([session])).toEqual([session])
    })

    it('sorts multiple sessions newest first', () => {
      const old = createEmptyCanastaSessionEnvelope('bothTeams', now - 10000)
      const mid = createEmptyCanastaSessionEnvelope('bothTeams', now - 5000)
      const new_ = createEmptyCanastaSessionEnvelope('bothTeams', now)

      const result = sortSessionsByNewest([old, new_, mid])
      expect(result.map((s) => s.sessionId)).toEqual([now, now - 5000, now - 10000])
    })

    it('does not mutate input array', () => {
      const sessions = [
        createEmptyCanastaSessionEnvelope('bothTeams', now - 1000),
        createEmptyCanastaSessionEnvelope('bothTeams', now),
      ]
      const original = sessions.map((s) => s.sessionId)

      sortSessionsByNewest(sessions)

      expect(sessions.map((s) => s.sessionId)).toEqual(original)
    })
  })

  describe('formatSessionLabel', () => {
    it('formats session with date and time', () => {
      // Timestamp 1000000000000 is September 8, 2001, 8:46 PM EDT
      const session = createEmptyCanastaSessionEnvelope('bothTeams', now)
      const label = formatSessionLabel(session)

      // Format should be like "Tue, Sep 8 at 8:46 PM"
      expect(label).toMatch(/\w+,\s\w+\s\d+\sat\s\d+:\d+\s[AP]M/)
      expect(label).toContain('Sep')
    })

    it('includes session date and time information', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', now)
      const label = formatSessionLabel(session)

      // Verify it's a reasonable format
      expect(label).toBeTruthy()
      expect(label.length).toBeGreaterThan(10)
    })
  })

  describe('createSessionSnapshot', () => {
    it('returns stringified session', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', now)
      const snapshot = createSessionSnapshot(session)

      expect(snapshot).toBe(JSON.stringify(session))
    })

    it('returns deterministic output for same session', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', now)

      const snap1 = createSessionSnapshot(session)
      const snap2 = createSessionSnapshot(session)

      expect(snap1).toBe(snap2)
    })
  })

  describe('hasSessionChanged', () => {
    it('returns false when snapshots are identical', () => {
      const snapshot = '{"sessionId":123}'

      expect(hasSessionChanged(snapshot, snapshot)).toBe(false)
    })

    it('returns true when snapshots differ', () => {
      const before = '{"sessionId":123}'
      const after = '{"sessionId":124}'

      expect(hasSessionChanged(before, after)).toBe(true)
    })

    it('detects changes in nested objects', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', now)
      const before = createSessionSnapshot(session)

      // Mutate a deeply nested field
      session.handState.hand1.teamA.red3s = 5
      const after = createSessionSnapshot(session)

      expect(hasSessionChanged(before, after)).toBe(true)
    })
  })
})
