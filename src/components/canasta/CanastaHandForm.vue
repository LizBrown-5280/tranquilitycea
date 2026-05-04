<script setup lang="ts">
import { ref } from 'vue'
import { canastaTooltipContent, type CanastaTooltipKey } from '@/content/canastaTooltips'
import type { CanastaHandInputs, CanastaHandTotals } from '@/types/canasta'

const props = defineProps<{
  teamLabel: string
  modelValue: CanastaHandInputs
  totals: CanastaHandTotals
  wentOutDisabled: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CanastaHandInputs]
}>()

const tooltipLabels: Record<CanastaTooltipKey, string> = {
  bigCount: 'Big Count',
  wentOutFirst: 'Went Out First',
  allRequirementsMet: 'All Requirements Met',
  canastaCounts: 'Canasta Counts',
  redThrees: 'Red 3s',
  cardCount: 'Card Count',
  fastCount: 'Fast Count',
  remainingCount: 'Remaining Count',
  penaltyCount: 'Penalty Count',
  cardsNotPlayed: 'Cards Not Played',
}

const tooltipFallbackMessage = 'Add tooltip text in src/content/canastaTooltips.ts.'

const cardCountDisplay = ref<string>(formatInputDisplay(props.modelValue.cardCount))
const penaltyCountDisplay = ref<string>(formatInputDisplay(props.modelValue.penaltyCount))
const activeTooltip = ref<CanastaTooltipKey | null>(null)

function parseNonNegativeInteger(rawValue: string | number | null | undefined): number {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.trunc(parsed))
}

function formatInputDisplay(value: number | null | undefined): string {
  const parsed = parseNonNegativeInteger(value)
  return parsed === 0 ? '' : String(parsed)
}

function formatCardDisplay(value: number | null | undefined): string {
  const parsed = parseNonNegativeInteger(value)
  return parsed === 0 ? '' : formatNumber(parsed)
}

function updateField<K extends keyof CanastaHandInputs>(field: K, value: CanastaHandInputs[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  })
}

function onNumberInput<K extends keyof CanastaHandInputs>(field: K, rawValue: string | number) {
  const parsed = parseNonNegativeInteger(rawValue) as CanastaHandInputs[K]
  updateField(field, parsed)
}

function onToggleAllRequirements(checked: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    allRequirements: checked,
  })
}

function onToggleWentOut(checked: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    wentOut: checked,
  })
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function onCardCountInput(event: Event, field: 'cardCount' | 'penaltyCount') {
  const target = event.target as HTMLInputElement
  const cleanedValue = target.value.replace(/,/g, '')
  onNumberInput(field, cleanedValue)
  if (field === 'cardCount') {
    cardCountDisplay.value = cleanedValue
  } else {
    penaltyCountDisplay.value = cleanedValue
  }
}

function onCardCountBlur(event: Event, field: 'cardCount' | 'penaltyCount') {
  const target = event.target as HTMLInputElement
  const cleanedValue = target.value.replace(/,/g, '')
  const value = parseNonNegativeInteger(cleanedValue)
  const formatted = formatCardDisplay(value)
  if (field === 'cardCount') {
    cardCountDisplay.value = formatted
  } else {
    penaltyCountDisplay.value = formatted
  }
  target.value = formatted
}

function onCardCountFocus(event: Event, field: 'cardCount' | 'penaltyCount') {
  const target = event.target as HTMLInputElement
  const cleanedValue = target.value.replace(/,/g, '')
  target.value = cleanedValue
  if (field === 'cardCount') {
    cardCountDisplay.value = cleanedValue
  } else {
    penaltyCountDisplay.value = cleanedValue
  }
}

function openTooltip(key: CanastaTooltipKey) {
  activeTooltip.value = key
}

function closeTooltip() {
  activeTooltip.value = null
}
</script>

<template>
  <section class="hand-form" :aria-label="`${teamLabel} scoring form`">
    <h3>{{ teamLabel }}</h3>

    <div class="section-block">
      <h4 class="title-with-info title-with-info--section">
        <span>Big Count</span>
        <button
          type="button"
          class="info-button"
          aria-label="Show Big Count info"
          data-tooltip-trigger="bigCount"
          @click="openTooltip('bigCount')"
        >
          i
        </button>
      </h4>

      <div class="subsection-block">
        <label class="requirements-toggle">
          <input
            :checked="modelValue.wentOut"
            :disabled="wentOutDisabled"
            type="checkbox"
            @change="onToggleWentOut(($event.target as HTMLInputElement).checked)"
          />
          <span class="title-with-info title-with-info--inline">
            <span>Went Out First</span>
            <button
              type="button"
              class="info-button"
              aria-label="Show Went Out First info"
              data-tooltip-trigger="wentOutFirst"
              @click.stop.prevent="openTooltip('wentOutFirst')"
            >
              i
            </button>
          </span>
        </label>
        <label class="requirements-toggle">
          <input
            :checked="modelValue.allRequirements"
            type="checkbox"
            @change="onToggleAllRequirements(($event.target as HTMLInputElement).checked)"
          />
          <span class="title-with-info title-with-info--inline">
            <span>All Requirements Met</span>
            <button
              type="button"
              class="info-button"
              aria-label="Show All Requirements Met info"
              data-tooltip-trigger="allRequirementsMet"
              @click.stop.prevent="openTooltip('allRequirementsMet')"
            >
              i
            </button>
          </span>
        </label>

        <div class="count-group-box">
          <h5 class="book-counts-heading title-with-info">
            <span>Canasta Counts</span>
            <button
              type="button"
              class="info-button"
              aria-label="Show Canasta Counts info"
              data-tooltip-trigger="canastaCounts"
              @click="openTooltip('canastaCounts')"
            >
              i
            </button>
          </h5>

          <div class="requirements-grid requirements-grid--row1">
            <label class="field">
              <span>7s</span>
              <input
                class="book-value-input"
                :value="formatInputDisplay(modelValue.requirement7s)"
                type="number"
                inputmode="numeric"
                min="0"
                max="9"
                @input="onNumberInput('requirement7s', ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label class="field">
              <span>5s</span>
              <input
                class="book-value-input"
                :value="formatInputDisplay(modelValue.requirement5s)"
                type="number"
                inputmode="numeric"
                min="0"
                max="9"
                @input="onNumberInput('requirement5s', ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label class="field">
              <span>Wilds</span>
              <input
                class="book-value-input"
                :value="formatInputDisplay(modelValue.requirementWilds)"
                type="number"
                inputmode="numeric"
                min="0"
                max="9"
                @input="
                  onNumberInput('requirementWilds', ($event.target as HTMLInputElement).value)
                "
              />
            </label>
            <label class="field">
              <span>Cleans</span>
              <input
                class="book-value-input"
                :value="formatInputDisplay(modelValue.requirementCleans)"
                type="number"
                inputmode="numeric"
                min="0"
                max="9"
                @input="
                  onNumberInput('requirementCleans', ($event.target as HTMLInputElement).value)
                "
              />
            </label>
            <label class="field">
              <span>Dirties</span>
              <input
                class="book-value-input"
                :value="formatInputDisplay(modelValue.requirementDirtys)"
                type="number"
                inputmode="numeric"
                min="0"
                max="9"
                @input="
                  onNumberInput('requirementDirtys', ($event.target as HTMLInputElement).value)
                "
              />
            </label>
          </div>
        </div>
      </div>

      <div class="subsection-block">
        <div class="count-group-box">
          <h5 class="title-with-info">
            <span>Red 3s</span>
            <button
              type="button"
              class="info-button"
              aria-label="Show Red 3s info"
              data-tooltip-trigger="redThrees"
              @click="openTooltip('redThrees')"
            >
              i
            </button>
          </h5>
          <div class="face-value-row">
            <label class="field">
              <input
                class="card-count-input"
                :value="formatInputDisplay(modelValue.red3s)"
                type="number"
                inputmode="numeric"
                min="0"
                @input="onNumberInput('red3s', ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="section-block">
      <h4 class="title-with-info title-with-info--section">
        <span>Card Count</span>
        <button
          type="button"
          class="info-button"
          aria-label="Show Card Count info"
          data-tooltip-trigger="cardCount"
          @click="openTooltip('cardCount')"
        >
          i
        </button>
      </h4>
      <div class="face-value-grid">
        <div class="subsection-block subsection-block--fast-count">
          <div class="count-group-box">
            <h5 class="h5--red title-with-info">
              <span>Fast Count</span>
              <button
                type="button"
                class="info-button info-button--red"
                aria-label="Show Fast Count info"
                data-tooltip-trigger="fastCount"
                @click="openTooltip('fastCount')"
              >
                i
              </button>
            </h5>
            <div class="face-value-row">
              <label class="field">
                <span>10pt</span>
                <input
                  class="book-value-input"
                  :value="formatInputDisplay(modelValue.fastClean10Books)"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  @input="
                    onNumberInput('fastClean10Books', ($event.target as HTMLInputElement).value)
                  "
                />
              </label>
              <label class="field">
                <span>5pt</span>
                <input
                  class="book-value-input"
                  :value="formatInputDisplay(modelValue.fastClean5Books)"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  @input="
                    onNumberInput('fastClean5Books', ($event.target as HTMLInputElement).value)
                  "
                />
              </label>
              <label class="field">
                <span>As</span>
                <input
                  class="book-value-input"
                  :value="formatInputDisplay(modelValue.fastCleanABooks)"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  @input="
                    onNumberInput('fastCleanABooks', ($event.target as HTMLInputElement).value)
                  "
                />
              </label>
            </div>
          </div>
        </div>

        <div class="subsection-block subsection-block--card-row">
          <div class="count-group-box">
            <h5 class="title-with-info">
              <span>Remaining Count</span>
              <button
                type="button"
                class="info-button"
                aria-label="Show Remaining Count info"
                data-tooltip-trigger="remainingCount"
                @click="openTooltip('remainingCount')"
              >
                i
              </button>
            </h5>
            <div class="face-value-row">
              <label class="field">
                <input
                  class="card-count-input"
                  :value="cardCountDisplay"
                  type="text"
                  inputmode="numeric"
                  min="0"
                  @input="onCardCountInput($event, 'cardCount')"
                  @blur="onCardCountBlur($event, 'cardCount')"
                  @focus="onCardCountFocus($event, 'cardCount')"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-block">
      <h4 class="title-with-info title-with-info--section">
        <span>Penalty Count</span>
        <button
          type="button"
          class="info-button"
          aria-label="Show Penalty Count info"
          data-tooltip-trigger="penaltyCount"
          @click="openTooltip('penaltyCount')"
        >
          i
        </button>
      </h4>
      <div class="subsection-block">
        <div class="count-group-box">
          <h5 class="title-with-info">
            <span>Cards Not Played</span>
            <button
              type="button"
              class="info-button"
              aria-label="Show Cards Not Played info"
              data-tooltip-trigger="cardsNotPlayed"
              @click="openTooltip('cardsNotPlayed')"
            >
              i
            </button>
          </h5>
          <div class="face-value-row">
            <label class="field">
              <input
                class="card-count-input"
                :value="penaltyCountDisplay"
                type="text"
                inputmode="numeric"
                min="0"
                @input="onCardCountInput($event, 'penaltyCount')"
                @blur="onCardCountBlur($event, 'penaltyCount')"
                @focus="onCardCountFocus($event, 'penaltyCount')"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTooltip" class="tooltip-overlay" data-tooltip-modal @click="closeTooltip">
      <div
        class="tooltip-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`tooltip-title-${activeTooltip}`"
        @click.stop
      >
        <div class="tooltip-modal__header">
          <h5 :id="`tooltip-title-${activeTooltip}`">{{ tooltipLabels[activeTooltip] }}</h5>
          <button
            type="button"
            class="tooltip-close"
            aria-label="Close info popup"
            @click="closeTooltip"
          >
            x
          </button>
        </div>
        <p class="tooltip-copy">
          {{ canastaTooltipContent[activeTooltip] || tooltipFallbackMessage }}
        </p>
      </div>
    </div>

    <div class="totals-block">
      <h4>Totals</h4>
      <div class="totals-grid">
        <div class="total-row">
          <span>Big Count</span>
          <div class="total-value-group">
            <span class="total-operator"></span>
            <strong class="total-value">{{ formatNumber(totals.bigCount) }}</strong>
          </div>
        </div>
        <div class="total-row">
          <span>Card Count</span>
          <div class="total-value-group">
            <span class="total-operator">+</span>
            <strong class="total-value">{{
              formatNumber(totals.fastCount + totals.cardCount)
            }}</strong>
          </div>
        </div>
        <div class="total-row">
          <span>Penalty Count</span>
          <div class="total-value-group">
            <span class="total-operator">−</span>
            <strong class="total-value">{{ formatNumber(totals.penaltyCount) }}</strong>
          </div>
        </div>
        <div class="total-row total-row--emphasis">
          <span>Total of All</span>
          <div class="total-value-group">
            <span class="total-operator">=</span>
            <strong class="total-value">{{ formatNumber(totals.total) }}</strong>
          </div>
        </div>
      </div>
    </div>
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

h3,
h4,
h5 {
  margin: 0;
}

h3 {
  font-size: 1rem;
}

h4 {
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

h5 {
  font-size: 0.85rem;
  color: var(--ui-text);
}

.section-block,
.subsection-block,
.totals-block {
  display: grid;
  gap: 0.6rem;
}

.section-block > :not(h4),
.totals-block > :not(h4) {
  padding-left: 20px;
}

.helper-text {
  margin: 0;
  font-size: 0.78rem;
  color: var(--ui-muted);
}

.title-with-info {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.title-with-info--section {
  justify-content: flex-start;
}

.h5--red {
  color: #c0392b;
}

.info-button {
  width: 0.9rem;
  height: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  padding: 0;
  align-self: flex-start;
  background: #fff;
  color: var(--ui-muted);
  font-size: 0.45rem;
  font-weight: 700;
  line-height: 1;
}

.info-button--red {
  color: #c0392b;
  border-color: #d9a39c;
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

.requirements-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.requirements-grid--row1 {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.requirements-grid--row2 {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.requirements-grid--row1 .field {
  flex: 0 0 72px;
  min-width: 0;
  overflow: hidden;
}

.requirements-grid--row1 .field span {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.requirements-grid--row2 .field {
  flex: 0 0 130px;
}

.requirements-grid--row2 .field span {
  white-space: nowrap;
}

.requirements-grid--row1 .field input {
  width: 100%;
  min-height: 36px;
  text-align: center;
  padding: 0.3rem 0.35rem;
}

.requirements-grid--row2 .field input {
  min-height: 36px;
  text-align: center;
  padding: 0.3rem 0.35rem;
}

.requirements-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ui-muted);
}

.requirements-toggle span {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
}

.requirements-toggle span.title-with-info--inline {
  flex: 0 1 auto;
}

.requirements-toggle input {
  width: 1.1rem;
  height: 1.1rem;
}

.requirements-toggle strong {
  margin-left: auto;
  text-align: right;
  color: var(--ui-text);
}

.face-value-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.subsection-block--fast-count {
  grid-column: 1 / -1;
}

.subsection-block--card-row {
  grid-column: 1 / -1;
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.face-value-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.count-group-box {
  flex: 1;
  display: grid;
  gap: 0.45rem;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.45rem;
  background: #f7fbff;
}

.count-group-box--wide {
  flex: 1;
}

.face-value-row .field {
  flex: 0 0 75px;
}

.face-value-row .field input:not(.card-count-input) {
  width: 75px;
}

.field {
  display: grid;
  gap: 0.28rem;
}

.field span {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--ui-muted);
  text-align: center;
}

.field input {
  width: 65px;
  min-height: 40px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.48rem 0.6rem;
  background: #fff;
  color: var(--ui-text);
}

.book-value-input {
  text-align: center;
}

.card-count-input {
  width: 90px !important;
  text-align: right;
}

.field--checkbox {
  align-content: end;
}

.field--checkbox input {
  width: 65px;
  min-height: auto;
  height: 1.1rem;
  padding: 0;
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

@media (max-width: 420px) {
  .requirements-grid:not(.requirements-grid--row1):not(.requirements-grid--row2),
  .face-value-grid {
    grid-template-columns: 1fr;
  }

  .subsection-block--card-row {
    flex-direction: column;
  }

  .count-group-box,
  .count-group-box--wide {
    width: 100%;
  }

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
