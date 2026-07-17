import type { Gw2UnlockDetailItem } from '@/types/gw2'

const SECOND_PLACE_FINISHER_NAME = 'Second Place Trophy Finisher'

function replaceSecondWithOrdinal(
  value: string | undefined,
  ordinal: 'First' | 'Third',
): string | undefined {
  if (!value) return value
  return value.replace(/\bSecond\b/g, ordinal).replace(/\bsecond\b/g, ordinal.toLowerCase())
}

function getPlaceOrdinal(item: Gw2UnlockDetailItem): 'First' | 'Third' | undefined {
  const normalizedName = item.name.trim().toLowerCase()
  if (normalizedName === 'first place trophy finisher') return 'First'
  if (normalizedName === 'third place trophy finisher') return 'Third'
  return undefined
}

function isPlaceFallbackTarget(item: Gw2UnlockDetailItem): boolean {
  const normalizedName = item.name.trim().toLowerCase()
  return (
    normalizedName === 'first place trophy finisher' ||
    normalizedName === 'third place trophy finisher'
  )
}

function normalizeRelatedItemsText(
  relatedItems: Gw2UnlockDetailItem['relatedItems'],
  ordinal: 'First' | 'Third' | undefined,
): Gw2UnlockDetailItem['relatedItems'] {
  if (!relatedItems || !ordinal) return relatedItems
  return relatedItems.map((relation) => ({
    ...relation,
    items: relation.items.map((relatedItem) => ({
      ...relatedItem,
      name: replaceSecondWithOrdinal(relatedItem.name, ordinal) ?? relatedItem.name,
      description: replaceSecondWithOrdinal(relatedItem.description, ordinal),
    })),
  }))
}

export function withPlaceFallback(
  item: Gw2UnlockDetailItem,
  secondPlaceFinisher: Gw2UnlockDetailItem | undefined,
): Gw2UnlockDetailItem {
  if (!isPlaceFallbackTarget(item)) return item
  const source = secondPlaceFinisher
  if (!source || source.id === item.id) return item
  const ordinal = getPlaceOrdinal(item)
  const normalizedDescription =
    ordinal && !item.description
      ? replaceSecondWithOrdinal(source.description, ordinal)
      : item.description
  const baseRelatedItems =
    item.relatedItems && item.relatedItems.length > 0 ? item.relatedItems : source.relatedItems
  const normalizedRelatedItems = normalizeRelatedItemsText(baseRelatedItems, ordinal)
  return {
    ...item,
    description: normalizedDescription,
    iconUrl: item.iconUrl ?? source.iconUrl,
    type: item.type ?? source.type,
    rarity: item.rarity ?? source.rarity,
    level: item.level ?? source.level,
    raw: {
      ...source.raw,
      ...item.raw,
    },
    relatedItems: normalizedRelatedItems,
  }
}

export function findSecondPlaceFinisher(
  items: Gw2UnlockDetailItem[],
): Gw2UnlockDetailItem | undefined {
  return items.find((item) => item.name === SECOND_PLACE_FINISHER_NAME)
}
