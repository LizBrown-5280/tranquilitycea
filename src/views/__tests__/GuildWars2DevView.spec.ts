import { computed, ref, shallowRef } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Gw2EndpointRunResult } from '@/types/gw2'
import GuildWars2View from '@/views/GuildWars2DevView.vue'

type AsyncStatus = 'idle' | 'loading'

interface MockGw2Query {
  data: ReturnType<typeof shallowRef<Gw2EndpointRunResult[] | undefined>>
  asyncStatus: ReturnType<typeof computed<AsyncStatus>>
  refresh: ReturnType<typeof vi.fn>
  refetch: ReturnType<typeof vi.fn>
  loading: ReturnType<typeof ref<boolean>>
}

function createMockQuery(initialData: Gw2EndpointRunResult[] = []): MockGw2Query {
  const loading = ref(false)
  const data = shallowRef<Gw2EndpointRunResult[] | undefined>(initialData)

  return {
    data,
    loading,
    asyncStatus: computed(() => (loading.value ? 'loading' : 'idle')),
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

describe('GuildWars2View lifecycle', () => {
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

  it('renders locked account sections after public-only load', async () => {
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

    const wrapper = mount(GuildWars2View)

    expect(wrapper.text()).toContain('complete')
    const arenaNetLink = wrapper.find('a[href="https://account.arena.net/applications"]')
    expect(arenaNetLink.exists()).toBe(true)
    expect(arenaNetLink.text()).toContain('Create or manage your key on ArenaNet')
    expect(wrapper.text()).toContain('Locked (no key)')
    expect(wrapper.text()).toContain('Available')
    expect(wrapper.text()).toContain('Fractals, luck, mastery points, and achievement progress')
    expect(accountBatchQuery.refresh).not.toHaveBeenCalled()
  })

  it('runs account enrichment when key is supplied', async () => {
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
        endpointId: 'account_wallet',
        section: 'Wallet',
        scope: 'account',
        mode: 'single',
        ok: true,
        requestCount: 1,
        payload: [[{ id: 1, value: 2000 }]],
      },
    ]

    const wrapper = mount(GuildWars2View)
    const keyInput = wrapper.find('#gw2-key')

    await keyInput.setValue('temporary-key')
    await wrapper.find('form').trigger('submit.prevent')

    expect(accountBatchQuery.refresh).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Wallet Entries')
    expect(wrapper.text()).toContain('wallet entries tracked: 1')
    expect(wrapper.text()).toContain('complete')
  })

  it('shows missing-scope guidance when account endpoint returns permission error', async () => {
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
        error: 'Request failed with status 403',
        errorType: 'missingScope',
        requiredScopes: ['wallet'],
      },
      {
        endpointId: 'wallet_info_extra',
        section: 'Wallet',
        scope: 'account',
        mode: 'single',
        ok: false,
        requestCount: 1,
        payload: [],
        error: 'Request failed with status 403',
        errorType: 'missingScope',
        requiredScopes: ['wallet', 'progression'],
      },
    ]

    const wrapper = mount(GuildWars2View)
    const keyInput = wrapper.find('#gw2-key')

    await keyInput.setValue('scope-limited-key')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('blocked by API key permissions')
    expect(wrapper.text()).toContain('grant scopes wallet')
    expect(wrapper.text()).toContain('progression')
  })

  it('shows invalid-key warning when account endpoint returns invalidKey errors', async () => {
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
        error: 'Request failed with status 401',
        errorType: 'invalidKey',
        requiredScopes: ['wallet'],
      },
    ]

    const wrapper = mount(GuildWars2View)
    const keyInput = wrapper.find('#gw2-key')

    await keyInput.setValue('expired-key')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('invalid or expired')
  })
})
