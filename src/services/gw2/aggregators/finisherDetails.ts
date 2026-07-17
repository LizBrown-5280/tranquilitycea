/**
 * Aggregator for finisher unlock details with unified hover model.
 * Combines catalog finishers with resolved related items (unlock_items).
 */

import { flattenPayloadEntries, getSectionResults } from '@/services/gw2/aggregators/helpers'
import {
  buildUnlockCategoryItems,
  type UnlockItemViewModel,
} from '@/services/gw2/unlockCategoryViewModel'
import { buildItemDetailsCache, buildUnlockDetailItem } from '@/services/gw2/unlockDetailBuilder'
import type { Gw2EndpointRunResult, Gw2UnlockDetailItem } from '@/types/gw2'

function getPrimaryUnlockItem(item: Gw2UnlockDetailItem): Gw2UnlockDetailItem | undefined {
  return item.relatedItems?.find((relation) => relation.relationName === 'Unlock Items')?.items[0]
}

function hydrateFromPrimaryUnlockItem(item: Gw2UnlockDetailItem): Gw2UnlockDetailItem {
  const primaryItem = getPrimaryUnlockItem(item)
  if (!primaryItem) {
    return item
  }

  return {
    ...item,
    description: primaryItem.description ?? item.description,
    iconUrl: primaryItem.iconUrl ?? item.iconUrl,
    type: primaryItem.type ?? item.type,
    rarity: primaryItem.rarity ?? item.rarity,
    level: primaryItem.level ?? item.level,
    vendorValue: primaryItem.vendorValue ?? item.vendorValue,
  }
}

/**
 * Builds finisher detail items with resolved unlock_items as related items.
 * Returns a structured list of finishers where each has related items populated.
 */
export function buildFinisherDetailsWithRelations(
  allResults: Gw2EndpointRunResult[],
): Gw2UnlockDetailItem[] {
  const sectionResults = getSectionResults('Account Unlocks', allResults)

  // Get the main finisher catalog
  const finisherCatalog = buildUnlockCategoryItems(allResults, {
    title: 'Finishers',
    catalogEndpoint: 'finisher_details',
    accountEndpoint: 'account_finisher_unlocks',
  })

  // Build cache of finisher item flags
  const finisherItemResult = sectionResults.find(
    (result) => result.endpointId === 'finisher_item_details',
  )
  const finisherItemsByIdMap = new Map<number, { flags?: Array<string>; id?: number | string }>()
  if (finisherItemResult) {
    for (const item of flattenPayloadEntries(finisherItemResult.payload)) {
      if (typeof item === 'object' && item !== null) {
        const record = item as Record<string, unknown>
        const id = record.id
        if (typeof id === 'number' || typeof id === 'string') {
          finisherItemsByIdMap.set(
            typeof id === 'string' ? parseInt(id, 10) : id,
            record as { flags?: Array<string>; id?: number | string },
          )
        }
      }
    }
  }

  // Build cache of unlock item details
  const unlockItemResult = sectionResults.find(
    (result) => result.endpointId === 'finisher_unlock_item_details',
  )
  const relatedItemsCache = buildItemDetailsCache(
    flattenPayloadEntries(unlockItemResult ? unlockItemResult.payload : []),
  )

  // Convert each finisher to unified detail item with relations
  return finisherCatalog.map((finisher) => {
    const finisherRaw = { ...(finisher.raw as Record<string, unknown>) }

    // Merge flags from finisher item details
    const finisherId = finisherRaw.id
    if (typeof finisherId === 'number') {
      const finisherItem = finisherItemsByIdMap.get(finisherId)
      if (finisherItem?.flags) {
        finisherRaw.flags = finisherItem.flags
      }
    }

    const item = buildUnlockDetailItem(
      finisherRaw,
      [
        {
          relationName: 'Unlock Items',
          sourceField: 'unlock_items',
          itemsCache: relatedItemsCache,
        },
      ],
      finisher.accountRaw,
    )

    item.owned = finisher.owned

    return hydrateFromPrimaryUnlockItem(item)
  })
}

/**
 * Similar to buildFinisherDetailsWithRelations but returns the legacy UnlockItemViewModel format.
 * For backward compatibility during the transition.
 */
export function buildFinisherItemsLegacy(
  allResults: Gw2EndpointRunResult[],
): UnlockItemViewModel[] {
  return buildUnlockCategoryItems(allResults, {
    title: 'Finishers',
    catalogEndpoint: 'finisher_details',
    accountEndpoint: 'account_finisher_unlocks',
  })
}
