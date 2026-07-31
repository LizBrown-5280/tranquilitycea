/**
 * Builder for unified unlock detail items with resolved related items.
 * Takes catalog entries and related item data, normalizes them into a consistent hover model.
 */

import type { Gw2UnlockDetailItem } from '@/types/gw2'
import { sanitizeGw2Text } from '@/services/gw2/unlockCategoryViewModel'

interface ItemDetailsCache {
  byId: Map<string | number, Gw2UnlockDetailItem>
}

function coerceItemId(value: unknown): string | number | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}

function normalizeItemBasics(
  entry: Record<string, unknown>,
  accountRaw?: Record<string, unknown>,
): Gw2UnlockDetailItem {
  const id = coerceItemId(entry.id) ?? 0
  const name = typeof entry.name === 'string' ? sanitizeGw2Text(entry.name) : `Item ${id}`
  const description =
    typeof entry.description === 'string' ? sanitizeGw2Text(entry.description) : undefined
  const iconUrl =
    (typeof entry.icon === 'string' ? entry.icon : undefined) ||
    (typeof entry.icon_url === 'string' ? entry.icon_url : undefined) ||
    (typeof entry.icon_big === 'string' ? entry.icon_big : undefined)
  const type = typeof entry.type === 'string' ? entry.type : undefined
  const rarity = typeof entry.rarity === 'string' ? entry.rarity : undefined
  const level = typeof entry.level === 'number' ? entry.level : undefined
  const vendorValue = typeof entry.vendor_value === 'number' ? entry.vendor_value : undefined

  return {
    id,
    name,
    description,
    iconUrl,
    vendorValue,
    type,
    rarity,
    level,
    raw: entry,
    accountRaw,
  }
}

/**
 * Extracts numeric IDs from a field in an unlock item,
 * returns all numeric values found (handles arrays and nested structures).
 */
export function extractRelatedItemIds(value: unknown): number[] {
  const ids: number[] = []

  function traverse(val: unknown) {
    if (typeof val === 'number') {
      ids.push(val)
    } else if (Array.isArray(val)) {
      for (const entry of val) {
        traverse(entry)
      }
    }
  }

  traverse(value)
  return ids
}

/**
 * Builds a catalog detail item with optional related items resolved.
 *
 * @param catalogEntry - The main catalog item (e.g., finisher, mount)
 * @param relationConfigs - Array of { relationName, sourceField, itemsCache }
 * @returns A normalized Gw2UnlockDetailItem with relatedItems populated if any are found
 */
export function buildUnlockDetailItem(
  catalogEntry: Record<string, unknown>,
  relationConfigs?: Array<{
    relationName: string
    sourceField: string
    itemsCache: ItemDetailsCache
  }>,
  accountRaw?: Record<string, unknown>,
): Gw2UnlockDetailItem {
  const item = normalizeItemBasics(catalogEntry, accountRaw)

  if (!relationConfigs || relationConfigs.length === 0) {
    return item
  }

  const relatedItems: Array<{
    relationName: string
    items: Gw2UnlockDetailItem[]
  }> = []

  for (const config of relationConfigs) {
    const fieldValue = catalogEntry[config.sourceField]
    if (!fieldValue) {
      continue
    }

    const relatedIds = extractRelatedItemIds(fieldValue)
    if (relatedIds.length === 0) {
      continue
    }

    const resolvedItems: Gw2UnlockDetailItem[] = []
    for (const id of relatedIds) {
      const cached = config.itemsCache.byId.get(id)
      if (cached) {
        resolvedItems.push(cached)
      }
    }

    if (resolvedItems.length > 0) {
      relatedItems.push({
        relationName: config.relationName,
        items: resolvedItems,
      })
    }
  }

  if (relatedItems.length > 0) {
    item.relatedItems = relatedItems
  }

  return item
}

/**
 * Builds an item details cache from a flat array of item entries.
 */
export function buildItemDetailsCache(entries: unknown[]): ItemDetailsCache {
  const byId = new Map<string | number, Gw2UnlockDetailItem>()

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) {
      continue
    }

    const record = entry as Record<string, unknown>
    const id = coerceItemId(record.id)
    if (id === undefined) {
      continue
    }

    byId.set(id, normalizeItemBasics(record))
  }

  return { byId }
}
