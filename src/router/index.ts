import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/guildwars2',
      component: () => import('../views/GuildWars2View.vue'),
      children: [
        {
          path: '',
          redirect: '/guildwars2/account/currency-wallet',
        },
        {
          path: 'account/currency-wallet',
          name: 'guildwars2-account-currency-wallet',
          component: () => import('../components/gw2/CurrencyWallet.vue'),
        },
        {
          path: 'account/inventories/storage',
          name: 'guildwars2-account-inventories-storage',
          component: () => import('../components/gw2/InventoryStorage.vue'),
        },
        {
          path: 'account/inventories/bank',
          name: 'guildwars2-account-inventories-bank',
          component: () => import('../components/gw2/BankStorage.vue'),
        },
        {
          path: 'account/inventories/materials',
          name: 'guildwars2-account-inventories-materials',
          component: () => import('../components/gw2/MaterialStorage.vue'),
        },
        {
          path: 'account/unlocks/overview',
          name: 'guildwars2-account-unlocks-overview',
          component: () => import('../components/gw2/unlocks/UnlocksOverview.vue'),
        },
        {
          path: 'account/unlocks/finishers',
          name: 'guildwars2-account-unlocks-finishers',
          component: () => import('../components/gw2/unlocks/Finishers.vue'),
        },
        {
          path: 'account/unlocks/mounts',
          name: 'guildwars2-account-unlocks-mounts',
          component: () => import('../components/gw2/unlocks/Mounts.vue'),
        },
        {
          path: 'account/unlocks/colors',
          name: 'guildwars2-account-unlocks-colors',
          component: () => import('../components/gw2/unlocks/Colors.vue'),
        },
        {
          path: 'timers',
          name: 'guildwars2-timers',
          component: () => import('../components/gw2/TimersPanel.vue'),
        },
        {
          path: 'keys',
          name: 'guildwars2-keys',
          component: () => import('../components/gw2/KeysPanel.vue'),
        },
      ],
    },
    {
      path: '/guildwars2-dev',
      name: 'guildwars2-dev',
      component: () => import('../views/GuildWars2DevView.vue'),
    },
    {
      path: '/canasta',
      name: 'canasta',
      component: () => import('../views/CanastaView.vue'),
    },
    {
      path: '/swipe',
      name: 'swipe',
      component: () => import('../views/SwipeView.vue'),
    },
  ],
})

export default router
