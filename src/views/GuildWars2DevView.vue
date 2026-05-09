<script setup lang="ts">
import { computed, ref } from 'vue'

import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'
import type { Gw2MetricCard } from '@/types/gw2'

const gw2Store = useGw2BootstrapStore()
const apiKey = ref('')

const sectionStatusLabel: Record<string, string> = {
  available: 'Available',
  partial: 'Partial',
  empty: 'Empty',
  'locked/no-key': 'Locked (no key)',
}

const progressLabel = computed(() => `${gw2Store.progress.completed}/${gw2Store.progress.total}`)
const isLoading = computed(
  () => gw2Store.lifecycle === 'loadingPublic' || gw2Store.lifecycle === 'loadingAccount',
)
const loadPhaseMessage = computed(() => {
  if (gw2Store.lifecycle === 'loadingPublic') {
    return 'Loading public game data now. This should appear first.'
  }

  if (gw2Store.lifecycle === 'loadingAccount') {
    return 'Public data is visible. Enriching account-specific details next.'
  }

  return ''
})

function isSectionLoading(sectionName: string): boolean {
  if (gw2Store.lifecycle === 'loadingPublic') {
    return (
      sectionName === 'Wallet' ||
      sectionName === 'Account Unlocks' ||
      sectionName === 'Inventories' ||
      sectionName === 'Progression'
    )
  }

  if (gw2Store.lifecycle === 'loadingAccount') {
    return (
      sectionName === 'Characters' ||
      sectionName === 'Inventories' ||
      sectionName === 'Account Unlocks' ||
      sectionName === 'Wallet' ||
      sectionName === 'Progression'
    )
  }

  return false
}

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

const showTechnicalDiagnostics = import.meta.env.DEV

type MetricCardTone = 'highlight' | 'good' | 'attention' | 'neutral'

interface AccountUnlockDisplayRow {
  group: string
  category: string
  id: string
  name: string
  owned: boolean
  iconUrl?: string
}

function getMetricNumericValue(rawValue: string): number | undefined {
  const normalized = rawValue.replace(/,/g, '')
  const parsed = Number(normalized)

  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return parsed
}

function getMetricTone(metric: Gw2MetricCard): MetricCardTone {
  if (metric.tone) {
    return metric.tone
  }

  const numericValue = getMetricNumericValue(metric.value)

  if (metric.id.includes('latest-build-version')) {
    return 'highlight'
  }

  if (metric.label.includes('Completed')) {
    if (numericValue !== undefined && numericValue > 0) {
      return 'good'
    }

    return 'attention'
  }

  if (numericValue !== undefined && numericValue === 0) {
    return 'attention'
  }

  if (numericValue !== undefined && numericValue > 0) {
    return 'good'
  }

  return 'neutral'
}

function getMetricBadge(metric: Gw2MetricCard): string {
  if (metric.badge) {
    return metric.badge
  }

  const tone = getMetricTone(metric)

  if (tone === 'highlight') {
    return 'Baseline'
  }

  if (tone === 'good') {
    return 'Ready'
  }

  if (metric.label.includes('Completed')) {
    return 'In Progress'
  }

  if (tone === 'attention') {
    return 'Needs Data'
  }

  return 'Info'
}

function isAccountUnlockSupportMetric(metric: Gw2MetricCard): boolean {
  return metric.id.startsWith('account-unlocks-endpoint-status-')
}

function getPrimaryMetrics(sectionName: string, metrics: Gw2MetricCard[]): Gw2MetricCard[] {
  if (sectionName !== 'Account Unlocks') {
    return metrics
  }

  return metrics.filter((metric) => !isAccountUnlockSupportMetric(metric))
}

function getSupportMetrics(sectionName: string, metrics: Gw2MetricCard[]): Gw2MetricCard[] {
  if (sectionName !== 'Account Unlocks') {
    return []
  }

  return metrics.filter((metric) => isAccountUnlockSupportMetric(metric))
}

function getWalletDisplayRows(records: string[]): string[] {
  const rowPrefix = 'wallet display row: '

  return records
    .filter((record) => record.startsWith(rowPrefix))
    .map((record) => record.slice(rowPrefix.length))
}

function getCharacterDisplayRows(records: string[]): string[] {
  const rowPrefix = 'character display row: '

  return records
    .filter((record) => record.startsWith(rowPrefix))
    .map((record) => record.slice(rowPrefix.length))
}

function getProgressionDisplayRows(records: string[]): string[] {
  const rowPrefix = 'progression display row: '

  return records
    .filter((record) => record.startsWith(rowPrefix))
    .map((record) => record.slice(rowPrefix.length))
}

function getInventoryBankRows(records: string[]): string[] {
  const rowPrefix = 'inventory bank row: '

  return records
    .filter((record) => record.startsWith(rowPrefix))
    .map((record) => record.slice(rowPrefix.length))
}

function getInventoryMaterialRows(records: string[]): string[] {
  const rowPrefix = 'inventory material row: '

  return records
    .filter((record) => record.startsWith(rowPrefix))
    .map((record) => record.slice(rowPrefix.length))
}

function getAccountUnlockRows(records: string[]): AccountUnlockDisplayRow[] {
  const rowPrefix = 'account unlock display row: '

  return records
    .filter((record) => record.startsWith(rowPrefix))
    .map((record) => record.slice(rowPrefix.length))
    .map((rawValue) => {
      try {
        const parsed = JSON.parse(rawValue) as Partial<AccountUnlockDisplayRow>
        if (
          typeof parsed.group === 'string' &&
          typeof parsed.category === 'string' &&
          typeof parsed.id === 'string' &&
          typeof parsed.name === 'string' &&
          typeof parsed.owned === 'boolean'
        ) {
          return parsed as AccountUnlockDisplayRow
        }

        return undefined
      } catch {
        return undefined
      }
    })
    .filter((entry): entry is AccountUnlockDisplayRow => entry !== undefined)
}

function showProgressionEmptyState(records: string[]): boolean {
  return getProgressionDisplayRows(records).length === 0
}

async function handleLoad() {
  await gw2Store.setApiKey(apiKey.value)
}
</script>

<template>
  <main class="gw2-page">
    <header class="gw2-header">
      <p class="eyebrow">Guild Wars 2 Guide</p>
      <h1>Account Snapshot</h1>
      <p class="intro">
        Load public baseline data first, then optionally enrich with your API key for account-bound
        sections.
      </p>

      <form class="key-controls" @submit.prevent="handleLoad">
        <label for="gw2-key">Optional API key</label>
        <p class="key-help">
          Key creation is handled only by ArenaNet.
          <a
            href="https://account.arena.net/applications"
            target="_blank"
            rel="noreferrer noopener"
          >
            Create or manage your key on ArenaNet
          </a>
          and paste it here if you want account data enrichment.
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
            {{ isLoading ? 'Loading...' : 'Load Data' }}
          </button>
          <button type="button" class="ghost" :disabled="isLoading" @click="gw2Store.reset()">
            Reset
          </button>
        </div>
      </form>

      <p v-if="loadPhaseMessage" class="phase-note">{{ loadPhaseMessage }}</p>

      <dl class="lifecycle">
        <div>
          <dt>Status</dt>
          <dd>{{ gw2Store.lifecycle }}</dd>
        </div>
        <div>
          <dt>Progress</dt>
          <dd>{{ progressLabel }}</dd>
        </div>
      </dl>

      <div v-if="scopeErrorEntries.length > 0" class="scope-warning">
        <p>Some account endpoints were blocked by API key permissions.</p>
        <div v-if="missingScopes.length > 0" class="scope-chip-row">
          <span v-for="scopeName in missingScopes" :key="scopeName" class="scope-chip">
            {{ scopeName }}
          </span>
        </div>
        <ul>
          <li v-for="error in scopeErrorEntries" :key="error.endpoint">
            <strong>{{ error.endpoint }}:</strong>
            <span>
              grant scopes
              {{
                error.requiredScopes && error.requiredScopes.length > 0
                  ? error.requiredScopes.join(', ')
                  : 'for this endpoint'
              }}
            </span>
          </li>
        </ul>
      </div>

      <div v-if="hasInvalidKeyError" class="invalid-key-warning">
        <p>Your API key appears invalid or expired for at least one account endpoint.</p>
      </div>
    </header>

    <section class="gw2-layout">
      <aside class="side-nav" aria-label="GW2 sections">
        <h2>Sections</h2>
        <ul>
          <li v-for="section in gw2Store.orderedSections" :key="section.name">
            <a :href="`#${section.name}`">
              <span>{{ section.name }}</span>
              <strong>{{ sectionStatusLabel[section.state] }}</strong>
            </a>
          </li>
        </ul>
      </aside>

      <div class="section-panels">
        <article
          v-for="section in gw2Store.orderedSections"
          :id="section.name"
          :key="section.name"
          class="panel"
        >
          <header>
            <div class="panel-title-row">
              <h3>{{ section.name }}</h3>
              <span v-if="isSectionLoading(section.name)" class="section-loading-pill"
                >Updating</span
              >
            </div>
            <p :data-state="section.state">{{ sectionStatusLabel[section.state] }}</p>
          </header>
          <p class="summary">{{ section.summary }}</p>

          <div
            v-if="getPrimaryMetrics(section.name, section.metrics).length > 0"
            class="metric-grid"
          >
            <article
              v-for="metric in getPrimaryMetrics(section.name, section.metrics)"
              :key="metric.id"
              class="metric-card"
              :class="`metric-card--${getMetricTone(metric)}`"
              :title="metric.description"
            >
              <div class="metric-header">
                <img
                  v-if="metric.iconUrl"
                  :src="metric.iconUrl"
                  :alt="`${metric.label} icon`"
                  class="metric-icon"
                />
                <p>{{ metric.label }}</p>
                <span class="metric-badge">{{ getMetricBadge(metric) }}</span>
              </div>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.description }}</small>
            </article>
          </div>

          <section
            v-if="
              section.name === 'Account Unlocks' &&
              getSupportMetrics(section.name, section.metrics).length > 0
            "
            class="support-metrics-panel"
            aria-label="Endpoint support"
          >
            <div class="support-metrics-header">
              <h4>Endpoint Support</h4>
              <p>
                These chips describe API endpoint reliability, separate from your unlock ownership.
              </p>
            </div>
            <div class="metric-grid metric-grid--support">
              <article
                v-for="metric in getSupportMetrics(section.name, section.metrics)"
                :key="metric.id"
                class="metric-card"
                :class="`metric-card--${getMetricTone(metric)}`"
                :title="metric.description"
              >
                <div class="metric-header">
                  <img
                    v-if="metric.iconUrl"
                    :src="metric.iconUrl"
                    :alt="`${metric.label} icon`"
                    class="metric-icon"
                  />
                  <p>{{ metric.label }}</p>
                  <span class="metric-badge">{{ getMetricBadge(metric) }}</span>
                </div>
                <strong>{{ metric.value }}</strong>
                <small>{{ metric.description }}</small>
              </article>
            </div>
          </section>

          <div
            v-if="section.name === 'Wallet' && getWalletDisplayRows(section.records).length > 0"
            class="wallet-preview"
          >
            <h4>Currency Catalog</h4>
            <p
              v-if="gw2Store.lifecycle === 'complete' && section.state !== 'available'"
              class="wallet-pending-note"
            >
              Currency names are from the public catalog. Add an API key with the
              <strong>wallet</strong> scope to see your balances.
            </p>
            <ul>
              <li v-for="row in getWalletDisplayRows(section.records)" :key="row">{{ row }}</li>
            </ul>
          </div>

          <div
            v-if="
              section.name === 'Characters' && getCharacterDisplayRows(section.records).length > 0
            "
            class="character-preview"
          >
            <h4>Character Roster Snapshot</h4>
            <ul>
              <li v-for="row in getCharacterDisplayRows(section.records)" :key="row">{{ row }}</li>
            </ul>
          </div>

          <div
            v-if="
              section.name === 'Inventories' && getInventoryBankRows(section.records).length > 0
            "
            class="inventory-preview"
          >
            <h4>Bank Snapshot</h4>
            <ul>
              <li v-for="row in getInventoryBankRows(section.records)" :key="row">{{ row }}</li>
            </ul>
          </div>

          <div
            v-if="
              section.name === 'Inventories' && getInventoryMaterialRows(section.records).length > 0
            "
            class="inventory-preview"
          >
            <h4>Materials Snapshot</h4>
            <ul>
              <li v-for="row in getInventoryMaterialRows(section.records)" :key="row">
                {{ row }}
              </li>
            </ul>
          </div>

          <div
            v-if="
              section.name === 'Account Unlocks' && getAccountUnlockRows(section.records).length > 0
            "
            class="unlock-preview"
          >
            <h4>Account Unlock Collection</h4>
            <div class="unlock-group-grid">
              <article class="unlock-group">
                <h5>Cosmetic Unlocks</h5>
                <ul class="unlock-list">
                  <li
                    v-for="row in getAccountUnlockRows(section.records).filter(
                      (entry) => entry.group === 'Cosmetic Unlocks',
                    )"
                    :key="`${row.category}-${row.id}`"
                    class="unlock-row"
                    :class="{ 'unlock-row--missing': !row.owned }"
                    :title="`${row.category} - ${row.name}`"
                  >
                    <img
                      v-if="row.iconUrl"
                      :src="row.iconUrl"
                      :alt="`${row.name} icon`"
                      class="unlock-icon"
                    />
                    <span>{{ row.category }}: {{ row.name }}</span>
                  </li>
                </ul>
              </article>
              <article class="unlock-group">
                <h5>Feature Unlocks</h5>
                <ul class="unlock-list">
                  <li
                    v-for="row in getAccountUnlockRows(section.records).filter(
                      (entry) => entry.group === 'Feature Unlocks',
                    )"
                    :key="`${row.category}-${row.id}`"
                    class="unlock-row"
                    :class="{ 'unlock-row--missing': !row.owned }"
                    :title="`${row.category} - ${row.name}`"
                  >
                    <img
                      v-if="row.iconUrl"
                      :src="row.iconUrl"
                      :alt="`${row.name} icon`"
                      class="unlock-icon"
                    />
                    <span>{{ row.category }}: {{ row.name }}</span>
                  </li>
                </ul>
              </article>
            </div>
          </div>

          <div
            v-if="
              section.name === 'Progression' &&
              getProgressionDisplayRows(section.records).length > 0
            "
            class="progression-preview"
          >
            <h4>Progression Snapshot</h4>
            <ul>
              <li v-for="row in getProgressionDisplayRows(section.records)" :key="row">
                {{ row }}
              </li>
            </ul>
          </div>

          <div
            v-if="section.name === 'Progression' && showProgressionEmptyState(section.records)"
            class="progression-preview progression-preview--empty"
          >
            <h4>Progression Snapshot</h4>
            <p>
              Fractals, luck, mastery points, and achievement progress appear here after loading an
              API key with the <strong>progression</strong> scope.
            </p>
          </div>

          <details
            v-if="showTechnicalDiagnostics && section.records.length > 0"
            class="records-debug"
          >
            <summary>Endpoint diagnostics</summary>
            <ul class="records">
              <li v-for="record in section.records" :key="record">{{ record }}</li>
            </ul>
          </details>
          <p
            v-if="section.metrics.length === 0 && section.records.length === 0"
            class="placeholder"
          >
            No section metrics in current dataset.
          </p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.gw2-page {
  display: grid;
  gap: 1.5rem;
}

.gw2-header {
  border: 1px solid var(--ui-border);
  border-radius: 18px;
  padding: 1.5rem;
  background: linear-gradient(140deg, rgba(250, 243, 224, 0.9), rgba(255, 255, 255, 0.9));
  box-shadow: 0 8px 32px rgba(26, 41, 52, 0.08);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ui-muted);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

h1 {
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  margin-bottom: 0.5rem;
}

.intro {
  max-width: 65ch;
  color: var(--ui-muted);
}

.key-controls {
  margin-top: 1.2rem;
}

.key-controls label {
  display: block;
  font-weight: 600;
}

.key-help {
  margin-top: 0.35rem;
  color: var(--ui-muted);
}

.key-help a {
  color: #1f6f8b;
  font-weight: 700;
  text-decoration: underline;
}

.key-row {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

input {
  flex: 1 1 280px;
  min-height: 42px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  background-color: #fff;
}

button {
  min-height: 42px;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  background: #1f6f8b;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.ghost {
  background: transparent;
  border-color: var(--ui-border);
  color: var(--ui-text);
}

.lifecycle {
  margin-top: 1rem;
  display: flex;
  gap: 1.5rem;
}

.phase-note {
  margin-top: 0.65rem;
  color: var(--ui-muted);
  font-weight: 600;
}

.unlock-preview {
  margin-top: 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.65);
}

.unlock-group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.8rem;
}

.unlock-group h5 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.unlock-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
}

.unlock-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.unlock-row--missing {
  opacity: 0.55;
}

.unlock-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: cover;
}

.unlock-row--missing .unlock-icon {
  filter: grayscale(1) saturate(0.2);
}

.scope-warning {
  margin-top: 1rem;
  border: 1px solid #efc995;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  background: #fff4e4;
}

.scope-warning p {
  font-weight: 600;
  color: #8d4b00;
}

.scope-warning ul {
  margin-top: 0.35rem;
  padding-left: 1.1rem;
  color: #6b4920;
}

.scope-chip-row {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.scope-chip {
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid #e2b472;
  border-radius: 999px;
  background: #fff1dd;
  color: #8d4b00;
  padding: 0.14rem 0.55rem;
}

.invalid-key-warning {
  margin-top: 0.75rem;
  border: 1px solid #e8b6bf;
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  background: #fff0f3;
}

.invalid-key-warning p {
  color: #8e2740;
  font-weight: 600;
}

dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

dd {
  margin-top: 0.2rem;
  font-weight: 700;
}

.gw2-layout {
  display: grid;
  gap: 1rem;
}

.side-nav {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--ui-card);
}

.side-nav h2 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.side-nav ul {
  list-style: none;
  display: grid;
  gap: 0.45rem;
}

.side-nav a {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--ui-text);
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.45rem 0.6rem;
}

.side-nav strong {
  color: var(--ui-muted);
  font-size: 0.8rem;
}

.section-panels {
  display: grid;
  gap: 0.9rem;
}

.panel {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--ui-card);
}

.panel header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.panel h3 {
  font-size: 1.2rem;
}

.section-loading-pill {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid #b9cddd;
  border-radius: 999px;
  background: #edf6fb;
  color: #265b74;
  padding: 0.16rem 0.5rem;
}

.panel header p {
  text-transform: uppercase;
  font-size: 0.73rem;
  letter-spacing: 0.06em;
}

.panel header p[data-state='available'] {
  color: #196f3d;
}

.panel header p[data-state='partial'] {
  color: #a46700;
}

.panel header p[data-state='empty'] {
  color: #525252;
}

.panel header p[data-state='locked/no-key'] {
  color: #9d1c37;
}

.summary {
  margin-top: 0.35rem;
  color: var(--ui-muted);
}

.metric-grid {
  margin-top: 0.8rem;
  display: grid;
  gap: 0.6rem;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.metric-grid--support {
  margin-top: 0;
}

.support-metrics-panel {
  margin-top: 0.9rem;
  border: 1px dashed #b9cddd;
  border-radius: 12px;
  padding: 0.8rem;
  background: linear-gradient(160deg, rgba(237, 246, 251, 0.82), rgba(255, 255, 255, 0.88));
}

.support-metrics-header {
  margin-bottom: 0.65rem;
}

.support-metrics-header h4 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #265b74;
}

.support-metrics-header p {
  margin-top: 0.25rem;
  color: var(--ui-muted);
  font-size: 0.88rem;
}

.metric-card {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.65rem;
  display: grid;
  gap: 0.25rem;
  background: linear-gradient(160deg, rgba(238, 246, 252, 0.6), rgba(255, 255, 255, 0.95));
  transition: transform 0.16s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card--highlight {
  border-color: #72a2bd;
  background: linear-gradient(150deg, rgba(206, 230, 243, 0.95), rgba(244, 251, 255, 0.95));
}

.metric-card--good {
  border-color: #a8d4bb;
  background: linear-gradient(150deg, rgba(227, 245, 235, 0.95), rgba(247, 255, 250, 0.98));
}

.metric-card--attention {
  border-color: #e4c48c;
  background: linear-gradient(150deg, rgba(255, 245, 224, 0.95), rgba(255, 252, 246, 0.98));
}

.metric-card--neutral {
  border-color: var(--ui-border);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.metric-header p {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

.metric-icon {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

.metric-badge {
  margin-left: auto;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 0.12rem 0.5rem;
  border: 1px solid #d3dde3;
  color: #3f5460;
  background: rgba(255, 255, 255, 0.92);
}

.metric-card strong {
  font-size: 1.2rem;
  line-height: 1.2;
}

.metric-card small {
  color: var(--ui-muted);
}

.wallet-preview {
  margin-top: 0.75rem;
  border: 1px dashed var(--ui-border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.65);
}

.wallet-pending-note {
  font-size: 0.75rem;
  color: var(--text-muted, #888);
  margin: 0.25rem 0 0.5rem;
  font-style: italic;
}

.wallet-preview h4 {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

.wallet-preview ul {
  margin-top: 0.4rem;
  display: grid;
  gap: 0.2rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.84rem;
}

.character-preview {
  margin-top: 0.75rem;
  border: 1px dashed var(--ui-border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.65);
}

.character-preview h4 {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

.character-preview ul {
  margin-top: 0.4rem;
  display: grid;
  gap: 0.2rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.84rem;
}

.inventory-preview {
  margin-top: 0.75rem;
  border: 1px dashed var(--ui-border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.65);
}

.inventory-preview h4 {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

.inventory-preview ul {
  margin-top: 0.4rem;
  display: grid;
  gap: 0.2rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.84rem;
}

.progression-preview {
  margin-top: 0.75rem;
  border: 1px dashed var(--ui-border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.65);
}

.progression-preview h4 {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

.progression-preview ul {
  margin-top: 0.4rem;
  display: grid;
  gap: 0.2rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.84rem;
}

.progression-preview--empty p {
  margin-top: 0.4rem;
  color: var(--ui-muted);
}

.records-debug {
  margin-top: 0.75rem;
}

.records-debug summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--ui-muted);
}

.records {
  margin-top: 0.45rem;
  padding-left: 1.2rem;
}

.placeholder {
  margin-top: 0.8rem;
  color: var(--ui-muted);
}

@media (min-width: 920px) {
  .gw2-layout {
    grid-template-columns: 280px minmax(0, 1fr);
    align-items: start;
  }

  .side-nav {
    position: sticky;
    top: 5.8rem;
  }
}
</style>
