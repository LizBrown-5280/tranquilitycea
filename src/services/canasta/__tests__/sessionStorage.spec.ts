import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deleteAllSessions,
  deleteSession,
  getSessionRetentionDays,
  loadAllSessions,
  loadSession,
  loadSessionIndex,
  pruneExpiredSessions,
  saveSession,
  setSessionRetentionDays,
} from '@/services/canasta/sessionStorage'
import { createEmptyCanastaSessionEnvelope } from '@/types/canasta'

// Mock localStorage implementation for testing
class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] ?? null
  }

  get length(): number {
    return Object.keys(this.store).length
  }
}

describe('sessionStorage', () => {
  let localStorageMock: LocalStorageMock

  beforeEach(() => {
    // Create new mock instance for each test
    localStorageMock = new LocalStorageMock()

    // Stub global localStorage with our mock
    vi.stubGlobal('localStorage', localStorageMock)
    vi.clearAllMocks()
  })

  describe('loadSessionIndex', () => {
    it('returns empty array when index does not exist', () => {
      expect(loadSessionIndex()).toEqual([])
    })

    it('returns index array if it exists', () => {
      localStorage.setItem('canasta:sessions:index', JSON.stringify([123, 456]))

      expect(loadSessionIndex()).toEqual([123, 456])
    })

    it('returns empty array if index is corrupted', () => {
      localStorage.setItem('canasta:sessions:index', 'invalid json {')

      expect(loadSessionIndex()).toEqual([])
    })

    it('returns empty array if index is not an array', () => {
      localStorage.setItem('canasta:sessions:index', JSON.stringify({ sessions: [123] }))

      expect(loadSessionIndex()).toEqual([])
    })

    it('returns empty array if index contains non-numeric values', () => {
      localStorage.setItem('canasta:sessions:index', JSON.stringify([123, 'abc', 456]))

      expect(loadSessionIndex()).toEqual([])
    })
  })

  describe('saveSession and loadSession', () => {
    it('saves and retrieves a session', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      saveSession(session)
      const loaded = loadSession(session.sessionId)

      expect(loaded).toEqual(session)
    })

    it('updates session index when saving', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      saveSession(session)
      const index = loadSessionIndex()

      expect(index).toContain(session.sessionId)
    })

    it('does not duplicate session IDs in index', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      saveSession(session)
      saveSession(session) // Save again
      const index = loadSessionIndex()

      expect(index.filter((id) => id === session.sessionId)).toHaveLength(1)
    })

    it('returns null for non-existent session', () => {
      expect(loadSession(999999)).toBeNull()
    })

    it('returns null if session data is corrupted', () => {
      localStorage.setItem('canasta:session:1000000', 'invalid json {')

      expect(loadSession(1000000)).toBeNull()
    })

    it('returns null if session is missing required fields', () => {
      localStorage.setItem('canasta:session:1000000', JSON.stringify({ sessionId: 1000000 }))

      expect(loadSession(1000000)).toBeNull()
    })

    it('overwrites existing session with same ID', () => {
      const session1 = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)
      const session2 = createEmptyCanastaSessionEnvelope('myTeamOnly', 1000000)

      saveSession(session1)
      saveSession(session2)

      const loaded = loadSession(1000000)
      expect(loaded?.sessionType).toBe('myTeamOnly')
    })
  })

  describe('loadAllSessions', () => {
    it('returns empty array when no sessions exist', () => {
      expect(loadAllSessions()).toEqual([])
    })

    it('returns all saved sessions', () => {
      const session1 = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)
      const session2 = createEmptyCanastaSessionEnvelope('myTeamOnly', 2000000)

      saveSession(session1)
      saveSession(session2)

      const loaded = loadAllSessions()
      expect(loaded).toHaveLength(2)
      expect(loaded.map((s) => s.sessionId)).toContain(1000000)
      expect(loaded.map((s) => s.sessionId)).toContain(2000000)
    })

    it('skips corrupted sessions silently', () => {
      const session1 = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      saveSession(session1)
      localStorage.setItem('canasta:session:2000000', 'invalid json {')

      // Manually add corrupted ID to index
      const index = loadSessionIndex()
      index.push(2000000)
      localStorage.setItem('canasta:sessions:index', JSON.stringify(index))

      const loaded = loadAllSessions()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]!.sessionId).toBe(1000000)
    })
  })

  describe('deleteSession', () => {
    it('removes session from storage', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      saveSession(session)
      expect(loadSession(1000000)).toBeTruthy()

      deleteSession(1000000)
      expect(loadSession(1000000)).toBeNull()
    })

    it('removes session ID from index', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      saveSession(session)
      const indexBefore = loadSessionIndex()
      expect(indexBefore).toContain(1000000)

      deleteSession(1000000)
      const indexAfter = loadSessionIndex()
      expect(indexAfter).not.toContain(1000000)
    })

    it('keeps other sessions intact', () => {
      const session1 = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)
      const session2 = createEmptyCanastaSessionEnvelope('myTeamOnly', 2000000)

      saveSession(session1)
      saveSession(session2)

      deleteSession(1000000)

      expect(loadSession(1000000)).toBeNull()
      expect(loadSession(2000000)).toBeTruthy()
    })

    it('handles deletion of non-existent session gracefully', () => {
      expect(() => deleteSession(999999)).not.toThrow()
    })
  })

  describe('deleteAllSessions', () => {
    it('removes all sessions from storage', () => {
      const session1 = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)
      const session2 = createEmptyCanastaSessionEnvelope('myTeamOnly', 2000000)

      saveSession(session1)
      saveSession(session2)

      deleteAllSessions()

      expect(loadSession(1000000)).toBeNull()
      expect(loadSession(2000000)).toBeNull()
    })

    it('clears the index', () => {
      const session = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      saveSession(session)
      expect(loadSessionIndex()).toHaveLength(1)

      deleteAllSessions()
      expect(loadSessionIndex()).toEqual([])
    })

    it('handles deletion when no sessions exist', () => {
      expect(() => deleteAllSessions()).not.toThrow()
      expect(loadSessionIndex()).toEqual([])
    })

    it('clears all canasta: keys from localStorage', () => {
      const session1 = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)
      const session2 = createEmptyCanastaSessionEnvelope('myTeamOnly', 2000000)

      saveSession(session1)
      saveSession(session2)

      // Verify keys exist before deletion
      expect(localStorage.getItem('canasta:sessions:index')).toBeTruthy()
      expect(localStorage.getItem('canasta:session:1000000')).toBeTruthy()
      expect(localStorage.getItem('canasta:session:2000000')).toBeTruthy()

      deleteAllSessions()

      // Verify all canasta keys are gone
      expect(localStorage.getItem('canasta:sessions:index')).toBeNull()
      expect(localStorage.getItem('canasta:session:1000000')).toBeNull()
      expect(localStorage.getItem('canasta:session:2000000')).toBeNull()
    })
  })

  describe('retention settings', () => {
    it('returns default retention when no value exists', () => {
      expect(getSessionRetentionDays()).toBe(90)
    })

    it('saves and loads a valid retention value', () => {
      const saved = setSessionRetentionDays(120)

      expect(saved).toBe(120)
      expect(getSessionRetentionDays()).toBe(120)
    })

    it('clamps retention below minimum to 7 days', () => {
      const saved = setSessionRetentionDays(1)

      expect(saved).toBe(7)
      expect(getSessionRetentionDays()).toBe(7)
    })

    it('clamps retention above maximum to 3650 days', () => {
      const saved = setSessionRetentionDays(9999)

      expect(saved).toBe(3650)
      expect(getSessionRetentionDays()).toBe(3650)
    })

    it('falls back to default when stored value is invalid', () => {
      localStorage.setItem('canasta:sessions:retentionDays', 'not-a-number')

      expect(getSessionRetentionDays()).toBe(90)
    })
  })

  describe('pruneExpiredSessions', () => {
    it('deletes sessions older than retention window', () => {
      const now = 2_000_000_000_000
      const withinWindow = createEmptyCanastaSessionEnvelope(
        'bothTeams',
        now - 10 * 24 * 60 * 60 * 1000,
      )
      const expired = createEmptyCanastaSessionEnvelope(
        'bothTeams',
        now - 120 * 24 * 60 * 60 * 1000,
      )

      saveSession(withinWindow)
      saveSession(expired)

      const deletedCount = pruneExpiredSessions(now, 90)

      expect(deletedCount).toBe(1)
      expect(loadSession(withinWindow.sessionId)).toBeTruthy()
      expect(loadSession(expired.sessionId)).toBeNull()
    })

    it('keeps sessions exactly at cutoff timestamp', () => {
      const now = 2_000_000_000_000
      const atCutoff = createEmptyCanastaSessionEnvelope(
        'bothTeams',
        now - 90 * 24 * 60 * 60 * 1000,
      )

      saveSession(atCutoff)

      const deletedCount = pruneExpiredSessions(now, 90)

      expect(deletedCount).toBe(0)
      expect(loadSession(atCutoff.sessionId)).toBeTruthy()
    })

    it('uses configured retention by default when no retention arg is passed', () => {
      const now = 2_000_000_000_000
      setSessionRetentionDays(30)

      const fresh = createEmptyCanastaSessionEnvelope('bothTeams', now - 20 * 24 * 60 * 60 * 1000)
      const stale = createEmptyCanastaSessionEnvelope('bothTeams', now - 40 * 24 * 60 * 60 * 1000)

      saveSession(fresh)
      saveSession(stale)

      const deletedCount = pruneExpiredSessions(now)

      expect(deletedCount).toBe(1)
      expect(loadSession(fresh.sessionId)).toBeTruthy()
      expect(loadSession(stale.sessionId)).toBeNull()
    })
  })

  describe('error handling', () => {
    it('logs error but does not throw when save fails', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a mock that throws on setItem
      const throwingMock = new LocalStorageMock()
      const setItemSpy = vi.spyOn(throwingMock, 'setItem').mockImplementation(() => {
        throw new Error('Storage full')
      })

      vi.stubGlobal('localStorage', throwingMock)

      const session = createEmptyCanastaSessionEnvelope('bothTeams', 1000000)

      expect(() => saveSession(session)).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      setItemSpy.mockRestore()
    })

    it('logs error but does not throw when delete fails', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Create a mock that throws on removeItem
      const throwingMock = new LocalStorageMock()
      const removeItemSpy = vi.spyOn(throwingMock, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      vi.stubGlobal('localStorage', throwingMock)

      expect(() => deleteSession(1000000)).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      removeItemSpy.mockRestore()
    })
  })
})
