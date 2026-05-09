import { ref } from 'vue'
import { defineStore } from 'pinia'

const GW2_API_KEY_STORAGE_KEY = 'gw2:apiKey'

function loadStoredApiKey(): string {
  if (typeof localStorage === 'undefined') {
    return ''
  }

  try {
    return localStorage.getItem(GW2_API_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function persistApiKey(apiKey: string) {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    if (apiKey.length === 0) {
      localStorage.removeItem(GW2_API_KEY_STORAGE_KEY)
      return
    }

    localStorage.setItem(GW2_API_KEY_STORAGE_KEY, apiKey)
  } catch {
    // Ignore storage failures and keep the in-memory key available for the session.
  }
}

export const useGw2KeyStore = defineStore('gw2Key', () => {
  const storedApiKey = loadStoredApiKey()
  const apiKey = ref(storedApiKey)
  const accountFetchRequested = ref(storedApiKey.trim().length > 0)

  function setApiKey(nextKey: string) {
    apiKey.value = nextKey
    persistApiKey(nextKey)
  }

  function setAccountFetchRequested(requested: boolean) {
    accountFetchRequested.value = requested
  }

  function reset() {
    apiKey.value = ''
    accountFetchRequested.value = false
    persistApiKey('')
  }

  return {
    apiKey,
    accountFetchRequested,
    setApiKey,
    setAccountFetchRequested,
    reset,
  }
})
