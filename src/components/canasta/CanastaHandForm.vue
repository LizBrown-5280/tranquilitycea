<script setup lang="ts">
import { ref } from 'vue'
import type { CanastaHandInputs, CanastaHandTotals } from '@/types/canasta'

const props = defineProps<{
  teamLabel: string
  modelValue: CanastaHandInputs
  totals: CanastaHandTotals
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CanastaHandInputs]
}>()

const cardCountDisplay = ref<string>(String(props.modelValue.cardCount))
const negCountDisplay = ref<string>(String(props.modelValue.negCount))

function parseNonNegativeInteger(rawValue: string | number): number {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.trunc(parsed))
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
    requirement7s: checked ? 1 : 0,
    requirement5s: checked ? 1 : 0,
    requirementWilds: checked ? 1 : 0,
    requirementCleans: checked ? 1 : 0,
    requirementDirtys: checked ? 1 : 0,
  })
}

function onToggleWentOut(checked: boolean) {
  updateField('wentOut', checked)
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function onCardCountInput(event: Event, field: 'cardCount' | 'negCount') {
  const target = event.target as HTMLInputElement
  const cleanedValue = target.value.replace(/,/g, '')
  onNumberInput(field, cleanedValue)
  if (field === 'cardCount') {
    cardCountDisplay.value = cleanedValue
  } else {
    negCountDisplay.value = cleanedValue
  }
}

function onCardCountBlur(event: Event, field: 'cardCount' | 'negCount') {
  const target = event.target as HTMLInputElement
  const cleanedValue = target.value.replace(/,/g, '')
  const value = parseNonNegativeInteger(cleanedValue)
  const formatted = formatNumber(value)
  if (field === 'cardCount') {
    cardCountDisplay.value = formatted
  } else {
    negCountDisplay.value = formatted
  }
  target.value = formatted
}

function onCardCountFocus(event: Event, field: 'cardCount' | 'negCount') {
  const target = event.target as HTMLInputElement
  const cleanedValue = target.value.replace(/,/g, '')
  target.value = cleanedValue
  if (field === 'cardCount') {
    cardCountDisplay.value = cleanedValue
  } else {
    negCountDisplay.value = cleanedValue
  }
}
</script>

<template>
  <section class="hand-form" :aria-label="`${teamLabel} scoring form`">
    <h3>{{ teamLabel }}</h3>

    <div class="section-block">
      <h4>Big Count</h4>

      <div class="subsection-block">
        <h5>Requirements</h5>
        <label class="requirements-toggle">
          <input
            :checked="modelValue.wentOut"
            type="checkbox"
            @change="onToggleWentOut(($event.target as HTMLInputElement).checked)"
          />
          <span>Went Out First</span>
        </label>
        <label class="requirements-toggle">
          <input
            :checked="modelValue.allRequirements"
            type="checkbox"
            @change="onToggleAllRequirements(($event.target as HTMLInputElement).checked)"
          />
          <span>All Requirements Met</span>
        </label>

        <div class="requirements-grid requirements-grid--row1">
          <label class="field">
            <span>7&#39;s</span>
            <input
              class="book-value-input"
              :value="modelValue.requirement7s"
              type="number"
              inputmode="numeric"
              min="0"
              max="9"
              @input="onNumberInput('requirement7s', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="field">
            <span>5&#39;s</span>
            <input
              class="book-value-input"
              :value="modelValue.requirement5s"
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
              :value="modelValue.requirementWilds"
              type="number"
              inputmode="numeric"
              min="0"
              max="9"
              @input="onNumberInput('requirementWilds', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="field">
            <span>Cleans</span>
            <input
              class="book-value-input"
              :value="modelValue.requirementCleans"
              type="number"
              inputmode="numeric"
              min="0"
              max="9"
              @input="onNumberInput('requirementCleans', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="field">
            <span>Dirtys</span>
            <input
              class="book-value-input"
              :value="modelValue.requirementDirtys"
              type="number"
              inputmode="numeric"
              min="0"
              max="9"
              @input="onNumberInput('requirementDirtys', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>

      <div class="subsection-block">
        <div class="requirements-grid requirements-grid--row2">
          <label class="field">
            <span>Red 3&#39;s</span>
            <input
              :value="modelValue.red3s"
              type="number"
              inputmode="numeric"
              min="0"
              @input="onNumberInput('red3s', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="field">
            <span>Clean</span>
            <input
              class="book-value-input"
              :value="modelValue.row2CleanBooks"
              type="number"
              inputmode="numeric"
              min="0"
              @input="onNumberInput('row2CleanBooks', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="field">
            <span>Dirty</span>
            <input
              class="book-value-input"
              :value="modelValue.row2DirtyBooks"
              type="number"
              inputmode="numeric"
              min="0"
              @input="onNumberInput('row2DirtyBooks', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>
    </div>

    <div class="section-block">
      <h4>Face Value Count</h4>
      <div class="face-value-grid">
        <div class="subsection-block">
          <h5>Fast Count (by books)</h5>
          <div class="face-value-row">
            <label class="field">
              <span>Clean (10pt)</span>
              <input
                class="book-value-input"
                :value="modelValue.fastClean10Books"
                type="number"
                inputmode="numeric"
                min="0"
                @input="
                  onNumberInput('fastClean10Books', ($event.target as HTMLInputElement).value)
                "
              />
            </label>
            <label class="field">
              <span>Clean (5pt)</span>
              <input
                class="book-value-input"
                :value="modelValue.fastClean5Books"
                type="number"
                inputmode="numeric"
                min="0"
                @input="onNumberInput('fastClean5Books', ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
        </div>

        <div class="subsection-block">
          <h5>Card Totals</h5>
          <div class="face-value-row">
            <label class="field">
              <span>Card Count</span>
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
            <label class="field">
              <span>Neg Count</span>
              <input
                class="card-count-input"
                :value="negCountDisplay"
                type="text"
                inputmode="numeric"
                min="0"
                @input="onCardCountInput($event, 'negCount')"
                @blur="onCardCountBlur($event, 'negCount')"
                @focus="onCardCountFocus($event, 'negCount')"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="totals-block">
      <h4>Totals</h4>
      <div class="totals-grid">
        <div class="total-row">
          <span>Big Count</span>
          <strong class="total-value">{{ formatNumber(totals.bigCount) }}</strong>
        </div>
        <div class="total-row">
          <span>Fast Count</span>
          <strong class="total-value">{{ formatNumber(totals.fastCount) }}</strong>
        </div>
        <div class="total-row">
          <span>Card Count</span>
          <strong class="total-value">{{ formatNumber(totals.cardCount) }}</strong>
        </div>
        <div class="total-row">
          <span>Neg Count</span>
          <strong class="total-value">{{ formatNumber(totals.negCount) }}</strong>
        </div>
        <div class="total-row total-row--emphasis">
          <span>Total of All</span>
          <strong class="total-value">{{ formatNumber(totals.total) }}</strong>
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
}

.requirements-grid--row2 .field {
  flex: 0 0 72px;
}

.requirements-grid--row1 .field input {
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
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ui-muted);
}

.requirements-toggle input {
  width: 1.1rem;
  height: 1.1rem;
}

.face-value-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.face-value-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
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
}
</style>
