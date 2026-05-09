import { computed } from 'vue'
import { defineStore } from 'pinia'

import { aggregateAllSections, createInitialSections } from '@/services/gw2/aggregators'
import { flattenPayloadEntries, getSectionResults } from '@/services/gw2/aggregators/helpers'
import {
  getActiveAccountEndpoints,
  getActivePublicEndpoints,
} from '@/services/gw2/endpointManifest'
import { parseCurrencyMetadata, parseWalletEntries } from '@/services/gw2/payloadParsers'
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
    lifecycle,
    progress,
    activeSectionName,
    endpointErrors,
    sections,
    orderedSections,
    walletCurrencies,
    loadPublic,
    setApiKey,
    reset,
  }
})
