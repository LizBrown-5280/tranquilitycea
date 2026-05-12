import { computed } from 'vue'
import { defineQuery, useQuery } from '@pinia/colada'

import {
  getActiveAccountEndpoints,
  getActiveEndpointProfileKey,
  getActivePublicEndpoints,
} from '@/services/gw2/endpointManifest'
import { executeEndpointBatch } from '@/services/gw2/orchestrator'
import {
  ACCOUNT_STALE_TIME_MS,
  getFreshAccountQueryCache,
  getFreshPublicQueryCache,
  PUBLIC_STALE_TIME_MS,
  setAccountQueryCache,
  setPublicQueryCache,
} from '@/services/gw2/queryCache'
import { useGw2KeyStore } from '@/stores/gw2KeyStore'
import type { Gw2EndpointRunResult, Gw2SectionName } from '@/types/gw2'

function definePublicSectionQuery(sectionName: Gw2SectionName, keySuffix: string, label: string) {
  return defineQuery(() =>
    useQuery<Gw2EndpointRunResult[]>({
      key: () => ['gw2', 'public', keySuffix, getActiveEndpointProfileKey()],
      staleTime: PUBLIC_STALE_TIME_MS,
      query: async () => {
        const cachedResults = getFreshPublicQueryCache(keySuffix, PUBLIC_STALE_TIME_MS)
        if (cachedResults) {
          return cachedResults
        }

        const profileKey = getActiveEndpointProfileKey()
        const sectionEndpoints = getActivePublicEndpoints().filter(
          (endpoint) => endpoint.section === sectionName,
        )

        if (sectionEndpoints.length === 0) {
          return []
        }

        const batch = await executeEndpointBatch(sectionEndpoints, {
          profileKey,
          label,
        })

        setPublicQueryCache(keySuffix, batch.results)

        return batch.results
      },
    }),
  )
}

export const useGw2WalletPublicQuery = definePublicSectionQuery('Wallet', 'wallet', 'public-wallet')
export const useGw2UnlocksPublicQuery = definePublicSectionQuery(
  'Account Unlocks',
  'account-unlocks',
  'public-account-unlocks',
)
export const useGw2InventoriesPublicQuery = definePublicSectionQuery(
  'Inventories',
  'inventories',
  'public-inventories',
)
export const useGw2ProgressionPublicQuery = definePublicSectionQuery(
  'Progression',
  'progression',
  'public-progression',
)

export const useGw2AccountBatchQuery = defineQuery(() => {
  const keyStore = useGw2KeyStore()
  const hasApiKey = computed(() => keyStore.apiKey.trim().length > 0)

  return useQuery<Gw2EndpointRunResult[]>({
    key: () => [
      'gw2',
      'account',
      getActiveEndpointProfileKey(),
      keyStore.apiKey,
      keyStore.accountFetchRequested,
    ],
    staleTime: ACCOUNT_STALE_TIME_MS,
    enabled: () => hasApiKey.value && keyStore.accountFetchRequested,
    query: async () => {
      const normalizedKey = keyStore.apiKey.trim()
      const cachedResults = getFreshAccountQueryCache(normalizedKey, ACCOUNT_STALE_TIME_MS)
      if (cachedResults) {
        return cachedResults
      }

      const profileKey = getActiveEndpointProfileKey()
      const batch = await executeEndpointBatch(getActiveAccountEndpoints(), {
        apiKey: normalizedKey,
        profileKey,
        label: 'account',
      })

      setAccountQueryCache(normalizedKey, batch.results)

      return batch.results
    },
  })
})
