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
