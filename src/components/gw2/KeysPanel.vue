<script setup lang="ts">
import { computed, ref } from 'vue'

import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'

const gw2Store = useGw2BootstrapStore()
const apiKey = ref(gw2Store.apiKey)

const isLoading = computed(
  () => gw2Store.lifecycle === 'loadingPublic' || gw2Store.lifecycle === 'loadingAccount',
)

const scopeErrorEntries = computed(() =>
  gw2Store.endpointErrors.filter((error) => error.errorType === 'missingScope'),
)

const missingScopes = computed(() => {
  const scopes = new Set<string>()

  for (const errorEntry of scopeErrorEntries.value) {
    for (const scopeName of errorEntry.requiredScopes ?? []) {
      scopes.add(scopeName)
    }
  }

  return Array.from(scopes).sort((left, right) => left.localeCompare(right))
})

const hasInvalidKeyError = computed(() =>
  gw2Store.endpointErrors.some((error) => error.errorType === 'invalidKey'),
)

const savedKeySuffix = computed(() => {
  const normalized = gw2Store.apiKey.trim()

  if (normalized.length < 4) {
    return ''
  }

  return normalized.slice(-4)
})

async function handleLoad() {
  await gw2Store.setApiKey(apiKey.value)
}

function handleReset() {
  apiKey.value = ''
  gw2Store.reset()
}
</script>

<template>
  <section class="keys-panel">
    <header class="keys-header">
      <h2>Keys</h2>
      <p>Add or replace your GW2 API key to load account-specific wallet amounts.</p>
      <p v-if="savedKeySuffix" class="key-current">Current key: ••••{{ savedKeySuffix }}</p>
    </header>

    <form class="key-controls" @submit.prevent="handleLoad">
      <label for="gw2-key">GW2 API key</label>
      <p class="key-help">
        Key creation is handled by ArenaNet.
        <a href="https://account.arena.net/applications" target="_blank" rel="noreferrer noopener">
          Create or manage your key on ArenaNet
        </a>
        and paste it here.
      </p>
      <div class="key-row">
        <input
          id="gw2-key"
          v-model="apiKey"
          type="password"
          autocomplete="off"
          placeholder="Paste a temporary key"
        />
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Loading...' : 'Save and Load' }}
        </button>
        <button type="button" class="ghost" :disabled="isLoading" @click="handleReset">
          Clear
        </button>
      </div>
    </form>

    <p class="status-line"><strong>Status:</strong> {{ gw2Store.lifecycle }}</p>

    <div v-if="scopeErrorEntries.length > 0" class="scope-warning">
      <p>Some account endpoints were blocked by API key permissions.</p>
      <div v-if="missingScopes.length > 0" class="scope-chip-row">
        <span v-for="scopeName in missingScopes" :key="scopeName" class="scope-chip">
          {{ scopeName }}
        </span>
      </div>
    </div>

    <div v-if="hasInvalidKeyError" class="invalid-key-warning">
      <p>Your API key appears invalid or expired for at least one account endpoint.</p>
    </div>
  </section>
</template>

<style scoped>
.keys-panel {
  display: grid;
  gap: 1rem;
}

.keys-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.keys-header p {
  margin: 0.4rem 0 0;
  color: var(--ui-muted);
}

.key-current {
  font-size: 0.88rem;
}

.key-controls {
  display: grid;
  gap: 0.55rem;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  padding: 0.85rem;
  background: #fff;
}

.key-controls label {
  font-weight: 600;
}

.key-help {
  margin: 0;
  color: var(--ui-muted);
  font-size: 0.92rem;
}

.key-row {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
}

.key-row input {
  min-width: 0;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  font: inherit;
}

.key-row button {
  border: 1px solid #17455a;
  border-radius: 10px;
  background: #17455a;
  color: #fff;
  font: inherit;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}

.key-row button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.key-row .ghost {
  background: #fff;
  color: #17455a;
}

.status-line {
  margin: 0;
}

.scope-warning,
.invalid-key-warning {
  border: 1px solid #d6b38a;
  border-radius: 12px;
  background: #fffaf3;
  padding: 0.7rem 0.8rem;
}

.scope-warning p,
.invalid-key-warning p {
  margin: 0;
}

.scope-chip-row {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.scope-chip {
  border: 1px solid #d6b38a;
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
  background: #fff;
  font-size: 0.82rem;
}

@media (max-width: 760px) {
  .key-row {
    grid-template-columns: 1fr;
  }
}
</style>
