import { flattenPayloadEntries, getSectionResults } from '@/services/gw2/aggregators/helpers'
import { buildUnlockCategoryItems } from '@/services/gw2/unlockCategoryViewModel'
import { buildItemDetailsCache, buildUnlockDetailItem } from '@/services/gw2/unlockDetailBuilder'
import type { Gw2EndpointRunResult, Gw2UnlockDetailItem } from '@/types/gw2'

function getPrimaryItemDetail(item: Gw2UnlockDetailItem): Gw2UnlockDetailItem | undefined {
  return item.relatedItems?.find((relation) => relation.relationName === 'Item')?.items[0]
}

function hydrateFromPrimaryItem(item: Gw2UnlockDetailItem): Gw2UnlockDetailItem {
  const primaryItem = getPrimaryItemDetail(item)
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

export function buildColorDetailsWithRelations(
  allResults: Gw2EndpointRunResult[],
): Gw2UnlockDetailItem[] {
  const sectionResults = getSectionResults('Account Unlocks', allResults)

  const colorCatalog = buildUnlockCategoryItems(allResults, {
    title: 'Dyes',
    catalogEndpoint: 'dye_catalog_details',
    accountEndpoint: 'account_dye_unlocks',
  })

  const colorItemResult = sectionResults.find((result) => result.endpointId === 'dye_item_details')
  const itemCache = buildItemDetailsCache(
    flattenPayloadEntries(colorItemResult ? colorItemResult.payload : []),
  )

  return colorCatalog.map((color) => {
    const item = buildUnlockDetailItem(
      color.raw as Record<string, unknown>,
      [
        {
          relationName: 'Item',
          sourceField: 'item',
          itemsCache: itemCache,
        },
      ],
      color.accountRaw,
    )
    item.owned = color.owned
    return hydrateFromPrimaryItem(item)
  })
}
