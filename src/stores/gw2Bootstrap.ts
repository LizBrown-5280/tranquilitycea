import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { aggregateAllSections, createInitialSections } from '@/services/gw2/aggregators'
import { ACCOUNT_ENDPOINTS, PUBLIC_ENDPOINTS } from '@/services/gw2/endpointManifest'
import { executeEndpointBatch, executePublicEndpointBatch } from '@/services/gw2/orchestrator'
import { GW2_SECTIONS } from '@/types/gw2'
import type { Gw2BootstrapState, Gw2LifecycleStatus } from '@/types/gw2'

export const useGw2BootstrapStore = defineStore('gw2Bootstrap', () => {
  const lifecycle = ref<Gw2LifecycleStatus>('idle')
  const progress = ref({ completed: 0, total: PUBLIC_ENDPOINTS.length + ACCOUNT_ENDPOINTS.length })
  const activeSectionName = ref<Gw2BootstrapState['activeSectionName']>(undefined)
  const endpointErrors = ref<Gw2BootstrapState['endpointErrors']>([])
  const sections = ref<Gw2BootstrapState['sections']>(createInitialSections())

  const orderedSections = computed(() =>
    GW2_SECTIONS.map((sectionName) => sections.value[sectionName]),
  )

  async function loadPublic() {
    lifecycle.value = 'loadingPublic'
    activeSectionName.value = undefined
    progress.value = { completed: 0, total: PUBLIC_ENDPOINTS.length + ACCOUNT_ENDPOINTS.length }
    endpointErrors.value = []

    const publicBatch = await executePublicEndpointBatch()

    progress.value = {
      completed: publicBatch.results.length,
      total: PUBLIC_ENDPOINTS.length + ACCOUNT_ENDPOINTS.length,
    }

    endpointErrors.value = publicBatch.results
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
      })

    sections.value = aggregateAllSections(publicBatch.results, false)

    lifecycle.value = endpointErrors.value.length > 0 ? 'partialError' : 'complete'

    return publicBatch
  }

  async function loadWithOptionalKey(key?: string) {
    const publicBatch = await loadPublic()

    if (!key || !key.trim()) {
      return
    }

    lifecycle.value = 'loadingAccount'

    const allResults = [...publicBatch.results]
    const payloadByEndpoint: Record<string, unknown[]> = {
      ...publicBatch.payloadByEndpoint,
    }

    for (const endpoint of ACCOUNT_ENDPOINTS) {
      activeSectionName.value = endpoint.section

      const batch = await executeEndpointBatch([endpoint], {
        apiKey: key,
        payloadByEndpoint,
      })

      allResults.push(...batch.results)
      Object.assign(payloadByEndpoint, batch.payloadByEndpoint)

      progress.value = {
        completed: allResults.length,
        total: PUBLIC_ENDPOINTS.length + ACCOUNT_ENDPOINTS.length,
      }

      endpointErrors.value = allResults
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
        })

      sections.value = aggregateAllSections(allResults, true)
    }

    activeSectionName.value = undefined
    lifecycle.value = endpointErrors.value.length > 0 ? 'partialError' : 'complete'
  }

  function reset() {
    lifecycle.value = 'idle'
    activeSectionName.value = undefined
    progress.value = { completed: 0, total: PUBLIC_ENDPOINTS.length + ACCOUNT_ENDPOINTS.length }
    endpointErrors.value = []
    sections.value = createInitialSections()
  }

  return {
    lifecycle,
    progress,
    activeSectionName,
    endpointErrors,
    sections,
    orderedSections,
    loadPublic,
    loadWithOptionalKey,
    reset,
  }
})
