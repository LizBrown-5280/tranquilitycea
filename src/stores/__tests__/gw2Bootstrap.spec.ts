import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'
import type { Gw2EndpointBatchResult } from '@/types/gw2'

vi.mock('@/services/gw2/endpointManifest', () => ({
  PUBLIC_ENDPOINTS: [
    {
      id: 'build_info',
      description: 'public endpoint',
      scope: 'public',
      section: 'Progression',
      mode: 'single',
      path: '/v2/build',
    },
  ],
  ACCOUNT_ENDPOINTS: [
    {
      id: 'wallet_info',
      description: 'account endpoint',
      scope: 'account',
      section: 'Wallet',
      mode: 'single',
      path: '/v2/account/wallet',
    },
  ],
}))

const mockExecutePublicEndpointBatch = vi.fn<() => Promise<Gw2EndpointBatchResult>>()
const mockExecuteEndpointBatch =
  vi.fn<
    (
      endpoints: unknown[],
      options: { apiKey?: string; payloadByEndpoint?: Record<string, unknown[]> },
    ) => Promise<Gw2EndpointBatchResult>
  >()

vi.mock('@/services/gw2/orchestrator', () => ({
  executePublicEndpointBatch: () => mockExecutePublicEndpointBatch(),
  executeEndpointBatch: (
    endpoints: unknown[],
    options: { apiKey?: string; payloadByEndpoint?: Record<string, unknown[]> },
  ) => mockExecuteEndpointBatch(endpoints, options),
}))

describe('useGw2BootstrapStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('marks account-heavy sections as locked when no key is supplied', async () => {
    mockExecutePublicEndpointBatch.mockResolvedValue({
      results: [
        {
          endpointId: 'build_info',
          section: 'Progression',
          scope: 'public',
          mode: 'single',
          ok: true,
          requestCount: 1,
          payload: [{ build_id: 1 }],
        },
      ],
      payloadByEndpoint: {
        build_info: [{ build_id: 1 }],
      },
    })

    const store = useGw2BootstrapStore()
    await store.loadWithOptionalKey('')

    expect(store.sections.Characters.state).toBe('locked/no-key')
    expect(store.sections.Wallet.state).toBe('empty')
    expect(store.sections.Progression.state).toBe('available')
    expect(store.lifecycle).toBe('complete')
    expect(store.activeSectionName).toBeUndefined()
    expect(mockExecuteEndpointBatch).not.toHaveBeenCalled()
  })

  it('emits partialError when account phase has endpoint failures', async () => {
    mockExecutePublicEndpointBatch.mockResolvedValue({
      results: [
        {
          endpointId: 'build_info',
          section: 'Progression',
          scope: 'public',
          mode: 'single',
          ok: true,
          requestCount: 1,
          payload: [{ build_id: 1 }],
        },
      ],
      payloadByEndpoint: {
        build_info: [{ build_id: 1 }],
      },
    })

    mockExecuteEndpointBatch.mockResolvedValue({
      results: [
        {
          endpointId: 'wallet_info',
          section: 'Wallet',
          scope: 'account',
          mode: 'single',
          ok: false,
          requestCount: 1,
          payload: [],
          error: '401 Unauthorized',
          errorType: 'invalidKey',
          requiredScopes: ['wallet'],
        },
      ],
      payloadByEndpoint: {
        wallet_info: [],
      },
    })

    const store = useGw2BootstrapStore()
    await store.loadWithOptionalKey('secret-key')

    expect(store.lifecycle).toBe('partialError')
    expect(store.endpointErrors).toEqual([
      {
        endpoint: 'wallet_info',
        message: '401 Unauthorized',
        errorType: 'invalidKey',
        requiredScopes: ['wallet'],
      },
    ])
    expect(store.activeSectionName).toBeUndefined()
    expect(store.sections.Wallet.state).toBe('partial')
  })
})
