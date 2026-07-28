import { describe, expect, it } from 'vitest'

import {
  SWIPE_MAX_PLAYERS,
  SWIPE_MIN_PLAYERS,
  SWIPE_SCORE_MAX,
  SWIPE_SCORE_MIN,
  createDefaultSwipePlayers,
  createEmptySwipeSessionEnvelope,
  normalizeSwipeScore,
  updateSwipePlayerName,
  updateSwipeSessionPlayers,
} from '@/types/swipe'
import { getTruncatedSwipeName } from '@/services/swipe/swipeConstants'

describe('swipe model helpers', () => {
  it('creates default session in setup mode with minimum players', () => {
    const session = createEmptySwipeSessionEnvelope(1000)

    expect(session.shellState).toBe('setup')
    expect(session.players).toHaveLength(SWIPE_MIN_PLAYERS)
    expect(session.currentRound).toBe(1)
    expect(session.currentStartingPlayerIndex).toBe(0)
    expect(session.winnerValueMode).toBe('zero')
    expect(session.isGameLocked).toBe(false)
    expect(Object.keys(session.scoresByRound)).toHaveLength(12)
  })

  it('clamps score values to 3-digit range', () => {
    expect(normalizeSwipeScore(SWIPE_SCORE_MAX + 100)).toBe(SWIPE_SCORE_MAX)
    expect(normalizeSwipeScore(SWIPE_SCORE_MIN - 100)).toBe(SWIPE_SCORE_MIN)
    expect(normalizeSwipeScore(12.9)).toBe(12)
  })

  it('resizes players while preserving existing score data for retained players', () => {
    const session = createEmptySwipeSessionEnvelope(2000)
    const expanded = updateSwipeSessionPlayers(session, SWIPE_MAX_PLAYERS)

    expanded.scoresByRound[1][expanded.players[0].id] = 25

    const shrunk = updateSwipeSessionPlayers(expanded, SWIPE_MIN_PLAYERS)

    expect(shrunk.players).toHaveLength(SWIPE_MIN_PLAYERS)
    expect(shrunk.scoresByRound[1][shrunk.players[0].id]).toBe(25)
  })

  it('updates player names with trimming', () => {
    const session = createEmptySwipeSessionEnvelope(3000)
    const playerId = session.players[0].id

    const updated = updateSwipePlayerName(session, playerId, '  Liz  ')

    expect(updated.players[0].name).toBe('Liz')
  })

  it('truncates long names with ellipsis for compact display', () => {
    expect(getTruncatedSwipeName('Alexandra', 4)).toBe('Alex...')
    expect(getTruncatedSwipeName('Mia', 4)).toBe('Mia')
  })

  it('builds default players within allowed range', () => {
    expect(createDefaultSwipePlayers(1)).toHaveLength(SWIPE_MIN_PLAYERS)
    expect(createDefaultSwipePlayers(99)).toHaveLength(SWIPE_MAX_PLAYERS)
  })
})
