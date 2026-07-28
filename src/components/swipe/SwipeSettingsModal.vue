<script setup lang="ts">
defineProps<{
  isShowing: boolean
  retentionDays: number
  tooltipsEnabled: boolean
}>()

const emit = defineEmits<{
  close: []
  updateRetention: [days: number]
  updateTooltips: [enabled: boolean]
}>()

function handleRetentionChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  emit('updateRetention', value)
}

function handleTooltipsChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  emit('updateTooltips', checked)
}
</script>

<template>
  <section v-if="isShowing" class="session-modal-overlay" data-test="swipe-settings-panel">
    <div
      class="session-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="swipe-settings-title"
    >
      <h3 id="swipe-settings-title">Settings</h3>

      <div class="settings-fields">
        <label class="settings-field" for="swipe-settings-retention-days">
          <span class="settings-field__label">Keep history for</span>
          <select
            id="swipe-settings-retention-days"
            :value="retentionDays"
            data-test="swipe-settings-retention-select"
            @change="handleRetentionChange"
          >
            <option :value="7">7 days</option>
            <option :value="30">30 days</option>
            <option :value="60">60 days</option>
            <option :value="90">90 days</option>
            <option :value="180">180 days</option>
            <option :value="365">1 year</option>
          </select>
        </label>

        <label class="settings-field settings-field--toggle" for="swipe-settings-tooltips-enabled">
          <span class="settings-field__label">Show scoring tips</span>
          <input
            id="swipe-settings-tooltips-enabled"
            :checked="tooltipsEnabled"
            type="checkbox"
            data-test="swipe-settings-tooltips-toggle"
            @change="handleTooltipsChange"
          />
        </label>
      </div>

      <div class="session-modal-actions">
        <button
          type="button"
          class="chooser-button chooser-button--primary"
          data-test="swipe-settings-close-button"
          @click="emit('close')"
        >
          Done
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.session-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.session-modal {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.session-modal h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
}

.settings-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-field__label {
  font-weight: 500;
  font-size: 0.9rem;
}

.settings-field select {
  padding: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  font-size: 0.9rem;
}

.settings-field--toggle {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.settings-field--toggle input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.session-modal-actions {
  display: flex;
  gap: 0.75rem;
}

.chooser-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.chooser-button:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}

.chooser-button--primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.chooser-button--primary:hover {
  background: var(--primary-dark);
}
</style>
