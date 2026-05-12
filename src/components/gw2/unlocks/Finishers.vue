<script setup lang="ts">
import { computed, ref } from 'vue'

import HoverCard from '@/components/gw2/base/HoverCard.vue'
import UnlockTile from '@/components/gw2/base/itemCard.vue'
import UnlockPlanningGrid from '@/components/gw2/unlocks/UnlockPlanningGrid.vue'
import { buildUnlockDetailFields } from '@/services/gw2/unlockDetailDisplay'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'
import type { Gw2UnlockDetailItem } from '@/types/gw2'

const gw2 = useGw2BootstrapStore()
const sortMode = ref<'grouped' | 'alphabetical'>('grouped')

type FinisherGroup = {
  label: string
  matches?: (item: Gw2UnlockDetailItem) => boolean
}

function includesIgnoreCase(value: string | undefined, token: string) {
  return (value ?? '').toLowerCase().includes(token.toLowerCase())
}

function isPvpOrWvw(item: Gw2UnlockDetailItem) {
  const relatedText =
    item.relatedItems
      ?.flatMap((relation) => relation.items)
      .map((relatedItem) => `${relatedItem.name} ${relatedItem.description ?? ''}`)
      .join(' ') ?? ''

  const haystack = [item.name, item.description, item.type, JSON.stringify(item.raw), relatedText]
    .join(' ')
    .toLowerCase()

  return (
    haystack.includes('pvp') ||
    haystack.includes('player vs player') ||
    haystack.includes('wvw') ||
    haystack.includes('world vs world') ||
    haystack.includes('world versus world')
  )
}

const GROUPS: FinisherGroup[] = [
  { label: 'Mordrem', matches: (item) => includesIgnoreCase(item.name, 'Mordrem') },
  {
    label: 'Place',
    matches: (item) =>
      includesIgnoreCase(item.name, 'Place') && !includesIgnoreCase(item.name, 'World Tournament'),
  },
  { label: 'Rank', matches: (item) => includesIgnoreCase(item.name, 'Rank') },
  {
    label: 'World Tournament',
    matches: (item) => includesIgnoreCase(item.name, 'World Tournament'),
  },
  { label: 'PvP & WvW', matches: (item) => isPvpOrWvw(item) },
  { label: 'Other' },
]

const finisherGroups = computed(() => {
  const details = [...gw2.finisherDetails].sort((a, b) => a.name.localeCompare(b.name))
  const assigned = new Set<string>()

  return GROUPS.map((group) => {
    const items = details.filter((item) => {
      const key = String(item.id)
      if (assigned.has(key)) {
        return false
      }

      const isMatch = group.matches ? group.matches(item) : true
      if (!isMatch) {
        return false
      }

      assigned.add(key)
      return true
    })

    return { label: group.label, items }
  }).filter((group) => group.items.length > 0)
})

const displaySections = computed(() => {
  if (sortMode.value === 'grouped') {
    return finisherGroups.value
  }

  const alphabetical = [...gw2.finisherDetails].sort((a, b) => a.name.localeCompare(b.name))
  return [{ label: 'All Finishers (A-Z)', items: alphabetical }]
})

function getFields(item: Gw2UnlockDetailItem) {
  return buildUnlockDetailFields(item, [
    { key: 'type', label: 'Type' },
    { key: 'unlock_type', label: 'Unlock Type' },
  ])
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
          <UnlockTile
            v-for="item in group.items"
            :key="item.id"
            :name="item.name"
            :image-url="item.iconUrl"
            :owned="false"
          >
            <template #hover>
              <HoverCard
                :title="item.name"
                :description="item.description"
                :fields="getFields(item)"
              />
            </template>
          </UnlockTile>
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
