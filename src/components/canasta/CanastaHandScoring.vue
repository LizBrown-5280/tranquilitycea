<script setup lang="ts">
import { computed, ref } from 'vue'
import { type CanastaTooltipKey } from '@/content/canastaTooltips'
import type { CanastaHandInputs } from '@/types/canasta'
import CanastaTooltipModal from '@/components/canasta/CanastaTooltipModal.vue'

const props = defineProps<{
  modelValue: CanastaHandInputs
  wentOutDisabled: boolean
  tooltipsEnabled: boolean
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
  remainingCount: 'Remaining Cards',
  penaltyCount: 'Penalty Count',
  cardsNotPlayed: 'Cards Not Played',
}

const cardCountDisplay = ref<string>(formatInputDisplay(props.modelValue.cardCount))
const penaltyCountDisplay = ref<string>(formatInputDisplay(props.modelValue.penaltyCount))
const activeTooltip = ref<CanastaTooltipKey | null>(null)

const wentOutFirstTotal = computed(() => (props.modelValue.wentOut ? 200 : 0))
const allRequirementsMetTotal = computed(() => (props.modelValue.allRequirements ? 11300 : 0))
const canastaCountsTotal = computed(
  () =>
    parseNonNegativeInteger(props.modelValue.requirement7s) * 5000 +
    parseNonNegativeInteger(props.modelValue.requirement5s) * 3000 +
    parseNonNegativeInteger(props.modelValue.requirementWilds) * 2500 +
    parseNonNegativeInteger(props.modelValue.requirementCleans) * 500 +
    parseNonNegativeInteger(props.modelValue.requirementDirtys) * 300,
)
const redThreesTotal = computed(() => {
  const redThrees = parseNonNegativeInteger(props.modelValue.red3s)
  return Math.floor(redThrees / 7) * 1000 + (redThrees % 7) * 100
})
const fastCountTotal = computed(
  () =>
    parseNonNegativeInteger(props.modelValue.fastClean10Books) * 70 +
    parseNonNegativeInteger(props.modelValue.fastClean5Books) * 35 +
    parseNonNegativeInteger(props.modelValue.fastCleanABooks) * 140,
)
const remainingCountTotal = computed(() => parseNonNegativeInteger(props.modelValue.cardCount))
const cardsNotPlayedTotal = computed(() => parseNonNegativeInteger(props.modelValue.penaltyCount))

function parseNonNegativeInteger(rawValue: string | number | null | undefined): number {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) return 0
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

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function updateField<K extends keyof CanastaHandInputs>(field: K, value: CanastaHandInputs[K]) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function onNumberInput<K extends keyof CanastaHandInputs>(field: K, rawValue: string | number) {
  const parsed = parseNonNegativeInteger(rawValue) as CanastaHandInputs[K]
  updateField(field, parsed)
}

function onToggleAllRequirements(checked: boolean) {
  emit('update:modelValue', { ...props.modelValue, allRequirements: checked })
}

function onToggleWentOut(checked: boolean) {
  emit('update:modelValue', { ...props.modelValue, wentOut: checked })
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
  <div class="section-block">
    <h4
      class="title-with-info--section"
      :class="{ 'tooltip-title': tooltipsEnabled }"
      @click="tooltipsEnabled && openTooltip('bigCount')"
    >
      Big Count
    </h4>

    <div class="subsection-block">
      <label class="requirements-toggle">
        <input
          :checked="modelValue.wentOut"
          :disabled="wentOutDisabled"
          type="checkbox"
          @change="onToggleWentOut(($event.target as HTMLInputElement).checked)"
        />
        <span class="label-with-total">
          <span
            :class="{ 'tooltip-title': tooltipsEnabled }"
            @click.stop.prevent="tooltipsEnabled && openTooltip('wentOutFirst')"
            >Went Out First</span
          >
          <strong class="label-total">({{ formatNumber(wentOutFirstTotal) }})</strong>
        </span>
      </label>
      <label class="requirements-toggle">
        <input
          :checked="modelValue.allRequirements"
          type="checkbox"
          @change="onToggleAllRequirements(($event.target as HTMLInputElement).checked)"
        />
        <span class="label-with-total">
          <span
            :class="{ 'tooltip-title': tooltipsEnabled }"
            @click.stop.prevent="tooltipsEnabled && openTooltip('allRequirementsMet')"
            >All Requirements Met</span
          >
          <strong class="label-total">({{ formatNumber(allRequirementsMetTotal) }})</strong>
        </span>
      </label>

      <div class="count-group-box">
        <h5 class="book-counts-heading label-with-total">
          <span
            :class="{ 'tooltip-title': tooltipsEnabled }"
            @click="tooltipsEnabled && openTooltip('canastaCounts')"
            >Canasta Counts</span
          >
          <strong class="label-total">({{ formatNumber(canastaCountsTotal) }})</strong>
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
              max="99"
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
              max="99"
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
              max="99"
              @input="onNumberInput('requirementWilds', ($event.target as HTMLInputElement).value)"
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
              max="99"
              @input="onNumberInput('requirementCleans', ($event.target as HTMLInputElement).value)"
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
              max="99"
              @input="onNumberInput('requirementDirtys', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>
    </div>

    <div class="subsection-block">
      <div class="count-group-box count-group-box--inline">
        <h5 class="label-with-total">
          <span
            :class="{ 'tooltip-title': tooltipsEnabled }"
            @click="tooltipsEnabled && openTooltip('redThrees')"
            >Red 3s</span
          >
          <strong class="label-total">({{ formatNumber(redThreesTotal) }})</strong>
        </h5>
        <label class="field">
          <input
            class="book-value-input"
            :value="formatInputDisplay(modelValue.red3s)"
            type="number"
            inputmode="numeric"
            min="0"
            max="99"
            @input="onNumberInput('red3s', ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>
    </div>
  </div>

  <div class="section-block">
    <h4
      class="title-with-info--section"
      :class="{ 'tooltip-title': tooltipsEnabled }"
      @click="tooltipsEnabled && openTooltip('cardCount')"
    >
      Card Count
    </h4>
    <div class="face-value-grid">
      <div class="subsection-block subsection-block--fast-count">
        <div class="count-group-box count-group-box--inline">
          <h5 class="label-with-total">
            <span
              class="h5--red"
              :class="{ 'tooltip-title': tooltipsEnabled }"
              @click="tooltipsEnabled && openTooltip('fastCount')"
              >Fast Count</span
            >
            <strong class="label-total">({{ formatNumber(fastCountTotal) }})</strong>
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
                @input="onNumberInput('fastClean5Books', ($event.target as HTMLInputElement).value)"
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
                @input="onNumberInput('fastCleanABooks', ($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
        </div>
      </div>

      <div class="subsection-block subsection-block--card-row">
        <div class="count-group-box count-group-box--inline">
          <h5 class="label-with-total">
            <span
              :class="{ 'tooltip-title': tooltipsEnabled }"
              @click="tooltipsEnabled && openTooltip('remainingCount')"
              >Remaining Cards</span
            >
            <strong class="label-total">({{ formatNumber(remainingCountTotal) }})</strong>
          </h5>
          <label class="field">
            <input
              class="card-count-input"
              :value="cardCountDisplay"
              type="text"
              inputmode="numeric"
              min="0"
              maxlength="6"
              @input="onCardCountInput($event, 'cardCount')"
              @blur="onCardCountBlur($event, 'cardCount')"
              @focus="onCardCountFocus($event, 'cardCount')"
            />
          </label>
        </div>
      </div>
    </div>
  </div>

  <div class="section-block">
    <h4
      class="title-with-info--section"
      :class="{ 'tooltip-title': tooltipsEnabled }"
      @click="tooltipsEnabled && openTooltip('penaltyCount')"
    >
      Penalty Count
    </h4>
    <div class="subsection-block">
      <div class="count-group-box count-group-box--inline">
        <h5 class="label-with-total">
          <span
            :class="{ 'tooltip-title': tooltipsEnabled }"
            @click="tooltipsEnabled && openTooltip('cardsNotPlayed')"
            >Cards Not Played</span
          >
          <strong class="label-total">({{ formatNumber(cardsNotPlayedTotal) }})</strong>
        </h5>
        <label class="field">
          <input
            class="card-count-input"
            :value="penaltyCountDisplay"
            type="text"
            inputmode="numeric"
            min="0"
            maxlength="6"
            @input="onCardCountInput($event, 'penaltyCount')"
            @blur="onCardCountBlur($event, 'penaltyCount')"
            @focus="onCardCountFocus($event, 'penaltyCount')"
          />
        </label>
      </div>
    </div>
  </div>

  <CanastaTooltipModal
    v-if="activeTooltip !== null"
    :tooltip-key="activeTooltip"
    :labels="tooltipLabels"
    @close="closeTooltip"
  />
</template>

<style scoped>
h4 {
  margin: 0;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-muted);
}

h5 {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ui-text);
}

.section-block,
.subsection-block {
  display: grid;
  gap: 0.6rem;
}

.helper-text {
  margin: 0;
  font-size: 0.78rem;
  color: var(--ui-muted);
}

.title-with-info--section {
  justify-content: flex-start;
}

.tooltip-title {
  cursor: pointer;
}

.label-with-total {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3rem;
}

.label-total {
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.h5--red {
  color: #c0392b;
}

.requirements-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.requirements-grid--row1 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
}

.requirements-grid--row1 .field {
  min-width: 0;
}

.requirements-grid--row1 .field span {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.requirements-grid--row1 .field input {
  width: 100%;
  min-height: 32px;
  text-align: center;
  padding: 0.2rem 0.1rem;
}

.requirements-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ui-muted);
}

.requirements-toggle .label-with-total {
  padding-right: 0.52rem;
}

.requirements-toggle span {
  display: flex;
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
  color: #94a3b8;
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
  overflow-x: visible;
  padding-bottom: 0;
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

.count-group-box--inline {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.5rem;
}

.count-group-box--inline > h5 {
  flex: 1;
  min-width: 0;
}

.count-group-box--inline > .field {
  flex: 0 0 56px;
  width: 56px;
}

.count-group-box--inline > .field:has(.card-count-input) {
  flex: 0 0 75px;
  width: 75px;
}

.count-group-box--inline > .face-value-row,
.count-group-box--inline .face-value-row {
  flex-shrink: 0;
}

.count-group-box--wide {
  flex: 1;
}

.face-value-row .field {
  flex: 1 1 0;
  max-width: 56px;
}

.face-value-row .field input:not(.card-count-input) {
  width: 100%;
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
  width: 36px;
  min-height: 32px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.3rem 0.5rem;
  background: #fff;
  color: var(--ui-text);
}

.field input.book-value-input {
  width: 100%;
  text-align: center;
}

.card-count-input {
  width: 100% !important;
  text-align: right;
  padding-right: 5px;
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

.section-block > :not(h4) {
  padding-left: 20px;
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
}

@media (max-width: 410px) {
  .subsection-block--fast-count .count-group-box--inline {
    flex-direction: column;
    align-items: stretch;
  }

  .subsection-block--fast-count .count-group-box--inline > h5 {
    flex: none;
  }

  .subsection-block--fast-count .face-value-row {
    width: 100%;
  }

  .subsection-block--fast-count .face-value-row .field {
    flex: 1 1 0;
    max-width: 56px;
  }
}
</style>
