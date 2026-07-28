export type SwipeSessionShellState = 'setup' | 'tracker'

export type SwipeWinnerValueMode = 'zero' | 'minusTen'

export interface SwipePlayer {
  id: string
  name: string
}

export type SwipeScoresByRound = Record<number, Record<string, number | null>>

export const SWIPE_MIN_PLAYERS = 3
export const SWIPE_MAX_PLAYERS = 8
export const SWIPE_TOTAL_ROUNDS = 12
export const SWIPE_SCORE_MIN = -999
export const SWIPE_SCORE_MAX = 999

/**
 * Represents a complete Swipe session with metadata.
 * Persisted to localStorage for session recovery.
 */
export interface SwipeSessionEnvelope {
  /** Unix timestamp in milliseconds when session was created. Used as session ID. */
  sessionId: number
  /** Unix timestamp in milliseconds when session was created. */
  createdAt: number
  /** Unix timestamp in milliseconds when session was last modified. */
  updatedAt: number
  /** Current session shell stage. */
  shellState: SwipeSessionShellState
  /** Player list in clockwise order, starting with first player. */
  players: SwipePlayer[]
  /** Active round number (1-12). */
  currentRound: number
  /** Index of player currently going first for this round. */
  currentStartingPlayerIndex: number
  /** Winner score mode for winner chip autofill. */
  winnerValueMode: SwipeWinnerValueMode
  /** Prevents score edits after game completion until manually unlocked. */
  isGameLocked: boolean
  /** Stores the round the game was ended early from, if applicable. */
  endedEarlyRound?: number | null
  /** Score matrix keyed by round number and then playerId. */
  scoresByRound: SwipeScoresByRound
  /** Schema version for future migrations. */
  schemaVersion: number
}

function normalizePlayerName(value: string): string {
  return value.trim()
}

export function normalizeSwipeScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  const normalized = Math.trunc(value)
  return Math.max(SWIPE_SCORE_MIN, Math.min(SWIPE_SCORE_MAX, normalized))
}

export function clampSwipePlayerCount(count: number): number {
  const normalized = Math.trunc(count)
  return Math.max(SWIPE_MIN_PLAYERS, Math.min(SWIPE_MAX_PLAYERS, normalized))
}

export function createDefaultSwipePlayers(count: number = SWIPE_MIN_PLAYERS): SwipePlayer[] {
  const safeCount = clampSwipePlayerCount(count)
  return Array.from({ length: safeCount }, (_, index) => ({
    id: `p${index + 1}`,
    name: '',
  }))
}

export function createEmptySwipeScoresByRound(players: SwipePlayer[]): SwipeScoresByRound {
  const scoresByRound: SwipeScoresByRound = {}

  for (let round = 1; round <= SWIPE_TOTAL_ROUNDS; round += 1) {
    const roundScores: Record<string, number | null> = {}
    for (const player of players) {
      roundScores[player.id] = null
    }
    scoresByRound[round] = roundScores
  }

  return scoresByRound
}

export function updateSwipeSessionPlayers(
  session: SwipeSessionEnvelope,
  requestedCount: number,
): SwipeSessionEnvelope {
  const nextCount = clampSwipePlayerCount(requestedCount)
  const existingPlayers = session.players
  const nextPlayers = existingPlayers.slice(0, nextCount)

  for (let index = nextPlayers.length; index < nextCount; index += 1) {
    nextPlayers.push({ id: `p${index + 1}`, name: '' })
  }

  const nextScoresByRound: SwipeScoresByRound = {}
  for (let round = 1; round <= SWIPE_TOTAL_ROUNDS; round += 1) {
    const previousRoundScores = session.scoresByRound[round] ?? {}
    const nextRoundScores: Record<string, number | null> = {}

    for (const player of nextPlayers) {
      const previousValue = previousRoundScores[player.id]
      nextRoundScores[player.id] =
        typeof previousValue === 'number' ? normalizeSwipeScore(previousValue) : null
    }

    nextScoresByRound[round] = nextRoundScores
  }

  const nextStartingPlayerIndex = Math.min(
    session.currentStartingPlayerIndex,
    Math.max(nextPlayers.length - 1, 0),
  )

  return {
    ...session,
    players: nextPlayers,
    scoresByRound: nextScoresByRound,
    currentStartingPlayerIndex: nextStartingPlayerIndex,
    updatedAt: Date.now(),
  }
}

export function updateSwipePlayerName(
  session: SwipeSessionEnvelope,
  playerId: string,
  name: string,
): SwipeSessionEnvelope {
  return {
    ...session,
    players: session.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            name: normalizePlayerName(name),
          }
        : player,
    ),
    updatedAt: Date.now(),
  }
}

/** Create a new Swipe session envelope in setup mode. */
export function createEmptySwipeSessionEnvelope(now: number = Date.now()): SwipeSessionEnvelope {
  const players = createDefaultSwipePlayers()

  return {
    sessionId: now,
    createdAt: now,
    updatedAt: now,
    shellState: 'setup',
    players,
    currentRound: 1,
    currentStartingPlayerIndex: 0,
    winnerValueMode: 'zero',
    isGameLocked: false,
    endedEarlyRound: null,
    scoresByRound: createEmptySwipeScoresByRound(players),
    schemaVersion: 3,
  }
}
