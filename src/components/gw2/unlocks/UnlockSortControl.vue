<script setup lang="ts">
import type { UnlockSortMode } from '@/services/gw2/unlockCategoryViewModel'

interface Props {
  modelValue: UnlockSortMode
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: UnlockSortMode]
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (!target) {
    return
  }

  emit('update:modelValue', target.value as UnlockSortMode)
}
</script>

<template>
  <label class="unlock-sort-control">
    <span class="unlock-sort-control__label">Sort</span>
    <select class="unlock-sort-control__select" :value="props.modelValue" @change="handleChange">
      <option value="alphabetical">Alphabetical</option>
      <option value="order">Order number</option>
    </select>
  </label>
</template>

<style scoped>
.unlock-sort-control {
  display: inline-grid;
  gap: 0.25rem;
}

.unlock-sort-control__label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
}

.unlock-sort-control__select {
  min-width: 180px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: #fff;
  color: var(--ui-text);
  padding: 0.45rem 0.6rem;
  font: inherit;
}

.unlock-sort-control__select:focus-visible {
  outline: 2px solid #17455a;
  outline-offset: 2px;
}
</style>
