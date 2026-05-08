<script setup lang="ts">
import type { CanastaTabId } from '@/types/canasta'
import { HAND_TABS, TOTALS_TAB } from '@/services/canasta/canastaConstants'

defineProps<{
  activeTab: CanastaTabId
  isTransitioning: boolean
}>()

const emit = defineEmits<{
  updateTab: [tabId: CanastaTabId]
}>()

function handleTabClick(tabId: CanastaTabId) {
  emit('updateTab', tabId)
}
</script>

<template>
  <nav class="tab-row" aria-label="Canasta score tabs">
    <div class="tab-group" aria-label="Hand tabs">
      <p class="tab-group-title">Hands</p>
      <div class="hand-pill-row">
        <button
          v-for="tab in HAND_TABS"
          :key="tab.id"
          type="button"
          class="tab-pill tab-pill--hand"
          :class="{ 'tab-pill--active': activeTab === tab.id }"
          :disabled="isTransitioning"
          @click="handleTabClick(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <button
      type="button"
      class="tab-pill tab-pill--totals"
      :class="{ 'tab-pill--active': activeTab === TOTALS_TAB.id }"
      :disabled="isTransitioning"
      @click="handleTabClick(TOTALS_TAB.id)"
    >
      {{ TOTALS_TAB.label }}
    </button>
  </nav>
</template>

<style scoped>
.tab-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
}

.tab-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  background: var(--ui-bg);
  border-radius: 12px;
  border: 1px solid var(--ui-border);
}

.tab-group-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  color: var(--text-secondary);
}

.hand-pill-row {
  display: flex;
  gap: 0.75rem;
}

.tab-pill {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--ui-border);
  border-radius: 50%;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: center;
  flex-shrink: 0;
}

.tab-pill--active,
.tab-pill--active:hover {
  background: #17455a;
  color: #ffffff;
  border-color: #17455a;
  font-weight: 700;
}

.tab-pill:hover:not(:disabled):not(.tab-pill--active) {
  border-color: #1f6f8b;
  background: #ddeef6;
}

.tab-pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tab-pill--totals {
  width: auto;
  height: auto;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
}

@media (max-width: 410px) {
  .tab-row {
    grid-template-columns: 1fr;
    justify-items: center;
  }
}
</style>
