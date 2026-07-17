<script setup lang="ts">
import { computed } from 'vue'
import type { UnlockDetailField } from '@/services/gw2/unlockCategoryViewModel'
import { formatGw2CoinPart, gw2CoinIcons, splitGw2Coin } from '@/services/gw2/currencyDisplay'

interface Props {
  title: string
  description?: string
  fields?: UnlockDetailField[]
  unlockItems?: Array<{ id: number; name?: string; flags?: string[] }>
  apiEndpointPath?: string
  apiEndpointId?: string | number
  itemApiItemId?: number
  rawItemData?: Record<string, unknown>
  accentColor?: string
  itemIconUrl?: string
}

const props = defineProps<Props>()

const isDevMode = computed(() => import.meta.env.DEV)

const devApiPath = computed(() => {
  if (typeof props.apiEndpointPath === 'string' && props.apiEndpointPath.trim().length > 0) {
    return props.apiEndpointPath
      .trim()
      .replace(/^\/?v2\//, '')
      .replace(/^\//, '')
      .replace(/\/$/, '')
  }

  if (typeof props.itemApiItemId === 'number') {
    return 'items'
  }

  return null
})

const devApiId = computed(() => {
  if (typeof props.apiEndpointId === 'number') {
    return Number.isFinite(props.apiEndpointId) ? String(props.apiEndpointId) : null
  }

  if (typeof props.apiEndpointId === 'string' && props.apiEndpointId.trim().length > 0) {
    return props.apiEndpointId.trim()
  }

  if (typeof props.itemApiItemId === 'number' && Number.isFinite(props.itemApiItemId)) {
    return String(props.itemApiItemId)
  }

  return null
})

const devApiUrl = computed(() => {
  if (!devApiPath.value || !devApiId.value) return undefined
  return `https://api.guildwars2.com/v2/${devApiPath.value}/${encodeURIComponent(devApiId.value)}`
})

function getCoinParts(value: number) {
  return splitGw2Coin(value)
}
</script>

<template>
  <div class="unlock-hover-card" :style="accentColor ? { borderColor: accentColor } : {}">
    <div
      v-if="accentColor"
      class="unlock-hover-card__color-strip"
      :style="{ background: accentColor }"
    />
    <header class="unlock-hover-card__header">
      <img
        v-if="itemIconUrl"
        :src="itemIconUrl"
        alt=""
        class="unlock-hover-card__item-icon"
        loading="lazy"
      />
      <h3 class="unlock-hover-card__title">
        {{ title }}
        <span v-if="isDevMode && devApiId" class="unlock-hover-card__dev-item-id">
          (<a :href="devApiUrl" target="_blank" rel="noopener noreferrer">{{ devApiId }}</a
          >)
        </span>
      </h3>
      <p v-if="description" class="unlock-hover-card__description">{{ description }}</p>
    </header>

    <dl v-if="fields && fields.length > 0" class="unlock-hover-card__fields">
      <template v-for="field in fields" :key="`${field.label}-${field.value}`">
        <dt class="unlock-hover-card__term">{{ field.label }}</dt>
        <dd
          class="unlock-hover-card__value"
          :class="{ 'unlock-hover-card__value--emphasis': field.emphasis }"
        >
          <template v-if="typeof field.coinValueInCopper === 'number'">
            <span class="unlock-hover-card__coin-parts">
              <span class="unlock-hover-card__coin-part">
                <span class="unlock-hover-card__coin-value">{{
                  getCoinParts(field.coinValueInCopper).gold
                }}</span>
                <img :src="gw2CoinIcons.gold" alt="Gold" class="unlock-hover-card__coin-icon" />
              </span>
              <span class="unlock-hover-card__coin-part">
                <span class="unlock-hover-card__coin-value">{{
                  formatGw2CoinPart(getCoinParts(field.coinValueInCopper).silver)
                }}</span>
                <img :src="gw2CoinIcons.silver" alt="Silver" class="unlock-hover-card__coin-icon" />
              </span>
              <span class="unlock-hover-card__coin-part">
                <span class="unlock-hover-card__coin-value">{{
                  formatGw2CoinPart(getCoinParts(field.coinValueInCopper).copper)
                }}</span>
                <img :src="gw2CoinIcons.copper" alt="Copper" class="unlock-hover-card__coin-icon" />
              </span>
            </span>
          </template>
          <template v-else>
            {{ field.value }}
          </template>
        </dd>
      </template>
    </dl>

    <div v-if="unlockItems && unlockItems.length > 0" class="unlock-hover-card__unlock-items">
      <p class="unlock-hover-card__unlock-items-title">Unlock Items</p>
      <ul class="unlock-hover-card__unlock-items-list">
        <li v-for="item in unlockItems" :key="item.id" class="unlock-hover-card__unlock-items-item">
          <div class="unlock-hover-card__unlock-items-header">
            <span class="unlock-hover-card__unlock-items-id">{{ item.id }}</span>
            <span v-if="item.name" class="unlock-hover-card__unlock-items-name">{{
              item.name
            }}</span>
          </div>
          <div
            v-if="item.flags && item.flags.length > 0"
            class="unlock-hover-card__unlock-items-flags"
          >
            <span
              v-for="flag in item.flags"
              :key="flag"
              class="unlock-hover-card__unlock-items-flag"
            >
              {{ flag }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="rawItemData" class="unlock-hover-card__raw-data">
      <pre class="unlock-hover-card__raw-data-content">{{
        JSON.stringify(rawItemData, null, 2)
      }}</pre>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.unlock-hover-card {
  width: 320px;
  max-width: calc(100vw - 2rem);
  padding: 1rem 1.1rem;
  border: 1px solid #d6b24a;
  border-radius: 14px;
  background: #fffdf2;
  color: var(--ui-text);
  box-shadow: 0 16px 36px rgb(23 33 43 / 18%);
  overflow: hidden;
}

.unlock-hover-card__color-strip {
  height: 6px;
  margin: -1rem -1.1rem 0.75rem;
  border-radius: 0;
}

.unlock-hover-card__header {
  display: grid;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  position: relative;
  padding-right: 2.7rem;
}

.unlock-hover-card__item-icon {
  position: absolute;
  top: 0;
  right: 0;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 8px;
  border: 1px solid #e8dcc8;
  object-fit: cover;
  background: #fff;
}

.unlock-hover-card__title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
}

.unlock-hover-card__dev-item-id {
  margin-left: 0.25rem;
  font-size: 0.85rem;
  color: var(--ui-muted);
}

.unlock-hover-card__dev-item-id a {
  color: #d6b24a;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
}

.unlock-hover-card__dev-item-id a:hover {
  color: #c9a435;
  text-decoration: underline;
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

.unlock-hover-card__coin-parts {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
}

.unlock-hover-card__coin-part {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

.unlock-hover-card__coin-value {
  font-variant-numeric: tabular-nums;
}

.unlock-hover-card__coin-icon {
  width: 0.78rem;
  height: 0.78rem;
  object-fit: contain;
}

.unlock-hover-card__unlock-items {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e8dcc8;
}

.unlock-hover-card__unlock-items-title {
  margin: 0 0 0.4rem 0;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-muted);
}

.unlock-hover-card__unlock-items-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.25rem;
}

.unlock-hover-card__unlock-items-item {
  font-size: 0.85rem;
  line-height: 1.3;
  display: grid;
  gap: 0.3rem;
  align-items: baseline;
}

.unlock-hover-card__unlock-items-header {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.unlock-hover-card__unlock-items-id {
  font-weight: 600;
  color: var(--ui-accent);
  flex-shrink: 0;
}

.unlock-hover-card__unlock-items-name {
  color: var(--ui-text);
  flex-shrink: 1;
  min-width: 0;
}

.unlock-hover-card__unlock-items-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding-left: 0.5rem;
}

.unlock-hover-card__unlock-items-flag {
  display: inline-block;
  background: rgba(214, 178, 74, 0.15);
  color: #8b7d0f;
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  font-size: 0.75rem;
  line-height: 1;
}

.unlock-hover-card__raw-data {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e8dcc8;
}

.unlock-hover-card__raw-data-content {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.2;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.03);
  padding: 0.5rem;
  border-radius: 4px;
  color: var(--ui-text);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
