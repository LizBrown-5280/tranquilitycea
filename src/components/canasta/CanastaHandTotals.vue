<script setup lang="ts">
import { computed } from 'vue'
import type { CanastaHandInputs, CanastaHandTotals } from '@/types/canasta'

const props = defineProps<{
  modelValue: CanastaHandInputs
  totals: CanastaHandTotals
  showManualTotalsOnly: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CanastaHandInputs]
}>()

const manualTotal = computed(() => {
  const big = props.modelValue.manualBigCount ?? 0
  const card = props.modelValue.manualCardCount ?? 0
  const penalty = props.modelValue.manualPenaltyCount ?? 0
  return big + card - penalty
})

function parseNonNegativeInteger(rawValue: string | number | null | undefined): number {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.trunc(parsed))
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function updateField<K extends keyof CanastaHandInputs>(field: K, value: CanastaHandInputs[K]) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function onManualTotalInput(
  field: 'manualBigCount' | 'manualCardCount' | 'manualPenaltyCount',
  rawValue: string,
) {
  const trimmedValue = rawValue.trim()
  if (trimmedValue === '') {
    updateField(field, null)
    return
  }
  updateField(field, parseNonNegativeInteger(trimmedValue))
}
</script>

<template>
  <div class="totals-block">
    <h4>Totals</h4>
    <div class="totals-grid">
      <div class="total-row">
        <span>Big Count</span>
        <div class="total-value-group">
          <span class="total-operator"></span>
          <input
            v-if="showManualTotalsOnly"
            class="total-value total-value--input"
            :value="modelValue.manualBigCount ?? ''"
            type="number"
            inputmode="numeric"
            min="0"
            placeholder="0"
            data-test="manual-big-count-input"
            @input="onManualTotalInput('manualBigCount', ($event.target as HTMLInputElement).value)"
          />
          <strong v-else class="total-value">{{ formatNumber(totals.bigCount) }}</strong>
        </div>
      </div>
      <div class="total-row">
        <span>Card Count</span>
        <div class="total-value-group">
          <span class="total-operator">+</span>
          <input
            v-if="showManualTotalsOnly"
            class="total-value total-value--input"
            :value="modelValue.manualCardCount ?? ''"
            type="number"
            inputmode="numeric"
            min="0"
            placeholder="0"
            data-test="manual-card-count-input"
            @input="
              onManualTotalInput('manualCardCount', ($event.target as HTMLInputElement).value)
            "
          />
          <strong v-else class="total-value">{{
            formatNumber(totals.fastCount + totals.cardCount)
          }}</strong>
        </div>
      </div>
      <div class="total-row">
        <span>Penalty Count</span>
        <div class="total-value-group">
          <span class="total-operator">−</span>
          <input
            v-if="showManualTotalsOnly"
            class="total-value total-value--input"
            :value="modelValue.manualPenaltyCount ?? ''"
            type="number"
            inputmode="numeric"
            min="0"
            placeholder="0"
            data-test="manual-penalty-count-input"
            @input="
              onManualTotalInput('manualPenaltyCount', ($event.target as HTMLInputElement).value)
            "
          />
          <strong v-else class="total-value">{{ formatNumber(totals.penaltyCount) }}</strong>
        </div>
      </div>
      <div class="total-row total-row--emphasis">
        <span>Grand Total</span>
        <div class="total-value-group">
          <span class="total-operator">=</span>
          <input
            v-if="showManualTotalsOnly"
            class="total-value total-value--input"
            :value="formatNumber(manualTotal)"
            type="text"
            disabled
            data-test="manual-total-of-all-input"
          />
          <strong v-else class="total-value">{{ formatNumber(totals.total) }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h4 {
  margin: 0;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

.totals-block {
  display: grid;
  gap: 0.6rem;
}

.totals-block > :not(h4) {
  padding-left: 20px;
}

.total-value--input {
  all: unset;
  width: 100px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.36rem 0.5rem;
  background: #f7fbff;
  color: var(--ui-text);
  font-size: 0.9rem;
  font-weight: 700;
  text-align: right;
  box-sizing: border-box;
  cursor: text;
}

.total-value--input:focus {
  outline: 2px solid var(--ui-accent, #1f6f8b);
  outline-offset: 1px;
}

/* Hide browser number input spinners */
.total-value--input::-webkit-inner-spin-button,
.total-value--input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.total-value--input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.totals-grid {
  display: grid;
  gap: 0.45rem;
}

.total-row {
  display: grid;
  grid-template-columns: 1fr minmax(100px, 130px);
  align-items: center;
  gap: 0.6rem;
}

.total-value-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.total-operator {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ui-muted);
  width: 0.9rem;
  text-align: center;
}

.total-row span {
  font-size: 0.8rem;
  font-weight: 600;
}

.total-value {
  width: 100px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.36rem 0.5rem;
  background: #f7fbff;
  color: var(--ui-text);
  font-size: 0.9rem;
}

.total-row--emphasis span {
  color: #1f6f8b;
}
</style>
