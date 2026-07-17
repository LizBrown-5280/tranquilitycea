<script setup lang="ts">
import { computed } from 'vue'

import HoverCard from '@/components/gw2/base/HoverCard.vue'
import ItemTile from '@/components/gw2/base/itemCard.vue'
import type { UnlockDetailField } from '@/services/gw2/unlockCategoryViewModel'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'

const gw2 = useGw2BootstrapStore()

const hasAccountKey = computed(() => gw2.apiKey.trim().length > 0)
const materialItems = computed(() => gw2.materialItems)

function formatRelatedItems(ids: number[]): string | undefined {
  if (ids.length === 0) {
    return undefined
  }

  return ids
    .map((id) => {
      const item = gw2.itemDetailsById.get(id)
      return item ? `${id}: ${item.name}` : String(id)
    })
    .join('; ')
}

function getMaterialFields(item: (typeof materialItems.value)[number]): UnlockDetailField[] {
  const fields: UnlockDetailField[] = [
    { label: 'Stored', value: item.count.toLocaleString(), emphasis: true },
  ]

  if (item.categoryName) {
    fields.push({ label: 'Category', value: item.categoryName })
  }
  if (item.binding) {
    fields.push({ label: 'Binding', value: item.binding })
  }
  if (item.type) {
    fields.push({ label: 'Type', value: item.type })
  }
  if (item.rarity) {
    fields.push({ label: 'Rarity', value: item.rarity })
  }
  if (typeof item.level === 'number') {
    fields.push({ label: 'Level', value: String(item.level) })
  }

  const relatedItems = formatRelatedItems(item.relatedItemIds)
  if (relatedItems) {
    fields.push({ label: 'Related Items', value: relatedItems })
  }

  return fields
}
</script>

<template>
  <section class="storage-page">
    <header class="storage-page__header">
      <p class="storage-page__eyebrow">Inventory Storage</p>
      <h2>Materials</h2>
      <p>
        Full material storage grid grouped in its own long-form page so we can keep expanding this
        without overloading the bank view.
      </p>
    </header>

    <p v-if="!hasAccountKey" class="storage-page__empty">
      Add an API key with the inventories scope to load material storage.
    </p>
    <p v-else-if="materialItems.length === 0" class="storage-page__empty">
      Loading material storage…
    </p>

    <div v-else class="storage-grid">
      <ItemTile
        v-for="item in materialItems"
        :key="`material-${item.id}`"
        :name="item.name"
        :image-url="item.iconUrl"
        :owned="true"
        :cost-text="`x${item.count.toLocaleString()}`"
      >
        <template #hover>
          <HoverCard
            :title="item.name"
            :description="item.description"
            :fields="getMaterialFields(item)"
            api-endpoint-path="items"
            :api-endpoint-id="item.id"
          />
        </template>
      </ItemTile>
    </div>
  </section>
</template>

<style scoped>
.storage-page {
  display: grid;
  gap: 0.9rem;
}

.storage-page__header {
  display: grid;
  gap: 0.25rem;
}

.storage-page__eyebrow {
  margin: 0;
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ui-muted);
  font-weight: 700;
}

.storage-page__header h2,
.storage-page__header p,
.storage-page__empty {
  margin: 0;
}

.storage-page__header p,
.storage-page__empty {
  color: var(--ui-muted);
}

.storage-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(10, minmax(0, 1fr));
}

@media (max-width: 1000px) {
  .storage-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .storage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
