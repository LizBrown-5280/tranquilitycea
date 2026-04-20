import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Gw2EndpointBatchResult } from '@/types/gw2'
import GuildWars2View from '@/views/GuildWars2View.vue'

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

function nextMicrotask() {
  return Promise.resolve()
}

describe('GuildWars2View lifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders locked account sections after public-only load', async () => {
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

    const wrapper = mount(GuildWars2View)
    await wrapper.find('form').trigger('submit.prevent')
    await nextMicrotask()

    expect(wrapper.text()).toContain('complete')
    const arenaNetLink = wrapper.find('a[href="https://account.arena.net/applications"]')
    expect(arenaNetLink.exists()).toBe(true)
    expect(arenaNetLink.text()).toContain('Create or manage your key on ArenaNet')
    expect(wrapper.text()).toContain('Locked (no key)')
    expect(wrapper.text()).toContain('Available')
    expect(wrapper.text()).toContain('Fractals, luck, mastery points, and achievement progress')
    expect(mockExecuteEndpointBatch).not.toHaveBeenCalled()
  })

  it('runs account enrichment when key is supplied', async () => {
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
          ok: true,
          requestCount: 1,
          payload: [{ id: 1, value: 2000 }],
        },
      ],
      payloadByEndpoint: {
        wallet_info: [{ id: 1, value: 2000 }],
      },
    })

    const wrapper = mount(GuildWars2View)
    const keyInput = wrapper.find('#gw2-key')

    await keyInput.setValue('temporary-key')
    await wrapper.find('form').trigger('submit.prevent')
    await nextMicrotask()

    expect(mockExecuteEndpointBatch).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Wallet Entries')
    expect(wrapper.text()).toContain('wallet entries tracked: 1')
    expect(wrapper.text()).toContain('complete')
  })

  it('shows missing-scope guidance when account endpoint returns permission error', async () => {
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
      ],
      payloadByEndpoint: {
        wallet_info: [],
        wallet_info_extra: [],
      },
    })

    const wrapper = mount(GuildWars2View)
    const keyInput = wrapper.find('#gw2-key')

    await keyInput.setValue('scope-limited-key')
    await wrapper.find('form').trigger('submit.prevent')
    await nextMicrotask()

    expect(wrapper.text()).toContain('blocked by API key permissions')
    expect(wrapper.text()).toContain('grant scopes wallet')
    expect(wrapper.text()).toContain('progression')
  })

  it('shows invalid-key warning when account endpoint returns invalidKey errors', async () => {
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
          error: 'Request failed with status 401',
          errorType: 'invalidKey',
          requiredScopes: ['wallet'],
        },
      ],
      payloadByEndpoint: {
        wallet_info: [],
      },
    })

    const wrapper = mount(GuildWars2View)
    const keyInput = wrapper.find('#gw2-key')

    await keyInput.setValue('expired-key')
    await wrapper.find('form').trigger('submit.prevent')
    await nextMicrotask()

    expect(wrapper.text()).toContain('invalid or expired')
  })
})
