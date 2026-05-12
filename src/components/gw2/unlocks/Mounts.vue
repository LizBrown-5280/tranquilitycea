<script setup lang="ts">
import { computed } from 'vue'

import HoverCard from '@/components/gw2/base/HoverCard.vue'
import UnlockTile from '@/components/gw2/base/itemCard.vue'
import UnlockPlanningGrid from '@/components/gw2/unlocks/UnlockPlanningGrid.vue'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'
import type { Gw2MountSkin, Gw2MountType } from '@/types/gw2'

const gw2 = useGw2BootstrapStore()

// Get organized mount data from the store
const mountsOrganized = computed(() => gw2.mountsByType)

// Compute summary stats
const summary = computed(() => {
  const org = mountsOrganized.value
  return {
    total: org.totalSkins,
    owned: org.ownedSkins,
    percentage: org.totalSkins > 0 ? Math.round((org.ownedSkins / org.totalSkins) * 100) : 0,
  }
})

// Format dye slots for hover card
function formatDyeSlots(skin: Gw2MountSkin): string {
  if (!skin.dyeSlots || skin.dyeSlots.length === 0) {
    return 'No dye slots'
  }

  return skin.dyeSlots
    .map((slot) => `Slot ${slot.id}: ${slot.colorName || `Color #${slot.colorId}`}`)
    .join(', ')
}

// Build hover card description with dye info
function getHoverDescription(skin: Gw2MountSkin): string {
  const dyeInfo = formatDyeSlots(skin)
  return `Status: ${skin.owned ? 'Owned' : 'Not owned'} • ${dyeInfo}`
}
</script>

<template>
  <section class="unlocks-page">
    <header class="unlocks-page__header">
      <h2>Mounts</h2>
      <p>Mount skins organized by type with dye slot information.</p>
    </header>

    <div class="unlocks-summary">
      <span>{{ summary.owned }}/{{ summary.total }} skins owned ({{ summary.percentage }}%)</span>
    </div>

    <div v-if="mountsOrganized.byType.length === 0" class="unlocks-page__empty">
      Loading mount data…
    </div>

    <div v-else class="mount-types-container">
      <section
        v-for="mountType in mountsOrganized.byType"
        :key="mountType.id"
        class="mount-type-section"
      >
        <h3 class="mount-type-heading">{{ mountType.name }}</h3>

        <div class="unlocks-grid">
          <UnlockTile
            v-for="skin in mountType.skins"
            :key="`${mountType.id}-${skin.id}`"
            :name="skin.name"
            :image-url="skin.icon"
            :owned="skin.owned ?? false"
          >
            <template #hover>
              <HoverCard :title="skin.name" :description="getHoverDescription(skin)" :fields="[]" />
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

.unlocks-page__header p {
  margin: 0;
  color: var(--ui-muted);
}

.unlocks-page__empty {
  margin: 0;
  color: var(--ui-muted);
}

.unlocks-summary {
  font-size: 0.9rem;
  color: var(--ui-muted);
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--ui-border-weak);
}

.mount-types-container {
  display: grid;
  gap: 1.5rem;
}

.mount-type-section {
  display: grid;
  gap: 0.6rem;
}

.mount-type-heading {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-fg);
  border-left: 3px solid var(--ui-accent);
  padding-left: 0.6rem;
}

.unlocks-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 0.75rem;
}
</style>
