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
  ],
})

export default router
