<script setup lang="ts">
import { canastaTooltipContent, type CanastaTooltipKey } from '@/content/canastaTooltips'

const props = defineProps<{
  tooltipKey: CanastaTooltipKey
  labels: Record<CanastaTooltipKey, string>
}>()

const emit = defineEmits<{
  close: []
}>()

const fallbackMessage = 'Add tooltip text in src/content/canastaTooltips.ts.'
</script>

<template>
  <div class="tooltip-overlay" data-tooltip-modal @click="emit('close')">
    <div
      class="tooltip-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`tooltip-title-${tooltipKey}`"
      @click.stop
    >
      <div class="tooltip-modal__header">
        <h5 :id="`tooltip-title-${tooltipKey}`">{{ props.labels[tooltipKey] }}</h5>
        <button
          type="button"
          class="tooltip-close"
          aria-label="Close info popup"
          @click="emit('close')"
        >
          x
        </button>
      </div>
      <p class="tooltip-copy">
        {{ canastaTooltipContent[tooltipKey] || fallbackMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
h5 {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ui-text);
}

.tooltip-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.42);
}

.tooltip-modal {
  width: min(100%, 28rem);
  max-height: min(80vh, 34rem);
  overflow-y: auto;
  border-radius: 16px;
  padding: 1rem 1rem 1.1rem;
  background: #fff;
  color: var(--ui-text);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.tooltip-modal__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tooltip-close {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  padding: 0;
  background: #fff;
  color: var(--ui-muted);
  font-size: 1rem;
  line-height: 1;
}

.tooltip-copy {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-line;
}

@media (max-width: 420px) {
  .tooltip-overlay {
    align-items: end;
    padding: 0.5rem;
  }

  .tooltip-modal {
    width: 100%;
    max-height: 72vh;
    border-radius: 18px 18px 0 0;
    padding-bottom: 1.25rem;
  }
}
</style>
