import type { Gw2EndpointRunResult, Gw2SectionData } from '@/types/gw2'

import {
  createMetricCard,
  createSectionRecords,
  deriveSectionState,
  extractIconUrl,
  flattenPayloadEntries,
  getSectionResults,
} from '@/services/gw2/aggregators/helpers'
import {
  parseBankSlotEntries,
  parseItemDetails,
  parseMaterialCategoryEntries,
  parseAccountMaterialEntries,
} from '@/services/gw2/payloadParsers'

function countInventoryContainers(entries: unknown[]): number {
  let containerCount = 0

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) {
      continue
    }

    const record = entry as Record<string, unknown>
    if (Array.isArray(record.bags)) {
      containerCount += record.bags.length
      continue
    }

    if (typeof record.bagCount === 'number') {
      containerCount += record.bagCount
    }
  }

  return containerCount
}

export function aggregateInventories(
  allResults: Gw2EndpointRunResult[],
  hasKey: boolean,
): Gw2SectionData {
  const sectionResults = getSectionResults('Inventories', allResults)
  const itemDetailsResult = sectionResults.find(
    (result) => result.endpointId === 'inventory_item_details',
  )
  const characterInventoriesResult = sectionResults.find(
    (result) => result.endpointId === 'character_inventory_snapshots',
  )
  const accountBankResult = sectionResults.find((result) => result.endpointId === 'account_bank')
  const bankItemDetailsResult = sectionResults.find(
    (result) => result.endpointId === 'bank_item_details',
  )
  const materialCategoriesResult = sectionResults.find(
    (result) => result.endpointId === 'materials_categories',
  )
  const materialsDetailsResult = sectionResults.find(
    (result) => result.endpointId === 'materials_details',
  )
  const accountMaterialsResult = sectionResults.find(
    (result) => result.endpointId === 'account_materials',
  )

  const sampledItems = parseItemDetails(
    itemDetailsResult ? flattenPayloadEntries(itemDetailsResult.payload) : [],
  )
  const bankSlots = parseBankSlotEntries(
    accountBankResult ? flattenPayloadEntries(accountBankResult.payload) : [],
  )
  const bankItemDetails = parseItemDetails(
    bankItemDetailsResult ? flattenPayloadEntries(bankItemDetailsResult.payload) : [],
  )
  const materialCategories = parseMaterialCategoryEntries(
    materialCategoriesResult ? flattenPayloadEntries(materialCategoriesResult.payload) : [],
  )
  const materialsDetails = parseItemDetails(
    materialsDetailsResult ? flattenPayloadEntries(materialsDetailsResult.payload) : [],
  )
  const accountMaterials = parseAccountMaterialEntries(
    accountMaterialsResult ? flattenPayloadEntries(accountMaterialsResult.payload) : [],
  )
  const characterInventories = characterInventoriesResult
    ? flattenPayloadEntries(characterInventoriesResult.payload)
    : []
  const inventoryContainerCount = countInventoryContainers(characterInventories)
  const occupiedBankSlotCount = bankSlots.length
  const bankStackTotal = bankSlots.reduce((total, slot) => total + slot.count, 0)
  const bankItemById = new Map(bankItemDetails.map((item) => [item.id, item]))
  const bankRows = bankSlots.slice(0, 16).map((slot) => {
    const details = bankItemById.get(slot.id)
    const label = details?.name ?? `Item ${slot.id}`
    return `inventory bank row: #${slot.id} ${label} x${slot.count}`
  })

  const materialsDetailsById = new Map(materialsDetails.map((item) => [item.id, item]))
  const materialStackTotal = accountMaterials.reduce((total, mat) => total + mat.count, 0)
  const materialsWithDetails = accountMaterials.slice(0, 20).map((mat) => {
    const details = materialsDetailsById.get(mat.id)
    const label = details?.name ?? `Material ${mat.id}`
    return `inventory material row: #${mat.id} ${label} x${mat.count}`
  })

  const itemIconUrl = extractIconUrl(sampledItems)
  const bankItemIconUrl = extractIconUrl(bankItemDetails)
  const materialsIconUrl = extractIconUrl(materialsDetails)

  const records = [
    `inventory item details sampled: ${sampledItems.length}`,
    `character inventory payloads: ${characterInventories.length}`,
    `inventory containers sampled: ${inventoryContainerCount}`,
    `bank slots occupied: ${occupiedBankSlotCount}`,
    `bank stack total: ${bankStackTotal}`,
    `bank item details loaded: ${bankItemDetails.length}`,
    ...bankRows,
    `material categories loaded: ${materialCategories.length}`,
    `materials in catalog: ${materialsDetails.length}`,
    `account materials tracked: ${accountMaterials.length}`,
    `material stack total: ${materialStackTotal}`,
    ...materialsWithDetails,
    ...createSectionRecords(
      sectionResults.filter(
        (result) =>
          result.endpointId !== 'inventory_item_details' &&
          result.endpointId !== 'character_inventory_snapshots' &&
          result.endpointId !== 'account_bank' &&
          result.endpointId !== 'bank_item_details' &&
          result.endpointId !== 'materials_ids' &&
          result.endpointId !== 'materials_categories' &&
          result.endpointId !== 'materials_details' &&
          result.endpointId !== 'account_materials',
      ),
    ),
  ]

  const summary =
    occupiedBankSlotCount > 0 || accountMaterials.length > 0
      ? `Bank: ${occupiedBankSlotCount} occupied slot(s), Materials: ${accountMaterials.length} types tracked`
      : hasKey
        ? `${characterInventories.length} character inventory payload(s), ${inventoryContainerCount} container snapshot(s), Materials catalog ready with ${materialsDetails.length} items`
        : 'Bank and Materials require an API key with the inventories scope.'

  return {
    name: 'Inventories',
    state: deriveSectionState('Inventories', sectionResults, hasKey),
    summary,
    metrics: [
      createMetricCard(
        'inventory-item-sample-count',
        'Item Samples',
        sampledItems.length,
        'Public item detail samples available for inventory card metadata and icon lookups.',
        itemIconUrl,
        {
          tone: sampledItems.length > 0 ? 'good' : 'attention',
          badge: sampledItems.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'bank-occupied-slot-count',
        'Bank Occupied Slots',
        occupiedBankSlotCount,
        'Count of occupied account bank slots returned by /v2/account/bank.',
        bankItemIconUrl,
        {
          tone: occupiedBankSlotCount > 0 ? 'good' : 'attention',
          badge: occupiedBankSlotCount > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'bank-stack-total',
        'Bank Item Count',
        bankStackTotal,
        'Total stack count across occupied bank slots.',
        undefined,
        {
          tone: bankStackTotal > 0 ? 'good' : 'attention',
          badge: bankStackTotal > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'character-inventory-payload-count',
        'Inventory Payloads',
        characterInventories.length,
        'Character inventory snapshots ready for bag and slot-level rendering.',
        undefined,
        {
          tone: characterInventories.length > 0 ? 'good' : 'attention',
          badge: characterInventories.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'inventory-container-count',
        'Inventory Containers',
        inventoryContainerCount,
        'Combined bag/container count estimated from character inventory snapshots.',
        undefined,
        {
          tone: inventoryContainerCount > 0 ? 'good' : 'attention',
          badge: inventoryContainerCount > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'materials-categories-count',
        'Material Categories',
        materialCategories.length,
        'Crafting material storage categories available in the game.',
        undefined,
        {
          tone: materialCategories.length > 0 ? 'good' : 'attention',
          badge: materialCategories.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'materials-catalog-count',
        'Materials in Catalog',
        materialsDetails.length,
        'Total number of material items available across all categories.',
        materialsIconUrl,
        {
          tone: materialsDetails.length > 0 ? 'good' : 'attention',
          badge: materialsDetails.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'account-materials-count',
        'Account Materials Tracked',
        accountMaterials.length,
        'Number of distinct materials player has stored (including zero counts).',
        undefined,
        {
          tone: accountMaterials.length > 0 ? 'good' : 'attention',
          badge: accountMaterials.length > 0 ? 'Ready' : 'Needs Data',
        },
      ),
      createMetricCard(
        'material-stack-total',
        'Material Stack Total',
        materialStackTotal,
        'Combined count of all materials across storage.',
        undefined,
        {
          tone: materialStackTotal > 0 ? 'good' : 'attention',
          badge: materialStackTotal > 0 ? 'Ready' : 'Needs Data',
        },
      ),
    ],
    records,
  }
}
