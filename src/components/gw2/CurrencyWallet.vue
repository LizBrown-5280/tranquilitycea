<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  formatGw2CoinPart,
  GW2_COIN_CURRENCY_ID,
  gw2CoinIcons,
  splitGw2Coin,
} from '@/services/gw2/currencyDisplay'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'

const gw2 = useGw2BootstrapStore()
const isCompact = ref(false)
const hasAccountKey = computed(() => gw2.apiKey.trim().length > 0)
const walletEmptyStateText = computed(() => {
  if (gw2.lifecycle === 'loadingPublic') {
    return 'Loading currency data…'
  }

  if (!hasAccountKey.value) {
    return 'Currency catalog loaded. Add an API key with the wallet scope to see balances.'
  }

  return 'No wallet currency data is available for the current endpoint profile.'
})
</script>

<template>
  <section class="currency-wallet">
    <header class="currency-toolbar">
      <h2 class="currency-title">Wallet</h2>
      <button
        type="button"
        class="density-toggle"
        :aria-pressed="isCompact"
        @click="isCompact = !isCompact"
      >
        {{ isCompact ? 'Comfortable' : 'Compact' }}
      </button>
    </header>

    <p v-if="gw2.walletCurrencies.length === 0" class="empty-state">{{ walletEmptyStateText }}</p>
    <ul v-else class="currency-list" :class="{ 'currency-list--compact': isCompact }">
      <li class="currency-row currency-row--header" aria-hidden="true">
        <span class="currency-column-title">Currency</span>
        <span class="currency-column-group">
          <span class="currency-column-title">Name</span>
          <span class="currency-column-subtitle">Description</span>
        </span>
        <span v-if="hasAccountKey" class="currency-column-title currency-column-title--amount">
          Amount
        </span>
        <span v-else></span>
      </li>
      <li v-for="currency in gw2.walletCurrencies" :key="currency.id" class="currency-row">
        <div class="currency-cell currency-cell--icon">
          <img
            v-if="currency.iconUrl"
            :src="currency.iconUrl"
            :alt="currency.name"
            class="currency-icon"
          />
        </div>

        <div class="currency-cell currency-cell--meta">
          <span class="currency-name">{{ currency.name }}</span>
          <span class="currency-description">{{ currency.description ?? '' }}</span>
        </div>

        <span
          v-if="currency.id === GW2_COIN_CURRENCY_ID && currency.balance !== null"
          class="currency-balance coin-balance"
        >
          <span class="coin-part coin-part--gold">
            <span class="coin-value">{{ splitGw2Coin(currency.balance).gold }}</span>
            <img :src="gw2CoinIcons.gold" alt="Gold" class="coin-label-icon" />
          </span>
          <span class="coin-part coin-part--silver">
            <span class="coin-value">{{
              formatGw2CoinPart(splitGw2Coin(currency.balance).silver)
            }}</span>
            <img :src="gw2CoinIcons.silver" alt="Silver" class="coin-label-icon" />
          </span>
          <span class="coin-part coin-part--copper">
            <span class="coin-value">{{
              formatGw2CoinPart(splitGw2Coin(currency.balance).copper)
            }}</span>
            <img :src="gw2CoinIcons.copper" alt="Copper" class="coin-label-icon" />
          </span>
        </span>
        <span v-else class="currency-balance">
          {{ currency.balance !== null ? currency.balance.toLocaleString() : '' }}
        </span>
      </li>
    </ul>
  </section>
</template>
<style scoped>
.currency-wallet {
  display: grid;
  gap: 0.75rem;
}

.currency-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.currency-title {
  margin: 0;
  font-size: 1.05rem;
}

.density-toggle {
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--ui-text);
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.density-toggle:hover {
  border-color: #17455a;
}

.density-toggle:focus-visible {
  outline: 2px solid #17455a;
  outline-offset: 2px;
}

.currency-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.currency-row {
  display: grid;
  grid-template-columns: 75px minmax(0, 1fr) 120px;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  background: #fff;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.currency-row:not(.currency-row--header):hover {
  border-color: #9db8c4;
  box-shadow: 0 2px 8px rgb(23 69 90 / 8%);
  transform: translateY(-1px);
}

.currency-row:not(.currency-row--header):focus-within {
  border-color: #17455a;
  box-shadow: 0 0 0 2px rgb(23 69 90 / 18%);
}

.currency-row--header {
  border: 0;
  background: transparent;
  padding: 0 0.75rem;
  align-items: start;
}

.currency-column-title {
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ui-muted);
  font-weight: 700;
}

.currency-column-group {
  display: grid;
  gap: 0.12rem;
}

.currency-column-subtitle {
  font-size: 0.72rem;
  color: var(--ui-muted);
  line-height: 1.2;
}

.currency-column-title--amount {
  text-align: right;
}

.currency-cell {
  min-width: 0;
}

.currency-cell--icon {
  display: flex;
  align-items: center;
}

.currency-icon {
  height: 40px;
  width: auto;
  display: block;
}

.currency-cell--meta {
  display: grid;
  gap: 0.2rem;
}

.currency-name {
  font-weight: 700;
  line-height: 1.2;
}

.currency-description {
  color: var(--ui-muted);
  font-size: 0.92rem;
  line-height: 1.25;
}

.currency-balance {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  font-weight: 600;
  justify-self: end;
  min-width: 8ch;
}

.coin-balance {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  align-items: flex-end;
  font-size: 0.9rem;
}

.coin-part {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
}

.coin-value {
  font-weight: 700;
  line-height: 1;
  min-width: 2ch;
  text-align: center;
}

.coin-label-icon {
  width: 14px;
  height: 14px;
  display: block;
}

.coin-part--gold .coin-value {
  color: #d4af37;
}

.coin-part--silver .coin-value {
  color: #c0c0c0;
}

.coin-part--copper .coin-value {
  color: #b87333;
}

.empty-state {
  color: var(--ui-muted);
}

.currency-list--compact .currency-row {
  padding: 0.42rem 0.6rem;
  gap: 0.55rem;
}

.currency-list--compact .currency-row--header {
  padding: 0 0.6rem;
}

.currency-list--compact .currency-icon {
  height: 32px;
}

.currency-list--compact .currency-description {
  font-size: 0.82rem;
}

@media (max-width: 760px) {
  .currency-row {
    grid-template-columns: 72px minmax(0, 1fr) 88px;
  }

  .currency-description {
    font-size: 0.86rem;
  }

  .currency-list--compact .currency-row {
    grid-template-columns: 60px minmax(0, 1fr) 80px;
  }
}
</style>
