import { computed, ref, shallowRef } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'
import type { Gw2EndpointRunResult } from '@/types/gw2'

type AsyncStatus = 'idle' | 'loading'

interface MockGw2Query {
  data: ReturnType<typeof shallowRef<Gw2EndpointRunResult[] | undefined>>
  asyncStatus: ReturnType<typeof computed<AsyncStatus>>
  refresh: ReturnType<typeof vi.fn>
  refetch: ReturnType<typeof vi.fn>
  loading: ReturnType<typeof ref<boolean>>
}

function createWritableComputed<T>(getter: () => T) {
  return computed(getter) as ReturnType<typeof computed<T>> & { value: T }
}

function createMockQuery(initialData: Gw2EndpointRunResult[] = []): MockGw2Query {
  const loading = ref(false)
  const data = shallowRef<Gw2EndpointRunResult[] | undefined>(initialData)

  return {
    data,
    loading,
    asyncStatus: createWritableComputed(() => (loading.value ? 'loading' : 'idle')),
    refresh: vi.fn(async () => ({ status: 'success', data: data.value, error: null })),
    refetch: vi.fn(async () => ({ status: 'success', data: data.value, error: null })),
  }
}

const walletPublicQuery = createMockQuery()
const unlocksPublicQuery = createMockQuery()
const inventoriesPublicQuery = createMockQuery()
const progressionPublicQuery = createMockQuery()
const accountBatchQuery = createMockQuery()

vi.mock('@/queries/gw2Queries', () => ({
  useGw2WalletPublicQuery: () => walletPublicQuery,
  useGw2UnlocksPublicQuery: () => unlocksPublicQuery,
  useGw2InventoriesPublicQuery: () => inventoriesPublicQuery,
  useGw2ProgressionPublicQuery: () => progressionPublicQuery,
  useGw2AccountBatchQuery: () => accountBatchQuery,
}))

vi.mock('@/services/gw2/endpointManifest', () => ({
  getActivePublicEndpoints: () => [
    {
      id: 'build_info',
      description: 'public endpoint',
      scope: 'public',
      section: 'Progression',
      mode: 'single',
      path: '/v2/build',
    },
  ],
  getActiveAccountEndpoints: () => [
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

describe('useGw2BootstrapStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    walletPublicQuery.data.value = []
    unlocksPublicQuery.data.value = []
    inventoriesPublicQuery.data.value = []
    progressionPublicQuery.data.value = []
    accountBatchQuery.data.value = []

    walletPublicQuery.loading.value = false
    unlocksPublicQuery.loading.value = false
    inventoriesPublicQuery.loading.value = false
    progressionPublicQuery.loading.value = false
    accountBatchQuery.loading.value = false

    walletPublicQuery.refresh.mockClear()
    unlocksPublicQuery.refresh.mockClear()
    inventoriesPublicQuery.refresh.mockClear()
    progressionPublicQuery.refresh.mockClear()
    accountBatchQuery.refresh.mockClear()
  })

  it('marks account-heavy sections as locked when no key is supplied', () => {
    progressionPublicQuery.data.value = [
      {
        endpointId: 'build_info',
        section: 'Progression',
        scope: 'public',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [{ build_id: 1 }],
      },
    ]

    const store = useGw2BootstrapStore()

    expect(store.sections.Characters.state).toBe('locked/no-key')
    expect(store.sections.Wallet.state).toBe('empty')
    expect(store.sections.Progression.state).toBe('available')
    expect(store.lifecycle).toBe('complete')
    expect(store.activeSectionName).toBeUndefined()
  })

  it('emits partialError when account phase has endpoint failures', async () => {
    progressionPublicQuery.data.value = [
      {
        endpointId: 'build_info',
        section: 'Progression',
        scope: 'public',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [{ build_id: 1 }],
      },
    ]

    accountBatchQuery.data.value = [
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
    ]

    const store = useGw2BootstrapStore()
    await store.setApiKey('secret-key')

    expect(accountBatchQuery.refresh).toHaveBeenCalledTimes(1)
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

  it('builds bank and material item view models from shared item details', async () => {
    inventoriesPublicQuery.data.value = [
      {
        endpointId: 'materials_categories',
        section: 'Inventories',
        scope: 'public',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 4, name: 'Cooking Materials', order: 1, items: [19721] }]],
      },
      {
        endpointId: 'materials_details',
        section: 'Inventories',
        scope: 'public',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 19721, name: 'Pile of Salt', icon: 'https://example.com/salt.png' }]],
      },
      {
        endpointId: 'materials_related_item_details',
        section: 'Inventories',
        scope: 'public',
        mode: 'csvGraphFrom',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 19722, name: 'Fine Pile of Salt' }]],
      },
    ]

    accountBatchQuery.data.value = [
      {
        endpointId: 'account_bank',
        section: 'Inventories',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 46731, count: 3 }]],
      },
      {
        endpointId: 'bank_item_details',
        section: 'Inventories',
        scope: 'account',
        mode: 'csvFrom',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 46731, name: 'Mystic Coin', upgrades_into: [19722] }]],
      },
      {
        endpointId: 'account_materials',
        section: 'Inventories',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 19721, count: 25 }]],
      },
    ]

    const store = useGw2BootstrapStore()
    await store.setApiKey('inventory-key')

    expect(store.bankItems).toEqual([
      {
        slotIndex: 1,
        id: 46731,
        count: 3,
        name: 'Mystic Coin',
        description: undefined,
        iconUrl: undefined,
        type: undefined,
        rarity: undefined,
        level: undefined,
        relatedItemIds: [19722],
      },
    ])

    expect(store.materialItems).toEqual([
      {
        id: 19721,
        count: 25,
        binding: undefined,
        name: 'Pile of Salt',
        description: undefined,
        iconUrl: 'https://example.com/salt.png',
        type: undefined,
        rarity: undefined,
        level: undefined,
        categoryId: 4,
        categoryName: 'Cooking Materials',
        categoryOrder: 1,
        relatedItemIds: [],
      },
    ])
  })
})
