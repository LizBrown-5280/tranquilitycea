<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink to="/" class="brand">TranquilityCea Workshop</RouterLink>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  gap: 1.2rem;
}

.site-header {
  padding: 0.8rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
}

nav {
  display: flex;
  gap: 0.7rem;
}

nav a.router-link-exact-active {
  color: #ffffff;
  background: var(--ui-accent);
}

nav a.router-link-exact-active:hover {
  background-color: var(--ui-accent);
}

nav a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.1rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  text-decoration: none;
  color: var(--ui-text);
  font-weight: 600;
}

.brand {
  text-decoration: none;
  color: var(--ui-text);
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  font-weight: 800;
}

@media (max-width: 680px) {
  nav {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
