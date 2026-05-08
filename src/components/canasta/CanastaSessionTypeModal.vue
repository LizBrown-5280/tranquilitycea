<script setup lang="ts">
import type { CanastaSessionType } from '@/types/canasta'
import { SESSION_TYPE_OPTIONS } from '@/services/canasta/canastaConstants'

defineProps<{
  isShowing: boolean
  selectedType: CanastaSessionType
}>()

const emit = defineEmits<{
  close: []
  updateType: [type: CanastaSessionType]
  confirm: []
}>()
</script>

<template>
  <section v-if="isShowing" class="session-modal-overlay" data-test="session-type-modal">
    <div class="session-modal" role="dialog" aria-modal="true" aria-labelledby="session-type-title">
      <h3 id="session-type-title">How would you like to track this game?</h3>

      <div class="session-type-options">
        <label v-for="option in SESSION_TYPE_OPTIONS" :key="option.id" class="session-type-option">
          <input
            type="radio"
            name="session-type"
            :value="option.id"
            :checked="selectedType === option.id"
            @change="emit('updateType', option.id)"
          />
          <span>{{ option.label }}</span>
        </label>
      </div>

      <div class="session-modal-actions">
        <button
          type="button"
          class="chooser-button chooser-button--primary"
          data-test="start-session-button"
          @click="emit('confirm')"
        >
          Start Session
        </button>
        <button type="button" class="chooser-button" @click="emit('close')">Cancel</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.session-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
}

.session-modal {
  width: min(100%, 32rem);
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: #fff;
  padding: 1rem;
  display: grid;
  gap: 0.8rem;
}

.session-modal h3 {
  margin: 0;
  font-size: 1rem;
}

.session-type-options {
  display: grid;
  gap: 0.5rem;
}

.session-type-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.session-type-option span {
  flex: 1;
}

.session-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chooser-button {
  min-height: 44px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--ui-card);
  color: var(--ui-text);
  font-weight: 700;
  padding: 0.45rem 0.7rem;
}

.chooser-button--primary {
  background: linear-gradient(140deg, rgba(221, 239, 249, 0.95), rgba(240, 249, 255, 0.95));
  border-color: #7eb4d4;
}
</style>
