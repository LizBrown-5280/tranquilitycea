<script setup lang="ts">
import { computed } from 'vue'
import type {
  CanastaHandInputs,
  CanastaHandTotals as CanastaHandTotalsData,
  CanastaSessionType,
  CanastaTeamId,
} from '@/types/canasta'
import CanastaHandScoring from '@/components/canasta/CanastaHandScoring.vue'
import CanastaHandTotals from '@/components/canasta/CanastaHandTotals.vue'

const props = defineProps<{
  teamId: CanastaTeamId
  teamLabel: string
  sessionType: CanastaSessionType
  modelValue: CanastaHandInputs
  totals: CanastaHandTotalsData
  wentOutDisabled: boolean
  isReadOnly?: boolean
  tooltipsEnabled?: boolean
  handLabel?: string
}>()

const isReadOnly = computed(() => Boolean(props.isReadOnly))
const tooltipsEnabled = computed(() => props.tooltipsEnabled !== false)

const emit = defineEmits<{
  'update:modelValue': [value: CanastaHandInputs]
  save: []
}>()

const showManualTotalsOnly = computed(() => {
  if (props.sessionType === 'totalScoresOnly') return true
  if (props.sessionType === 'myTeamOnly' && props.teamId === 'teamThey') return true
  return false
})

const showFullScoringSections = computed(() => !showManualTotalsOnly.value)
</script>

<template>
  <section class="hand-form" :aria-label="`${teamLabel} scoring form`">
    <div class="hand-form-header">
      <h3>{{ teamLabel }}</h3>
      <span v-if="handLabel" class="hand-label">{{ handLabel }}</span>
    </div>

    <fieldset class="hand-form-fieldset" :disabled="isReadOnly" @focusout="emit('save')">
      <CanastaHandScoring
        v-if="showFullScoringSections"
        :model-value="modelValue"
        :went-out-disabled="wentOutDisabled"
        :tooltips-enabled="tooltipsEnabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <CanastaHandTotals
        :model-value="modelValue"
        :totals="totals"
        :show-manual-totals-only="showManualTotalsOnly"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </fieldset>
  </section>
</template>

<style scoped>
.hand-form {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 0.85rem;
  background: var(--ui-card);
  display: grid;
  gap: 0.9rem;
}

.hand-form-fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  min-inline-size: 0;
  display: grid;
  gap: 0.9rem;
}

h3 {
  margin: 0;
  font-size: 1rem;
}

.hand-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.hand-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ui-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
</style>
