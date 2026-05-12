<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'

const gw2 = useGw2BootstrapStore()

const hasAccountKey = computed(() => gw2.apiKey.trim().length > 0)
</script>

<template>
  <section class="inventory-storage">
    <header class="inventory-storage__header">
      <h2>Inventory Storage</h2>
      <p>
        Bank and material storage now live on their own pages so long collections stay easier to
        scan, sort through, and expand later.
      </p>
    </header>

    <p v-if="!hasAccountKey" class="inventory-storage__empty">
      Add an API key with the inventories scope to load bank and material storage.
    </p>

    <div v-else class="inventory-storage__cards">
      <RouterLink class="inventory-card" to="/guildwars2/account/inventories/bank">
        <span class="inventory-card__eyebrow">Inventory Storage</span>
        <strong class="inventory-card__title">Bank</strong>
        <span class="inventory-card__meta"
          >{{ gw2.bankItems.length.toLocaleString() }} occupied slots</span
        >
        <p class="inventory-card__body">
          Review stack sizes, item metadata, and related-item chains from the bank on a dedicated
          page.
        </p>
      </RouterLink>

      <RouterLink class="inventory-card" to="/guildwars2/account/inventories/materials">
        <span class="inventory-card__eyebrow">Inventory Storage</span>
        <strong class="inventory-card__title">Materials</strong>
        <span class="inventory-card__meta"
          >{{ gw2.materialItems.length.toLocaleString() }} stored types</span
        >
        <p class="inventory-card__body">
          Browse stored materials separately with room for larger catalogs, category grouping, and
          richer hover details.
        </p>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.inventory-storage {
  display: grid;
  gap: 1rem;
}

.inventory-storage__header {
  display: grid;
  gap: 0.3rem;
}

.inventory-storage__header h2 {
  margin: 0;
}

.inventory-storage__header p,
.inventory-storage__empty {
  margin: 0;
  color: var(--ui-muted);
}

.inventory-storage__cards {
  display: grid;
  gap: 0.75rem;
}

.inventory-card {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #f7fbfd);
  color: var(--ui-text);
  text-decoration: none;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.inventory-card:hover,
.inventory-card:focus-visible {
  border-color: #17455a;
  box-shadow: 0 10px 22px rgb(23 69 90 / 10%);
  transform: translateY(-1px);
}

.inventory-card__eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ui-muted);
  font-weight: 700;
}

.inventory-card__title {
  font-size: 1.05rem;
}

.inventory-card__meta,
.inventory-card__body {
  color: var(--ui-muted);
}

.inventory-card__body {
  margin: 0;
}

@media (min-width: 760px) {
  .inventory-storage__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
