import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGw2KeyStore } from '@/stores/gw2KeyStore'

vi.mock('@/services/gw2/queryCache', () => ({
  ACCOUNT_STALE_TIME_MS: 1000,
  clearAllAccountQueryCache: vi.fn(),
}))

import { clearAllAccountQueryCache } from '@/services/gw2/queryCache'

class LocalStorageMock {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

describe('useGw2KeyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', new LocalStorageMock())
    vi.mocked(clearAllAccountQueryCache).mockClear()
  })

  it('restores a persisted key and auto-enables account fetch on initialization', () => {
    localStorage.setItem('gw2:apiKey', 'stored-key')

    const store = useGw2KeyStore()

    expect(store.apiKey).toBe('stored-key')
    expect(store.accountFetchRequested).toBe(true)
  })

  it('persists the key when it is updated', () => {
    const store = useGw2KeyStore()

    store.setApiKey('new-key')

    expect(localStorage.getItem('gw2:apiKey')).toBe('new-key')
  })

  it('clears the key from memory and localStorage on reset', () => {
    const store = useGw2KeyStore()

    store.setApiKey('new-key')
    store.setAccountFetchRequested(true)
    store.reset()

    expect(store.apiKey).toBe('')
    expect(store.accountFetchRequested).toBe(false)
    expect(localStorage.getItem('gw2:apiKey')).toBeNull()
    expect(clearAllAccountQueryCache).toHaveBeenCalledTimes(1)
  })
})
