import { computed } from 'vue'
import { defineStore } from 'pinia'

import { aggregateAllSections, createInitialSections } from '@/services/gw2/aggregators'
import { flattenPayloadEntries, getSectionResults } from '@/services/gw2/aggregators/helpers'
import { buildColorDetailsWithRelations } from '@/services/gw2/aggregators/colorDetails'
import { buildFinisherDetailsWithRelations } from '@/services/gw2/aggregators/finisherDetails'
import { buildMountDetailsWithRelations } from '@/services/gw2/aggregators/mountDetails'
import { buildMountsByType } from '@/services/gw2/aggregators/mountsByType'
import {
  getActiveAccountEndpoints,
  getActivePublicEndpoints,
} from '@/services/gw2/endpointManifest'
import {
  buildGw2ItemMapFromEndpointResults,
  type Gw2NormalizedItem,
} from '@/services/gw2/itemViewModel'
import {
  parseAccountMaterialEntries,
  parseBankSlotEntries,
  parseCurrencyMetadata,
  parseMaterialCategoryEntries,
  parseWalletEntries,
} from '@/services/gw2/payloadParsers'
import {
  useGw2AccountBatchQuery,
  useGw2InventoriesPublicQuery,
  useGw2ProgressionPublicQuery,
  useGw2UnlocksPublicQuery,
  useGw2WalletPublicQuery,
} from '@/queries/gw2Queries'
import { useGw2KeyStore } from '@/stores/gw2KeyStore'
import { GW2_SECTIONS } from '@/types/gw2'
import type { Gw2BootstrapState, Gw2EndpointRunResult, Gw2LifecycleStatus } from '@/types/gw2'

export const useGw2BootstrapStore = defineStore('gw2Bootstrap', () => {
  const keyStore = useGw2KeyStore()
  const SHARED_ITEM_ENDPOINT_IDS = [
    'finisher_unlock_item_details',
    'finisher_unlock_related_item_details',
    'materials_details',
    'materials_related_item_details',
    'bank_item_details',
    'bank_related_item_details',
    'inventory_item_details',
  ]

  function getEntriesForEndpoint(endpointId: string): unknown[] {
    return flattenPayloadEntries(
      allResults.value
        .filter((result) => result.endpointId === endpointId)
        .flatMap((result) => result.payload),
    )
  }

  function getRelationIds(item?: Gw2NormalizedItem): number[] {
    if (!item) {
      return []
    }

    const relationIds = new Set<number>()
    const upgradesInto = item.raw.upgrades_into
    if (Array.isArray(upgradesInto)) {
      for (const id of upgradesInto) {
        if (typeof id === 'number') {
          relationIds.add(id)
        }
      }
    }

    const upgradesFrom = item.raw.upgrades_from
    if (Array.isArray(upgradesFrom)) {
      for (const id of upgradesFrom) {
        if (typeof id === 'number') {
          relationIds.add(id)
        }
      }
    }

    return Array.from(relationIds)
  }

  const getActiveEndpointTotals = () => {
    const publicEndpoints = getActivePublicEndpoints()
    const accountEndpoints = getActiveAccountEndpoints()

    return {
      publicEndpoints,
      accountEndpoints,
      total: publicEndpoints.length + accountEndpoints.length,
    }
  }

  const walletPublicQuery = useGw2WalletPublicQuery()
  const unlocksPublicQuery = useGw2UnlocksPublicQuery()
  const inventoriesPublicQuery = useGw2InventoriesPublicQuery()
  const progressionPublicQuery = useGw2ProgressionPublicQuery()
  const accountBatchQuery = useGw2AccountBatchQuery()

  const endpointTotals = computed(() => getActiveEndpointTotals())
  const hasKey = computed(() => keyStore.apiKey.trim().length > 0)

  function getQueryResults(results: Gw2EndpointRunResult[] | undefined): Gw2EndpointRunResult[] {
    return Array.isArray(results) ? results : []
  }

  const publicResults = computed<Gw2EndpointRunResult[]>(() => [
    ...getQueryResults(walletPublicQuery.data.value),
    ...getQueryResults(unlocksPublicQuery.data.value),
    ...getQueryResults(inventoriesPublicQuery.data.value),
    ...getQueryResults(progressionPublicQuery.data.value),
  ])

  const accountResults = computed<Gw2EndpointRunResult[]>(() => {
    if (!keyStore.accountFetchRequested || !hasKey.value) {
      return []
    }

    return getQueryResults(accountBatchQuery.data.value)
  })

  const allResults = computed<Gw2EndpointRunResult[]>(() => [
    ...publicResults.value,
    ...accountResults.value,
  ])

  const endpointErrors = computed<Gw2BootstrapState['endpointErrors']>(() =>
    allResults.value
      .filter((result) => !result.ok)
      .map((result) => {
        const errorEntry: Gw2BootstrapState['endpointErrors'][number] = {
          endpoint: result.endpointId,
          message: result.error ?? 'Unknown endpoint error',
        }

        if (result.errorType) {
          errorEntry.errorType = result.errorType
        }

        if (result.requiredScopes) {
          errorEntry.requiredScopes = result.requiredScopes
        }

        return errorEntry
      }),
  )

  const sections = computed<Gw2BootstrapState['sections']>(() => {
    if (allResults.value.length === 0 && !hasKey.value) {
      return createInitialSections()
    }

    return aggregateAllSections(allResults.value, hasKey.value)
  })

  const progress = computed(() => ({
    completed: allResults.value.length,
    total: endpointTotals.value.total,
  }))

  const lifecycle = computed<Gw2LifecycleStatus>(() => {
    const publicLoading =
      walletPublicQuery.asyncStatus.value === 'loading' ||
      unlocksPublicQuery.asyncStatus.value === 'loading' ||
      inventoriesPublicQuery.asyncStatus.value === 'loading' ||
      progressionPublicQuery.asyncStatus.value === 'loading'

    if (publicLoading) {
      return 'loadingPublic'
    }

    if (
      hasKey.value &&
      keyStore.accountFetchRequested &&
      accountBatchQuery.asyncStatus.value === 'loading'
    ) {
      return 'loadingAccount'
    }

    if (endpointErrors.value.length > 0) {
      return 'partialError'
    }

    if (allResults.value.length > 0) {
      return 'complete'
    }

    return 'idle'
  })

  const activeSectionName = computed<Gw2BootstrapState['activeSectionName']>(() => undefined)

  const walletCurrencies = computed(() => {
    const sectionResults = getSectionResults('Wallet', allResults.value)
    const metadataResults = sectionResults.filter((r) => r.scope === 'public')
    const walletResults = sectionResults.filter((r) => r.scope === 'account')

    const currencies = parseCurrencyMetadata(
      flattenPayloadEntries(metadataResults.flatMap((r) => r.payload)),
    ).sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))

    const balanceById = new Map(
      parseWalletEntries(flattenPayloadEntries(walletResults.flatMap((r) => r.payload))).map(
        (entry) => [entry.id, entry.value],
      ),
    )

    return currencies.map((currency) => ({
      id: currency.id,
      name: currency.name ?? `Currency ${currency.id}`,
      description: currency.description,
      iconUrl: currency.iconUrl ?? currency.icon,
      balance: balanceById.get(currency.id) ?? null,
    }))
  })

  const itemDetailsById = computed(() =>
    buildGw2ItemMapFromEndpointResults(allResults.value, SHARED_ITEM_ENDPOINT_IDS),
  )

  const bankItems = computed(() => {
    const bankSlots = parseBankSlotEntries(getEntriesForEndpoint('account_bank'))

    return bankSlots.map((slot, index) => {
      const details = itemDetailsById.value.get(slot.id)

      return {
        slotIndex: index + 1,
        id: slot.id,
        count: slot.count,
        name: details?.name ?? `Item ${slot.id}`,
        description: details?.description,
        iconUrl: details?.iconUrl,
        type: details?.type,
        rarity: details?.rarity,
        level: details?.level,
        relatedItemIds: getRelationIds(details),
      }
    })
  })

  const materialItems = computed(() => {
    const materialCategories = parseMaterialCategoryEntries(
      getEntriesForEndpoint('materials_categories'),
    )
    const accountMaterials = parseAccountMaterialEntries(getEntriesForEndpoint('account_materials'))

    const categoryByItemId = new Map<number, { id: number; name?: string; order?: number }>()
    for (const category of materialCategories) {
      for (const itemId of category.items ?? []) {
        categoryByItemId.set(itemId, {
          id: category.id,
          name: category.name,
          order: category.order,
        })
      }
    }

    return accountMaterials
      .filter((material) => material.count > 0)
      .map((material) => {
        const details = itemDetailsById.value.get(material.id)
        const category = categoryByItemId.get(material.id)

        return {
          id: material.id,
          count: material.count,
          binding: material.binding,
          name: details?.name ?? `Material ${material.id}`,
          description: details?.description,
          iconUrl: details?.iconUrl,
          type: details?.type,
          rarity: details?.rarity,
          level: details?.level,
          categoryId: category?.id,
          categoryName: category?.name,
          categoryOrder: category?.order ?? Number.POSITIVE_INFINITY,
          relatedItemIds: getRelationIds(details),
        }
      })
      .sort((left, right) => {
        const categoryDelta = left.categoryOrder - right.categoryOrder
        if (categoryDelta !== 0) {
          return categoryDelta
        }

        return left.name.localeCompare(right.name)
      })
  })

  const orderedSections = computed(() =>
    GW2_SECTIONS.map((sectionName) => sections.value[sectionName]),
  )

  async function loadPublic() {
    await Promise.all([
      walletPublicQuery.refresh(),
      unlocksPublicQuery.refresh(),
      inventoriesPublicQuery.refresh(),
      progressionPublicQuery.refresh(),
    ])
  }

  async function loadLandingPublic() {
    console.log('[Bootstrap] loadLandingPublic starting...')
    await Promise.all([walletPublicQuery.refresh(), progressionPublicQuery.refresh()])
    console.log('[Bootstrap] loadLandingPublic done, unlocks data not loaded yet (in background)')
  }

  function prefetchRemainingPublicInBackground() {
    console.log('[Bootstrap] prefetchRemainingPublicInBackground starting...')
    void unlocksPublicQuery.refresh().then(() => {
      console.log('[Bootstrap] unlocks query completed')
    })
    void inventoriesPublicQuery.refresh().then(() => {
      console.log('[Bootstrap] inventories query completed')
    })
  }

  async function ensureUnlocksDataLoaded() {
    console.log('[Bootstrap] ensureUnlocksDataLoaded called')
    await unlocksPublicQuery.refresh()
    console.log('[Bootstrap] ensureUnlocksDataLoaded completed')
  }

  const finisherDetails = computed(() => buildFinisherDetailsWithRelations(allResults.value))

  const colorDetails = computed(() => buildColorDetailsWithRelations(allResults.value))

  const mountDetails = computed(() => buildMountDetailsWithRelations(allResults.value))

  const mountsByType = computed(() => buildMountsByType(allResults.value))

  async function setApiKey(key?: string) {
    const normalizedKey = key?.trim() ?? ''
    keyStore.setApiKey(normalizedKey)
    keyStore.setAccountFetchRequested(normalizedKey.length > 0)

    if (!normalizedKey) {
      return
    }

    await loadPublic()
    await accountBatchQuery.refresh()
  }

  function reset() {
    keyStore.reset()
  }

  return {
    apiKey: computed(() => keyStore.apiKey),
    allResults,
    lifecycle,
    progress,
    activeSectionName,
    endpointErrors,
    sections,
    orderedSections,
    walletCurrencies,
    itemDetailsById,
    bankItems,
    materialItems,
    colorDetails,
    finisherDetails,
    mountDetails,
    mountsByType,
    loadPublic,
    loadLandingPublic,
    prefetchRemainingPublicInBackground,
    ensureUnlocksDataLoaded,
    setApiKey,
    reset,
  }
})
