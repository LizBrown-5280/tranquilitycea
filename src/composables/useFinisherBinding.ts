import type { Gw2UnlockDetailItem } from '@/types/gw2'

function getBindingStatusFromFlags(flags: unknown): string {
  if (!Array.isArray(flags)) return ''
  const normalizedFlags = flags
    .filter((flag): flag is string => typeof flag === 'string' && flag.length > 0)
    .map((flag) => flag.toLowerCase())
  if (normalizedFlags.length === 0) return ''
  const flagSet = new Set(normalizedFlags)
  if (
    flagSet.has('soulbindonacquire') ||
    flagSet.has('soulbindonuse') ||
    flagSet.has('soulboundonacquire')
  )
    return 'Soulbound'
  if (
    flagSet.has('accountbound') ||
    flagSet.has('accountbindonuse') ||
    flagSet.has('accountboundonuse') ||
    flagSet.has('accountboundonacquire')
  )
    return 'Accountbound'
  return ''
}

export function resolveBindingStatus(item: Gw2UnlockDetailItem): string {
  const unlockItemIds = new Set<number>()
  const unlockItemsRaw = item.raw.unlock_items
  if (Array.isArray(unlockItemsRaw)) {
    for (const entry of unlockItemsRaw) {
      if (typeof entry === 'number' && Number.isFinite(entry)) {
        unlockItemIds.add(entry)
        continue
      }
      const parsed = parseInt(String(entry), 10)
      if (Number.isFinite(parsed)) {
        unlockItemIds.add(parsed)
      }
    }
  }
  if (unlockItemIds.size > 0 && Array.isArray(item.relatedItems)) {
    for (const relation of item.relatedItems) {
      for (const relatedItem of relation.items) {
        if (typeof relatedItem.id !== 'number' || !unlockItemIds.has(relatedItem.id)) continue
        const relatedStatus = getBindingStatusFromFlags(relatedItem.raw?.flags)
        if (relatedStatus) return relatedStatus
      }
    }
  }
  return getBindingStatusFromFlags(item.raw.flags)
}

export function getBindingStatus(
  item: Gw2UnlockDetailItem,
  withPlaceFallback: (item: Gw2UnlockDetailItem) => Gw2UnlockDetailItem,
  isPlaceFallbackTarget: (item: Gw2UnlockDetailItem) => boolean,
  secondPlaceFinisher: Gw2UnlockDetailItem | undefined,
): string {
  const displayItem = withPlaceFallback(item)
  if (isPlaceFallbackTarget(item) && secondPlaceFinisher) {
    const secondPlaceDisplayItem = withPlaceFallback(secondPlaceFinisher)
    return resolveBindingStatus(secondPlaceDisplayItem)
  }
  return resolveBindingStatus(displayItem)
}
