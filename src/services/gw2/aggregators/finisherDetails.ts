/**
 * Aggregator for finisher unlock details with unified hover model.
 * Combines catalog finishers with resolved related items (unlock_items).
 */

import { flattenPayloadEntries, getSectionResults } from '@/services/gw2/aggregators/helpers'
import {
  buildUnlockCategoryItems,
  type UnlockItemViewModel,
} from '@/services/gw2/unlockCategoryViewModel'
import {
  buildItemDetailsCache,
  buildUnlockDetailItem,
  type Gw2UnlockDetailItem,
} from '@/services/gw2/unlockDetailBuilder'
import type { Gw2EndpointRunResult } from '@/types/gw2'

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

  // Build cache of unlock item details
  const unlockItemResult = sectionResults.find(
    (result) => result.endpointId === 'finisher_unlock_item_details',
  )
  const relatedItemsCache = buildItemDetailsCache(
    flattenPayloadEntries(unlockItemResult ? unlockItemResult.payload : []),
  )

  // Convert each finisher to unified detail item with relations
  return finisherCatalog.map((finisher) =>
    buildUnlockDetailItem(finisher.raw as Record<string, unknown>, [
      {
        relationName: 'Unlock Items',
        sourceField: 'unlock_items',
        itemsCache: relatedItemsCache,
      },
    ]),
  )
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
