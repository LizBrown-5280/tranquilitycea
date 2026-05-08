<script setup lang="ts">
import { ref } from 'vue'
import type { CanastaSessionEnvelope } from '@/types/canasta'
import { formatSessionLabel } from '@/services/canasta/sessionHelpers'

defineProps<{
  currentSessionOption: CanastaSessionEnvelope | null
  previousSessionOptions: CanastaSessionEnvelope[]
  allStoredSessions: CanastaSessionEnvelope[]
  retentionDays: number
  isTransitioning: boolean
}>()

const emit = defineEmits<{
  newSession: []
  loadCurrentSession: []
  loadPreviousSession: [sessionId: number]
  deleteAllSessions: []
}>()

const selectedPreviousSessionId = ref('')

function handleNewSession() {
  emit('newSession')
}

function handleLoadCurrent() {
  emit('loadCurrentSession')
}

function handleLoadPrevious() {
  if (!selectedPreviousSessionId.value) return
  const sessionId = Number(selectedPreviousSessionId.value)
  emit('loadPreviousSession', sessionId)
  selectedPreviousSessionId.value = ''
}

function handleDeleteAll() {
  emit('deleteAllSessions')
}
</script>

<template>
  <section class="session-chooser" :aria-hidden="isTransitioning">
    <h2>Sessions</h2>
    <p class="session-chooser-help">
      Start a new game, continue your current session, or review an archived one.
    </p>

    <div class="session-chooser-actions">
      <button
        type="button"
        class="chooser-button chooser-button--primary"
        data-test="new-session-button"
        :disabled="isTransitioning"
        @click="handleNewSession"
      >
        New Session
      </button>

      <div v-if="currentSessionOption" class="current-session-option">
        <button
          type="button"
          class="chooser-button"
          data-test="current-session-button"
          :disabled="isTransitioning"
          @click="handleLoadCurrent"
        >
          <span>Current Session</span>
          <span class="current-session-timestamp">
            Started {{ formatSessionLabel(currentSessionOption) }}
          </span>
        </button>
      </div>

      <div v-if="previousSessionOptions.length > 0" class="previous-session-picker">
        <label for="previous-session-select"> Archived Sessions ({{ retentionDays }} days) </label>
        <select
          id="previous-session-select"
          v-model="selectedPreviousSessionId"
          data-test="previous-session-select"
          :disabled="isTransitioning"
        >
          <option value="">Select an archived session</option>
          <option
            v-for="session in previousSessionOptions"
            :key="session.sessionId"
            :value="session.sessionId"
          >
            {{ formatSessionLabel(session) }}
          </option>
        </select>
        <button
          type="button"
          class="chooser-button"
          data-test="open-previous-session-button"
          :disabled="!selectedPreviousSessionId || isTransitioning"
          @click="handleLoadPrevious"
        >
          Open
        </button>
      </div>

      <button
        type="button"
        class="chooser-button chooser-button--danger"
        data-test="delete-sessions-button"
        :disabled="isTransitioning"
        @click="handleDeleteAll"
      >
        <span>Delete All Stored Sessions</span>
        <span class="current-session-timestamp">
          {{ allStoredSessions.length }} session{{ allStoredSessions.length === 1 ? '' : 's' }}
          stored
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.session-chooser {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--ui-card);
  display: grid;
  gap: 0.8rem;
  max-width: 550px;
  margin: 0 auto;
}

.session-chooser h2 {
  margin: 0;
  font-size: 1rem;
}

.session-chooser-help {
  margin: 0;
  color: var(--ui-muted);
  font-size: 0.88rem;
}

.session-chooser-actions {
  display: grid;
  gap: 0.6rem;
}

.current-session-option {
  display: grid;
  gap: 0.2rem;
}

.chooser-button .current-session-timestamp {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--ui-muted);
  margin-top: 0.1rem;
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

.chooser-button--danger {
  background: linear-gradient(140deg, rgba(255, 244, 244, 0.95), rgba(255, 250, 250, 0.95));
  border-color: #dfb5b5;
  color: #7e2f2f;
}

.previous-session-picker {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.35rem 0.5rem;
  margin-top: 0.5rem;
}

.previous-session-picker label {
  grid-column: 1 / -1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ui-muted);
}

.previous-session-picker select {
  min-height: 40px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0 0.5rem;
  background: #fff;
}
</style>
