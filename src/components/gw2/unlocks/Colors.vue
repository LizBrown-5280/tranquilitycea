<script setup lang="ts">
import { computed, ref } from 'vue'

import HoverCard from '@/components/gw2/base/HoverCard.vue'
import UnlockTile from '@/components/gw2/base/itemCard.vue'
import UnlockPlanningGrid from '@/components/gw2/unlocks/UnlockPlanningGrid.vue'
import UnlockSortControl from '@/components/gw2/unlocks/UnlockSortControl.vue'
import {
  buildUnlockCategoryItems,
  buildUnlockDetailFields,
  sortUnlockItems,
  type UnlockItemViewModel,
  type UnlockSortMode,
} from '@/services/gw2/unlockCategoryViewModel'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'

const gw2 = useGw2BootstrapStore()
const sortMode = ref<UnlockSortMode>('alphabetical')

const unlocks = computed(() =>
  sortUnlockItems(
    buildUnlockCategoryItems(gw2.allResults, {
      title: 'Colors',
      catalogEndpoint: 'dye_catalog_details',
      accountEndpoint: 'account_dye_unlocks',
    }),
    sortMode.value,
  ),
)

function getGroupTitle(item: UnlockItemViewModel) {
  const rawGroup = item.raw.group ?? item.raw.category ?? item.raw.category_name ?? item.raw.type

  if (typeof rawGroup === 'string' && rawGroup.trim().length > 0) {
    return rawGroup
  }

  if (typeof rawGroup === 'number') {
    return `Group ${rawGroup}`
  }

  return 'Ungrouped'
}

const groupedUnlocks = computed(() => {
  const groups = new Map<string, UnlockItemViewModel[]>()

  for (const item of unlocks.value) {
    const groupTitle = getGroupTitle(item)
    const groupItems = groups.get(groupTitle) ?? []
    groupItems.push(item)
    groups.set(groupTitle, groupItems)
  }

  return Array.from(groups.entries())
    .map(([title, items]) => ({ title, items: sortUnlockItems(items, sortMode.value) }))
    .sort((left, right) => left.title.localeCompare(right.title))
})

function getFields(item: UnlockItemViewModel) {
  return buildUnlockDetailFields(item, [
    { key: 'type', label: 'Type' },
    { key: 'rarity', label: 'Rarity' },
    { key: 'color', label: 'Color' },
    { key: 'colorName', label: 'Color Name' },
  ])
}
</script>

<template>
  <section class="unlocks-page">
    <header class="unlocks-page__header">
      <h2>Colors</h2>
      <p>Grouped rows live here so the category can define its own grouping rules.</p>
    </header>

    <div class="unlocks-toolbar">
      <UnlockSortControl v-model="sortMode" />
    </div>

    <p v-if="unlocks.length === 0" class="unlocks-page__empty">Loading colors…</p>

    <div v-else class="unlocks-groups">
      <section v-for="group in groupedUnlocks" :key="group.title" class="unlocks-group">
        <h3 class="unlocks-group__title">{{ group.title }}</h3>
        <div class="unlocks-grid">
          <UnlockTile
            v-for="item in group.items"
            :key="item.id"
            :name="item.name"
            :image-url="item.iconUrl"
            :owned="item.owned"
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

      <UnlockPlanningGrid />
    </div>
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

.unlocks-page__header p {
  margin: 0;
  color: var(--ui-muted);
}

.unlocks-page__empty {
  margin: 0;
  color: var(--ui-muted);
}

.unlocks-toolbar {
  display: flex;
  justify-content: flex-start;
}

.unlocks-groups {
  display: grid;
  gap: 1rem;
}

.unlocks-group {
  display: grid;
  gap: 0.6rem;
}

.unlocks-group__title {
  margin: 0;
  font-size: 1rem;
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
