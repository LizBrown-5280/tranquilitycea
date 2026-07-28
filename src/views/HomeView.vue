<template>
  <main class="directory-page">
    <header class="directory-header">
      <p class="header-kicker">TranquilityCea Orbital Workshop</p>
      <h1>Projects in Orbit</h1>
      <p>Practical tools and evolving builds shaped for real use.</p>
    </header>

    <section class="game-grid" aria-label="Game guide list">
      <article v-if="isGw2PreviewEnabled" class="game-card available">
        <div class="card-meta">
          <span class="status status-live">Live</span>
          <span class="card-domain">Game Data</span>
        </div>
        <h2>Guild Wars 2</h2>
        <p>One-shot account snapshot with sectioned guide views and optional API key enrichment.</p>
        <ul class="tag-list" aria-label="Guild Wars 2 technologies">
          <li>Vue 3</li>
          <li>TypeScript</li>
          <li>API Aggregation</li>
        </ul>
        <RouterLink class="card-link" to="/guildwars2">Open GW2 Guide</RouterLink>
      </article>

      <article class="game-card available">
        <div class="card-meta">
          <span class="status status-live">Live</span>
          <span class="card-domain">Scoring Tool</span>
        </div>
        <h2>Canasta Score Tracker</h2>
        <p>Track scores across rounds and teams for a full Canasta session.</p>
        <ul class="tag-list" aria-label="Canasta tracker technologies">
          <li>Vue 3</li>
          <li>TypeScript</li>
          <li>Responsive UI</li>
        </ul>
        <RouterLink class="card-link" to="/canasta">Open Canasta Tracker</RouterLink>
      </article>

      <article class="game-card available">
        <div class="card-meta">
          <span class="status status-live">Live</span>
          <span class="card-domain">Scoring Tool</span>
        </div>
        <h2>Swipe Score Tracker</h2>
        <p>Track up to 12 rounds of Swipe and keep team scores organized in one place.</p>
        <ul class="tag-list" aria-label="Swipe tracker technologies">
          <li>Vue 3</li>
          <li>TypeScript</li>
          <li>Responsive UI</li>
        </ul>
        <RouterLink class="card-link" to="/swipe">Open Swipe Tracker</RouterLink>
      </article>

      <article v-if="isPoE2PreviewEnabled" class="game-card upcoming" aria-disabled="true">
        <div class="card-meta">
          <span class="status status-queued">Queued</span>
          <span class="card-domain">Planning</span>
        </div>
        <h2>Path of Exile 2</h2>
        <p>Reserved slot for future progression and build planning support.</p>
        <span class="badge">Coming soon</span>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { usePreviewFeatures } from '@/composables/usePreviewFeatures'

const { isGw2PreviewEnabled, isPoE2PreviewEnabled } = usePreviewFeatures()
</script>

<style scoped>
.directory-page {
  display: grid;
  gap: 1.4rem;
}

.directory-header {
  border: 1px solid #c5d2de;
  border-radius: 18px;
  padding: clamp(1.2rem, 2.4vw, 1.7rem);
  background:
    radial-gradient(circle at 92% 22%, rgba(166, 206, 255, 0.26) 0%, rgba(166, 206, 255, 0) 36%),
    radial-gradient(circle at 15% 95%, rgba(255, 225, 170, 0.24) 0%, rgba(255, 225, 170, 0) 42%),
    linear-gradient(140deg, rgba(245, 251, 255, 0.94), rgba(255, 255, 255, 0.96));
  box-shadow: 0 12px 28px rgba(29, 52, 79, 0.08);
}

.header-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  font-weight: 700;
  color: #54708a;
}

h1 {
  margin-top: 0.32rem;
  font-size: clamp(1.65rem, 4vw, 2.45rem);
  letter-spacing: 0.01em;
}

.directory-header p:last-child {
  margin-top: 0.5rem;
  color: var(--ui-muted);
  max-width: 56ch;
}

.game-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(255px, 1fr));
}

.game-card {
  border: 1px solid #cdd8e3;
  border-radius: 16px;
  padding: 1.05rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(249, 252, 255, 0.92)), var(--ui-card);
  display: grid;
  gap: 0.65rem;
  box-shadow: 0 8px 22px rgba(30, 49, 78, 0.06);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.game-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(30, 49, 78, 0.1);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.game-card h2 {
  font-size: 1.1rem;
}

.game-card p {
  color: var(--ui-muted);
}

.status {
  display: inline-flex;
  align-items: center;
  min-height: 1.6rem;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 700;
}

.status-live {
  border: 1px solid #9cc7e9;
  background: #e9f6ff;
  color: #255777;
}

.status-queued {
  border: 1px solid #d7dce2;
  background: #f4f6f8;
  color: #556878;
}

.card-domain {
  font-size: 0.76rem;
  color: #627589;
  font-weight: 600;
}

.tag-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.tag-list li {
  display: inline-flex;
  align-items: center;
  height: 24px;
  border: 1px solid #d8e2eb;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  line-height: 1;
  white-space: nowrap;
  color: #405466;
  background: #f9fcff;
}

.card-link {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-size: 0.92rem;
  line-height: 1;
  font-weight: 700;
  border: 1px solid #b7c8d8;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  height: 37px;
  white-space: nowrap;
  color: #18334c;
  background: #f6fbff;
}

.available {
  border-color: #9fbfdd;
}

.upcoming {
  opacity: 0.85;
}

.badge {
  justify-self: start;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #5a6f82;
}

@media (max-width: 560px) {
  .directory-page {
    gap: 1rem;
  }

  .game-grid {
    gap: 0.8rem;
  }

  .card-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
}
</style>
