<template>
  <main class="directory-page">
    <header class="directory-header">
      <p class="eyebrow">Guide Directory</p>
      <h1>Pick a Game</h1>
      <p>Start with Guild Wars 2 while the broader multi-game guide catalog is being built.</p>
    </header>

    <section class="game-grid" aria-label="Game guide list">
      <article v-if="isDev" class="game-card available">
        <h2>Guild Wars 2</h2>
        <p>One-shot account snapshot with sectioned guide views and optional API key enrichment.</p>
        <RouterLink class="card-link" to="/guildwars2">Open GW2 Guide</RouterLink>
      </article>

      <article class="game-card available">
        <h2>Canasta Score Tracker</h2>
        <p>Track scores across rounds and players for a full Canasta session.</p>
        <RouterLink class="card-link" to="/canasta">Open Canasta Tracker</RouterLink>
      </article>

      <article v-if="isDev" class="game-card upcoming" aria-disabled="true">
        <h2>Path of Exile 2</h2>
        <p>Reserved slot for future progression and build planning support.</p>
        <span class="badge">Coming soon</span>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

const isDev = import.meta.env.DEV
</script>

<style scoped>
.directory-page {
  display: grid;
  gap: 1.2rem;
}

.directory-header {
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  padding: 1.25rem;
  background: linear-gradient(120deg, rgba(239, 247, 255, 0.95), rgba(255, 255, 255, 0.95));
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: var(--ui-muted);
  font-weight: 700;
}

h1 {
  margin-top: 0.35rem;
  font-size: clamp(1.6rem, 3.4vw, 2.3rem);
}

.directory-header p:last-child {
  margin-top: 0.45rem;
  color: var(--ui-muted);
  max-width: 62ch;
}

.game-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}

.game-card {
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  padding: 1rem;
  background: var(--ui-card);
  display: grid;
  gap: 0.6rem;
}

.game-card h2 {
  font-size: 1.1rem;
}

.game-card p {
  color: var(--ui-muted);
}

.card-link {
  justify-self: start;
  text-decoration: none;
  font-weight: 700;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  color: var(--ui-text);
}

.available {
  border-color: #8fb7db;
}

.upcoming {
  opacity: 0.8;
}

.badge {
  justify-self: start;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ui-muted);
}
</style>
