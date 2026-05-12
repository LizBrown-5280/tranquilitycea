import { afterEach, describe, expect, it, vi } from 'vitest'

import { executeEndpointBatch } from '@/services/gw2/orchestrator'
import type { Gw2EndpointDefinition } from '@/types/gw2'

function okResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response
}

function errorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as Response
}

describe('executeEndpointBatch', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('runs each endpoint mode and tracks request counts', async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = new URL(String(input))

      if (url.pathname === '/v2/build') {
        return okResponse({ build_id: 123 })
      }

      if (url.pathname === '/v2/achievements') {
        const ids = url.searchParams.get('ids')
        if (ids) {
          return okResponse([{ id: ids }])
        }

        const page = Number(url.searchParams.get('page') ?? '0')
        if (page === 0) {
          return okResponse([{ id: 1 }, { id: 2 }])
        }

        return okResponse([{ id: 3 }])
      }

      if (url.pathname === '/v2/items') {
        const ids = (url.searchParams.get('ids') ?? '')
          .split(',')
          .map((entry) => Number(entry))
          .filter((entry) => Number.isFinite(entry))

        return okResponse(
          ids.map((id) => {
            if (id === 100) {
              return { id, upgrades_into: [200], upgrades_from: [] }
            }

            if (id === 200) {
              return { id, upgrades_into: [300], upgrades_from: [100] }
            }

            if (id === 300) {
              return { id, upgrades_into: [], upgrades_from: [200] }
            }

            return { id, upgrades_into: [], upgrades_from: [] }
          }),
        )
      }

      if (url.pathname.startsWith('/v2/items/')) {
        const pathParts = url.pathname.split('/')
        return okResponse({ id: pathParts[pathParts.length - 1] })
      }

      if (url.pathname === '/v2/source-names') {
        return okResponse(['alpha', 'beta'])
      }

      if (url.pathname.startsWith('/v2/target/')) {
        const pathParts = url.pathname.split('/')
        return okResponse({ target: pathParts[pathParts.length - 1] })
      }

      return okResponse({})
    })

    vi.stubGlobal('fetch', fetchMock)

    const endpoints: Gw2EndpointDefinition[] = [
      {
        id: 'single_build',
        description: 'single mode sample',
        scope: 'public',
        section: 'Progression',
        mode: 'single',
        path: '/v2/build',
      },
      {
        id: 'csv_mode',
        description: 'csv ids sample',
        scope: 'public',
        section: 'Account Unlocks',
        mode: 'csvIds',
        path: '/v2/achievements',
        staticIds: [1, 2, 3],
        chunkSize: 2,
      },
      {
        id: 'paged_mode',
        description: 'paged sample',
        scope: 'public',
        section: 'Progression',
        mode: 'paged',
        path: '/v2/achievements',
        pageSize: 2,
        maxPages: 3,
      },
      {
        id: 'by_id_mode',
        description: 'by id sample',
        scope: 'public',
        section: 'Inventories',
        mode: 'byId',
        path: '/v2/items',
        staticIds: [10, 20],
      },
      {
        id: 'expand_seed',
        description: 'seed endpoint for expand mode',
        scope: 'account',
        section: 'Characters',
        mode: 'single',
        path: '/v2/source-names',
      },
      {
        id: 'expand_mode',
        description: 'expand from previous endpoint',
        scope: 'account',
        section: 'Characters',
        mode: 'expandFrom',
        path: '/v2/target',
        dependsOn: 'expand_seed',
        idPathTemplate: '/v2/target/{id}',
        extractIds: (dependencyPayload) => {
          const [names] = dependencyPayload
          return Array.isArray(names)
            ? names.filter((value): value is string => typeof value === 'string')
            : []
        },
      },
      {
        id: 'csv_from_mode',
        description: 'csv ids from dependency payload',
        scope: 'account',
        section: 'Inventories',
        mode: 'csvFrom',
        path: '/v2/achievements',
        dependsOn: 'expand_seed',
        chunkSize: 2,
        extractIds: (dependencyPayload) => {
          const [names] = dependencyPayload
          return Array.isArray(names)
            ? names.filter((value): value is string => typeof value === 'string')
            : []
        },
      },
      {
        id: 'graph_seed',
        description: 'seed endpoint for graph csv mode',
        scope: 'public',
        section: 'Inventories',
        mode: 'single',
        path: '/v2/build',
      },
      {
        id: 'csv_graph_from_mode',
        description: 'csv graph expansion mode',
        scope: 'public',
        section: 'Inventories',
        mode: 'csvGraphFrom',
        path: '/v2/items',
        dependsOn: 'graph_seed',
        chunkSize: 2,
        maxGraphDepth: 5,
        extractIds: (dependencyPayload) => {
          if (!Array.isArray(dependencyPayload[0])) {
            return [100]
          }

          const next = new Set<number>()
          for (const payloadEntry of dependencyPayload) {
            if (!Array.isArray(payloadEntry)) {
              continue
            }

            for (const item of payloadEntry) {
              if (typeof item !== 'object' || item === null) {
                continue
              }

              const record = item as Record<string, unknown>
              const upgradesInto = record.upgrades_into
              if (Array.isArray(upgradesInto)) {
                for (const value of upgradesInto) {
                  if (typeof value === 'number') {
                    next.add(value)
                  }
                }
              }

              const upgradesFrom = record.upgrades_from
              if (Array.isArray(upgradesFrom)) {
                for (const value of upgradesFrom) {
                  if (typeof value === 'number') {
                    next.add(value)
                  }
                }
              }
            }
          }

          return Array.from(next)
        },
      },
    ]

    const batchResult = await executeEndpointBatch(endpoints)

    expect(batchResult.results.map((result) => result.endpointId)).toEqual([
      'single_build',
      'csv_mode',
      'paged_mode',
      'by_id_mode',
      'expand_seed',
      'expand_mode',
      'csv_from_mode',
      'graph_seed',
      'csv_graph_from_mode',
    ])

    const requestCountByEndpoint = Object.fromEntries(
      batchResult.results.map((result) => [result.endpointId, result.requestCount]),
    )

    expect(requestCountByEndpoint).toEqual({
      single_build: 1,
      csv_mode: 2,
      paged_mode: 2,
      by_id_mode: 2,
      expand_seed: 1,
      expand_mode: 2,
      csv_from_mode: 1,
      graph_seed: 1,
      csv_graph_from_mode: 3,
    })

    expect(fetchMock).toHaveBeenCalledTimes(15)
  })

  it('marks endpoint as failed when payload parser rejects response shape', async () => {
    const fetchMock = vi.fn(async () => okResponse({ not: 'an array of names' }))
    vi.stubGlobal('fetch', fetchMock)

    const endpoints: Gw2EndpointDefinition[] = [
      {
        id: 'character_names',
        description: 'account character names endpoint',
        scope: 'account',
        section: 'Characters',
        mode: 'single',
        path: '/v2/characters',
      },
    ]

    const batchResult = await executeEndpointBatch(endpoints)
    const [endpointResult] = batchResult.results

    expect(endpointResult?.ok).toBe(false)
    expect(endpointResult?.error).toContain('Parser rejected payload')
    expect(endpointResult?.payload).toEqual([])
  })

  it('classifies 403 account endpoint failures as missingScope', async () => {
    const fetchMock = vi.fn(async () => errorResponse(403))
    vi.stubGlobal('fetch', fetchMock)

    const endpoints: Gw2EndpointDefinition[] = [
      {
        id: 'account_wallet',
        description: 'wallet endpoint',
        scope: 'account',
        section: 'Wallet',
        mode: 'single',
        path: '/v2/account/wallet',
        requiredScopes: ['wallet'],
      },
    ]

    const batchResult = await executeEndpointBatch(endpoints)
    const [endpointResult] = batchResult.results

    expect(endpointResult?.ok).toBe(false)
    expect(endpointResult?.errorType).toBe('missingScope')
    expect(endpointResult?.requiredScopes).toEqual(['wallet'])
  })

  it('treats account_upgrade_unlocks 404 as optional and non-fatal', async () => {
    const fetchMock = vi.fn(async () => errorResponse(404))
    vi.stubGlobal('fetch', fetchMock)

    const endpoints: Gw2EndpointDefinition[] = [
      {
        id: 'account_upgrade_unlocks',
        description: 'upgrade endpoint (optional contract)',
        scope: 'account',
        section: 'Account Unlocks',
        mode: 'single',
        path: '/v2/account/upgrades',
        requiredScopes: ['unlocks'],
      },
    ]

    const batchResult = await executeEndpointBatch(endpoints)
    const [endpointResult] = batchResult.results

    expect(endpointResult?.ok).toBe(true)
    expect(endpointResult?.payload).toEqual([])
    expect(endpointResult?.error).toBeUndefined()
  })

  it('treats account_pvp_hero_unlocks 404 as optional and non-fatal', async () => {
    const fetchMock = vi.fn(async () => errorResponse(404))
    vi.stubGlobal('fetch', fetchMock)

    const endpoints: Gw2EndpointDefinition[] = [
      {
        id: 'account_pvp_hero_unlocks',
        description: 'pvp heroes endpoint (optional contract)',
        scope: 'account',
        section: 'Account Unlocks',
        mode: 'single',
        path: '/v2/account/pvp/heroes',
        requiredScopes: ['unlocks'],
      },
    ]

    const batchResult = await executeEndpointBatch(endpoints)
    const [endpointResult] = batchResult.results

    expect(endpointResult?.ok).toBe(true)
    expect(endpointResult?.payload).toEqual([])
    expect(endpointResult?.error).toBeUndefined()
  })

  it('treats account_emote_unlocks 404 as optional and non-fatal', async () => {
    const fetchMock = vi.fn(async () => errorResponse(404))
    vi.stubGlobal('fetch', fetchMock)

    const endpoints: Gw2EndpointDefinition[] = [
      {
        id: 'account_emote_unlocks',
        description: 'emotes endpoint (optional contract)',
        scope: 'account',
        section: 'Account Unlocks',
        mode: 'single',
        path: '/v2/account/emotes',
        requiredScopes: ['unlocks'],
      },
    ]

    const batchResult = await executeEndpointBatch(endpoints)
    const [endpointResult] = batchResult.results

    expect(endpointResult?.ok).toBe(true)
    expect(endpointResult?.payload).toEqual([])
    expect(endpointResult?.error).toBeUndefined()
  })

  it('treats account_recipe_unlocks 404 as optional and non-fatal', async () => {
    const fetchMock = vi.fn(async () => errorResponse(404))
    vi.stubGlobal('fetch', fetchMock)

    const endpoints: Gw2EndpointDefinition[] = [
      {
        id: 'account_recipe_unlocks',
        description: 'recipes endpoint (optional contract)',
        scope: 'account',
        section: 'Account Unlocks',
        mode: 'single',
        path: '/v2/account/recipes',
        requiredScopes: ['unlocks'],
      },
    ]

    const batchResult = await executeEndpointBatch(endpoints)
    const [endpointResult] = batchResult.results

    expect(endpointResult?.ok).toBe(true)
    expect(endpointResult?.payload).toEqual([])
    expect(endpointResult?.error).toBeUndefined()
  })
})
