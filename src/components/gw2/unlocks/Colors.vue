<script setup lang="ts">
import { computed } from 'vue'

import HoverCard from '@/components/gw2/base/HoverCard.vue'
import ItemTile from '@/components/gw2/base/itemCard.vue'
import UnlockPlanningGrid from '@/components/gw2/unlocks/UnlockPlanningGrid.vue'
import { buildUnlockDetailFields } from '@/services/gw2/unlockDetailDisplay'
import {
  buildUnlockCategoryItems,
  type UnlockItemViewModel,
} from '@/services/gw2/unlockCategoryViewModel'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'
import type { Gw2UnlockDetailItem } from '@/types/gw2'

const gw2 = useGw2BootstrapStore()

const RARITY_ORDER = ['Starter', 'Common', 'Uncommon', 'Rare', 'Exclusive'] as const
const HUE_ORDER = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Brown', 'Gray'] as const

type DyeRarity = (typeof RARITY_ORDER)[number]
type DyeHue = (typeof HUE_ORDER)[number]

function getCategories(item: UnlockItemViewModel): string[] {
  const cats = item.raw.categories
  return Array.isArray(cats) ? cats.filter((c): c is string => typeof c === 'string') : []
}

function getDyeRarity(item: UnlockItemViewModel): DyeRarity {
  const cats = getCategories(item)
  return (RARITY_ORDER.find((r) => cats.includes(r)) as DyeRarity) ?? 'Common'
}

function getDyeHue(item: UnlockItemViewModel): DyeHue | undefined {
  const cats = getCategories(item)
  return HUE_ORDER.find((h) => cats.includes(h)) as DyeHue | undefined
}

function hueOrder(item: UnlockItemViewModel): number {
  const hue = getDyeHue(item)
  const idx = hue ? HUE_ORDER.indexOf(hue) : -1
  return idx === -1 ? HUE_ORDER.length : idx
}

function getSwatchColor(item: UnlockItemViewModel): string | undefined {
  const cats = getCategories(item)

  // Pick the material sub-object matching the dye's material category
  const materialKey = cats.includes('Metal')
    ? 'metal'
    : cats.includes('Leather')
      ? 'leather'
      : 'cloth'
  const material = item.raw[materialKey]

  if (typeof material === 'object' && material !== null) {
    const rgb = (material as Record<string, unknown>).rgb
    if (Array.isArray(rgb) && rgb.length === 3 && rgb.every((v) => typeof v === 'number')) {
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    }
  }

  return undefined
}

const unlocks = computed(() =>
  buildUnlockCategoryItems(gw2.allResults, {
    title: 'Dyes',
    catalogEndpoint: 'dye_catalog_details',
    accountEndpoint: 'account_dye_unlocks',
  }),
)
const colorDetailsById = computed(
  () => new Map(gw2.colorDetails.map((item) => [String(item.id), item])),
)
const hasApiKey = computed(() => gw2.apiKey.trim().length > 0)

function getColorDetail(item: UnlockItemViewModel): Gw2UnlockDetailItem | undefined {
  return colorDetailsById.value.get(String(item.id))
}

function getFields(item: UnlockItemViewModel) {
  const detail = getColorDetail(item)
  if (!detail) {
    return []
  }

  return buildUnlockDetailFields(detail, undefined, {
    includeDescription: true,
    includeVendorValueAsCoin: hasApiKey.value,
  })
}

function getItemApiId(item: UnlockItemViewModel): number | undefined {
  const detail = getColorDetail(item)
  const itemId = detail?.raw.item
  if (typeof itemId === 'number' && Number.isFinite(itemId)) {
    return itemId
  }
  return undefined
}

function getItemIcon(item: UnlockItemViewModel): string | undefined {
  return getColorDetail(item)?.iconUrl
}

const dyeGroups = computed(() => {
  const grouped = new Map<DyeRarity, UnlockItemViewModel[]>()
  for (const rarity of RARITY_ORDER) {
    grouped.set(rarity, [])
  }

  for (const item of unlocks.value) {
    const rarity = getDyeRarity(item)
    grouped.get(rarity)!.push(item)
  }

  return RARITY_ORDER.map((rarity) => ({
    label: rarity,
    items: (grouped.get(rarity) ?? []).sort((a, b) => {
      const hueDiff = hueOrder(a) - hueOrder(b)
      return hueDiff !== 0 ? hueDiff : a.name.localeCompare(b.name)
    }),
  })).filter((g) => g.items.length > 0)
})
</script>

<template>
  <section class="unlocks-page">
    <header class="unlocks-page__header">
      <h2>Dyes</h2>
      <p>Dyes grouped by rarity, sorted by hue within each group.</p>
    </header>

    <p v-if="unlocks.length === 0" class="unlocks-page__empty">Loading dyes…</p>

    <div v-else class="unlocks-groups">
      <section v-for="group in dyeGroups" :key="group.label" class="unlocks-group">
        <h3 class="unlocks-group__title">{{ group.label }}</h3>
        <div class="unlocks-grid">
          <ItemTile
            v-for="item in group.items"
            :key="item.id"
            :name="item.name"
            :swatch-color="getSwatchColor(item)"
            :owned="item.owned"
          >
            <template #hover>
              <HoverCard
                :title="item.name"
                :fields="getFields(item)"
                :accent-color="getSwatchColor(item)"
                api-endpoint-path="items"
                :api-endpoint-id="getItemApiId(item)"
                :item-icon-url="getItemIcon(item)"
              />
            </template>
          </ItemTile>
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
