<script setup lang="ts">
import { computed, ref } from 'vue'

import HoverCard from '@/components/gw2/base/HoverCard.vue'
import ItemTile from '@/components/gw2/base/itemCard.vue'
import UnlockPlanningGrid from '@/components/gw2/unlocks/UnlockPlanningGrid.vue'
import { buildUnlockDetailFields } from '@/services/gw2/unlockDetailDisplay'
import { groupFinishers } from '@/composables/useFinisherGrouping'
import { withPlaceFallback, findSecondPlaceFinisher } from '@/services/gw2/finisherPlaceLogic'
import { getBindingStatus } from '@/composables/useFinisherBinding'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'
import type { Gw2UnlockDetailItem } from '@/types/gw2'

const gw2 = useGw2BootstrapStore()
const hasApiKey = computed(() => gw2.apiKey.trim().length > 0)

function getAccountAvailabilityText(item: Gw2UnlockDetailItem): string | undefined {
  const permanent = item.accountRaw?.permanent
  const quantity = item.accountRaw?.quantity

  const hasPermanent = typeof permanent === 'boolean'
  const hasQuantity = typeof quantity === 'number' && Number.isFinite(quantity)

  if (!hasPermanent && !hasQuantity) {
    return undefined
  }

  const status = hasPermanent
    ? permanent
      ? 'Permanent'
      : 'Temporary - remaining'
    : 'Temporary - remaining'

  if (!hasQuantity) {
    return status
  }

  return `${status}: ${quantity.toLocaleString()}`
}

const sortMode = ref<'grouped' | 'alphabetical'>('grouped')
const secondPlaceFinisher = computed(() => findSecondPlaceFinisher(gw2.finisherDetails))

const displaySections = computed(() => {
  const details = [...gw2.finisherDetails].sort((a, b) => a.name.localeCompare(b.name))
  if (sortMode.value === 'grouped') {
    return groupFinishers(details)
  }
  return [{ label: 'All Finishers (A-Z)', items: details }]
})

function getFields(item: Gw2UnlockDetailItem) {
  const displayItem = withPlaceFallback(item, secondPlaceFinisher.value)
  const fields = buildUnlockDetailFields(
    displayItem,
    [
      { key: 'type', label: 'Type' },
      { key: 'unlock_type', label: 'Unlock Type' },
    ],
    {
      includeVendorValueAsCoin: hasApiKey.value,
    },
  )
  const bindingStatus = getBindingStatus(
    displayItem,
    (i) => withPlaceFallback(i, secondPlaceFinisher.value),
    (i) => !!withPlaceFallback(i, secondPlaceFinisher.value),
    secondPlaceFinisher.value,
  )
  if (bindingStatus) {
    fields.push({
      label: bindingStatus,
      value: '',
    })
  }
  const accountAvailability = getAccountAvailabilityText(displayItem)
  if (accountAvailability) {
    fields.push({
      label: 'Availability',
      value: accountAvailability,
      emphasis: true,
    })
  }
  return fields
}

function getPrimaryUnlockItemId(item: Gw2UnlockDetailItem): number | undefined {
  const displayItem = withPlaceFallback(item, secondPlaceFinisher.value)
  const unlockItemsRaw = displayItem.raw.unlock_items
  if (Array.isArray(unlockItemsRaw)) {
    for (const value of unlockItemsRaw) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }
      const parsed = parseInt(String(value), 10)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  if (typeof displayItem.id === 'number' && Number.isFinite(displayItem.id)) {
    return displayItem.id
  }
  const parsedDisplayId = parseInt(String(displayItem.id), 10)
  if (Number.isFinite(parsedDisplayId)) {
    return parsedDisplayId
  }
  return undefined
}

function getDisplayDescription(item: Gw2UnlockDetailItem): string | undefined {
  return withPlaceFallback(item, secondPlaceFinisher.value).description
}
function getDisplayImageUrl(item: Gw2UnlockDetailItem): string | undefined {
  return withPlaceFallback(item, secondPlaceFinisher.value).iconUrl
}
</script>

<template>
  <section class="unlocks-page">
    <header class="unlocks-page__header">
      <div class="unlocks-page__title-row">
        <div>
          <h2>Finishers</h2>
          <p>
            {{
              sortMode === 'grouped'
                ? 'Finishers grouped by type, alphabetized within each group.'
                : 'All finishers sorted alphabetically.'
            }}
          </p>
        </div>

        <label class="finisher-sort-control">
          <span class="finisher-sort-control__label">Sort</span>
          <select v-model="sortMode" class="finisher-sort-control__select">
            <option value="grouped">Groups</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </label>
      </div>
    </header>

    <p v-if="displaySections.length === 0" class="unlocks-page__empty">Loading finishers…</p>

    <div v-else class="finisher-groups-container">
      <section v-for="group in displaySections" :key="group.label" class="finisher-group-section">
        <h3 class="finisher-group-heading">{{ group.label }}</h3>

        <div class="unlocks-grid">
          <ItemTile
            v-for="item in group.items"
            :key="item.id"
            :name="item.name"
            :image-url="getDisplayImageUrl(item)"
            :owned="item.owned ?? false"
          >
            <template #hover>
              <HoverCard
                :title="item.name"
                :description="getDisplayDescription(item)"
                :fields="getFields(item)"
                api-endpoint-path="items"
                :api-endpoint-id="getPrimaryUnlockItemId(item)"
              />
            </template>
          </ItemTile>
        </div>
      </section>
    </div>

    <UnlockPlanningGrid />
  </section>
</template>

<style scoped>
.unlocks-page {
  display: grid;
  gap: 0.9rem;
}

.unlocks-page__header {
  display: grid;
  gap: 0.25rem;
}

.unlocks-page__header h2 {
  margin: 0;
  font-size: 1.15rem;
}

.unlocks-page__title-row {
  display: flex;
  gap: 1rem;
  align-items: end;
  justify-content: space-between;
  flex-wrap: wrap;
}

.unlocks-page__header p {
  margin: 0;
  color: var(--ui-muted);
}

.unlocks-page__empty {
  margin: 0;
  color: var(--ui-muted);
}

.finisher-groups-container {
  display: grid;
  gap: 1.5rem;
}

.finisher-group-section {
  display: grid;
  gap: 0.6rem;
}

.finisher-group-heading {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-fg);
  border-left: 3px solid var(--ui-accent);
  padding-left: 0.6rem;
}

.finisher-sort-control {
  display: inline-grid;
  gap: 0.25rem;
}

.finisher-sort-control__label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
}

.finisher-sort-control__select {
  min-width: 180px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: #fff;
  color: var(--ui-text);
  padding: 0.45rem 0.6rem;
  font: inherit;
}

.finisher-sort-control__select:focus-visible {
  outline: 2px solid #17455a;
  outline-offset: 2px;
}

.unlocks-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(10, minmax(0, 1fr));
}

@media (max-width: 1000px) {
  .unlocks-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .unlocks-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
