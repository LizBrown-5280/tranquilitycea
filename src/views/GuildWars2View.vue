<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'

const route = useRoute()
const gw2Store = useGw2BootstrapStore()

const tabs = [
  {
    id: 'account',
    label: 'Account',
    to: '/guildwars2/account/currency-wallet',
    pathPrefix: '/guildwars2/account',
  },
  { id: 'timers', label: 'Timers', to: '/guildwars2/timers', pathPrefix: '/guildwars2/timers' },
]

const activeTabId = computed(() => tabs.find((tab) => route.path.startsWith(tab.pathPrefix))?.id)

const isAccountRoute = computed(() => route.path.startsWith('/guildwars2/account'))
const isTimersRoute = computed(() => route.path.startsWith('/guildwars2/timers'))

const isKeysRoute = computed(() => route.path.startsWith('/guildwars2/keys'))

const keySuffix = computed(() => {
  const normalized = gw2Store.apiKey.trim()

  if (normalized.length < 4) {
    return ''
  }

  return normalized.slice(-4)
})

const accountMenu = [
  {
    section: 'Categories',
    items: [
      {
        label: 'Currency/Wallet',
        to: '/guildwars2/account/currency-wallet',
      },
    ],
  },
  {
    section: 'Inventory Storage',
    items: [
      {
        label: 'Overview',
        to: '/guildwars2/account/inventories/storage',
      },
      {
        label: 'Bank',
        to: '/guildwars2/account/inventories/bank',
      },
      {
        label: 'Materials',
        to: '/guildwars2/account/inventories/materials',
      },
    ],
  },
  {
    section: 'Unlocks',
    items: [
      {
        label: 'Overview',
        to: '/guildwars2/account/unlocks/overview',
      },
      {
        label: 'Finishers',
        to: '/guildwars2/account/unlocks/finishers',
      },
      {
        label: 'Mounts',
        to: '/guildwars2/account/unlocks/mounts',
      },
      {
        label: 'Colors',
        to: '/guildwars2/account/unlocks/colors',
      },
    ],
  },
]

onMounted(() => {
  void gw2Store.loadLandingPublic().then(() => {
    gw2Store.prefetchRemainingPublicInBackground()
  })
})
</script>

<template>
  <main class="gw2-page">
    <header class="gw2-header">
      <div class="gw2-title-row">
        <h1>Guild Wars 2</h1>
        <RouterLink
          class="key-pill"
          :class="{ 'key-pill--active': isKeysRoute }"
          to="/guildwars2/keys"
        >
          <span>Keys</span>
          <strong v-if="keySuffix">••••{{ keySuffix }}</strong>
        </RouterLink>
      </div>

      <nav class="gw2-tabs" aria-label="GW2 sections">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.id"
          class="gw2-tab"
          :to="tab.to"
          :class="{ 'gw2-tab--active': activeTabId === tab.id }"
        >
          {{ tab.label }}
        </RouterLink>
      </nav>
    </header>

    <section v-if="isAccountRoute" class="account-shell">
      <aside class="account-menu" aria-label="Account categories">
        <div v-for="menuSection in accountMenu" :key="menuSection.section" class="menu-section">
          <h2>{{ menuSection.section }}</h2>
          <ul>
            <li v-for="item in menuSection.items" :key="item.to">
              <RouterLink :to="item.to" class="menu-link">
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </aside>

      <div class="account-main">
        <header class="account-main-header">
          <h2>Account</h2>
        </header>
        <RouterView />
      </div>
    </section>

    <section v-else-if="isTimersRoute" class="timers-shell">
      <RouterView />
    </section>

    <section v-else-if="isKeysRoute" class="timers-shell">
      <RouterView />
    </section>
  </main>
</template>

<style scoped>
.gw2-page {
  display: grid;
  gap: 1rem;
}

.gw2-header {
  display: grid;
  gap: 0.8rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 1rem;
  background: #ffffff;
}

.gw2-header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.gw2-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.key-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #17455a;
  border: 1px solid #17455a;
  border-radius: 999px;
  padding: 0.32rem 0.8rem;
  background: #fff;
  font-size: 0.86rem;
  font-weight: 600;
}

.key-pill strong {
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.key-pill--active {
  background: #17455a;
  color: #fff;
}

.gw2-tabs {
  display: flex;
  gap: 0.6rem;
  border-bottom: 1px solid var(--ui-border);
  padding-bottom: 0.5rem;
}

.gw2-tab {
  text-decoration: none;
  color: var(--ui-text);
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-weight: 600;
  background: #fff;
}

.gw2-tab--active {
  background: #17455a;
  color: #fff;
  border-color: #17455a;
}

.account-shell {
  display: grid;
  gap: 1rem;
}

.account-main {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: #fff;
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
}

.account-main-header h2 {
  margin: 0;
  font-size: 1.15rem;
}

.account-menu {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: #fff;
  padding: 1rem;
}

.account-menu h2 {
  margin: 0 0 0.6rem;
  font-size: 1rem;
}

.menu-section {
  display: grid;
  gap: 0.6rem;
}

.menu-section + .menu-section {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--ui-border);
}

.menu-section h2 {
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
}

.account-menu ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.45rem;
}

.menu-link {
  display: block;
  text-decoration: none;
  color: var(--ui-text);
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 0.45rem 0.6rem;
}

.menu-link.router-link-active {
  border-color: #17455a;
  background: #e9f3f7;
  color: #17455a;
  font-weight: 700;
}

.timers-shell {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: #fff;
  padding: 1rem;
}

@media (min-width: 920px) {
  .account-shell {
    grid-template-columns: 280px minmax(0, 1fr);
    align-items: start;
  }
}
</style>
