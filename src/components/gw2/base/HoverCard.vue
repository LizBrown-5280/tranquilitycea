<script setup lang="ts">
import type { UnlockDetailField } from '@/services/gw2/unlockCategoryViewModel'

interface Props {
  title: string
  description?: string
  fields?: UnlockDetailField[]
}

defineProps<Props>()
</script>

<template>
  <div class="unlock-hover-card">
    <header class="unlock-hover-card__header">
      <h3 class="unlock-hover-card__title">{{ title }}</h3>
      <p v-if="description" class="unlock-hover-card__description">{{ description }}</p>
    </header>

    <dl v-if="fields && fields.length > 0" class="unlock-hover-card__fields">
      <template v-for="field in fields" :key="`${field.label}-${field.value}`">
        <dt class="unlock-hover-card__term">{{ field.label }}</dt>
        <dd
          class="unlock-hover-card__value"
          :class="{ 'unlock-hover-card__value--emphasis': field.emphasis }"
        >
          {{ field.value }}
        </dd>
      </template>
    </dl>

    <slot />
  </div>
</template>

<style scoped>
.unlock-hover-card {
  width: 320px;
  max-width: calc(100vw - 2rem);
  padding: 0.9rem;
  border: 1px solid #d6b24a;
  border-radius: 14px;
  background: #fffdf2;
  color: var(--ui-text);
  box-shadow: 0 16px 36px rgb(23 33 43 / 18%);
}

.unlock-hover-card__header {
  display: grid;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.unlock-hover-card__title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
}

.unlock-hover-card__description {
  margin: 0;
  color: var(--ui-muted);
  font-size: 0.92rem;
  line-height: 1.35;
}

.unlock-hover-card__fields {
  display: grid;
  grid-template-columns: minmax(0, max-content) minmax(0, 1fr);
  gap: 0.35rem 0.65rem;
  margin: 0;
}

.unlock-hover-card__term {
  margin: 0;
  color: var(--ui-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.unlock-hover-card__value {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.35;
}

.unlock-hover-card__value--emphasis {
  font-weight: 700;
}
</style>
