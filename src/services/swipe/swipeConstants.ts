import type { SwipeWinDirection } from '@/types/swipe'

export type SwipeRankTier = 'first' | 'second' | 'third' | 'neutral'

/**
 * Standard competition ranking: tied totals share a rank and the next rank skips ahead.
 */
export function getSwipeRanksByPlayer(
  playerIds: string[],
  totalsByPlayer: Record<string, number>,
  direction: SwipeWinDirection,
): Record<string, number> {
  const sortedPlayerIds = [...playerIds].sort((firstId, secondId) => {
    const difference = (totalsByPlayer[firstId] ?? 0) - (totalsByPlayer[secondId] ?? 0)
    return direction === 'highest' ? -difference : difference
  })

  const ranksByPlayer: Record<string, number> = {}
  let previousTotal: number | null = null
  let previousRank = 0

  sortedPlayerIds.forEach((playerId, index) => {
    const total = totalsByPlayer[playerId] ?? 0

    if (previousTotal !== null && total === previousTotal) {
      ranksByPlayer[playerId] = previousRank
      return
    }

    previousRank = index + 1
    previousTotal = total
    ranksByPlayer[playerId] = previousRank
  })

  return ranksByPlayer
}

export function getSwipeRankTier(rank: number): SwipeRankTier {
  if (rank === 1) return 'first'
  if (rank === 2) return 'second'
  if (rank === 3) return 'third'
  return 'neutral'
}

export function cloneSwipeSessionState<T>(source: T): T {
  return JSON.parse(JSON.stringify(source)) as T
}

export function getSwipeDisplayName(name: string, fallbackIndex: number): string {
  const normalized = name.trim()
  return normalized.length > 0 ? normalized : `P${fallbackIndex + 1}`
}

export function getTruncatedSwipeName(name: string, maxChars = 4): string {
  const normalized = name.trim()
  if (normalized.length <= maxChars) {
    return normalized
  }

  return `${normalized.slice(0, maxChars)}...`
}

export function hasMinimumNamedPlayers(names: string[], minCount: number): boolean {
  const nonEmptyCount = names.filter((name) => name.trim().length > 0).length
  return nonEmptyCount >= minCount
}
