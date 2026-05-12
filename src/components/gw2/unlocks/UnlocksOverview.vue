<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { buildUnlockCategoryItems } from '@/services/gw2/unlockCategoryViewModel'
import { useGw2BootstrapStore } from '@/stores/gw2Bootstrap'

const gw2 = useGw2BootstrapStore()

const unlockCategories = computed(() => {
  const categories = [
    {
      title: 'Finishers',
      description: 'Resolved finisher unlock items now pull through the shared item lookup graph.',
      to: '/guildwars2/account/unlocks/finishers',
      catalogEndpoint: 'finisher_details',
      accountEndpoint: 'account_finisher_unlocks',
    },
    {
      title: 'Mounts',
      description:
        'Mount skins remain a straightforward icon-grid category with shared hover cards.',
      to: '/guildwars2/account/unlocks/mounts',
      catalogEndpoint: 'mount_skin_details',
      accountEndpoint: 'account_mount_skin_unlocks',
    },
    {
      title: 'Colors',
      description:
        'Dyes keep their own grouping rules while still sharing the common tile pattern.',
      to: '/guildwars2/account/unlocks/colors',
      catalogEndpoint: 'dye_catalog_details',
      accountEndpoint: 'account_dye_unlocks',
    },
  ]

  return categories.map((category) => {
    const items = buildUnlockCategoryItems(gw2.allResults, {
      title: category.title,
      catalogEndpoint: category.catalogEndpoint,
      accountEndpoint: category.accountEndpoint,
    })

    const ownedCount = items.filter((item) => item.owned).length

    return {
      ...category,
      totalCount: items.length,
      ownedCount,
    }
  })
})
</script>

<template>
  <section class="unlocks-overview">
    <header class="unlocks-overview__header">
      <h2>Unlocks Overview</h2>
      <p>
        Overview page for unlock collections. Use this as the section landing page, then jump into
        each category as the individual pages grow.
      </p>
    </header>

    <div class="unlocks-overview__cards">
      <RouterLink
        v-for="category in unlockCategories"
        :key="category.title"
        class="unlock-category-card"
        :to="category.to"
      >
        <span class="unlock-category-card__eyebrow">Unlocks</span>
        <strong class="unlock-category-card__title">{{ category.title }}</strong>
        <span class="unlock-category-card__meta"
          >{{ category.ownedCount.toLocaleString() }} owned /
          {{ category.totalCount.toLocaleString() }} total</span
        >
        <p class="unlock-category-card__body">{{ category.description }}</p>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.unlocks-overview {
  display: grid;
  gap: 1rem;
}

.unlocks-overview__header {
  display: grid;
  gap: 0.3rem;
}

.unlocks-overview__header h2,
.unlocks-overview__header p {
  margin: 0;
}

.unlocks-overview__header p {
  color: var(--ui-muted);
}

.unlocks-overview__cards {
  display: grid;
  gap: 0.75rem;
}

.unlock-category-card {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #f7fbfd);
  color: var(--ui-text);
  text-decoration: none;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.unlock-category-card:hover,
.unlock-category-card:focus-visible {
  border-color: #17455a;
  box-shadow: 0 10px 22px rgb(23 69 90 / 10%);
  transform: translateY(-1px);
}

.unlock-category-card__eyebrow {
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ui-muted);
  font-weight: 700;
}

.unlock-category-card__title {
  font-size: 1.05rem;
}

.unlock-category-card__meta,
.unlock-category-card__body {
  color: var(--ui-muted);
}

.unlock-category-card__body {
  margin: 0;
}

@media (min-width: 760px) {
  .unlocks-overview__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
