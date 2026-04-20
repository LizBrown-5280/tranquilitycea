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
      name: 'guildwars2',
      component: () => import('../views/GuildWars2View.vue'),
    },
    {
      path: '/canasta',
      name: 'canasta',
      component: () => import('../views/CanastaView.vue'),
    },
  ],
})

export default router
