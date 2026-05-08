# TranquilityCea Workshop

A personal web app built with Vue 3 + TypeScript. Currently hosts the **Canasta Score Tracker** as its primary feature, with a Guild Wars 2 section in early development.

Live: **https://workshop-lizbrown5280.web.app**

---

## Features

### Canasta Score Tracker (`/canasta`)

A full hand-by-hand score tracking app for the card game Canasta (7-deck variant).

- **Session management** — start new sessions, resume an active session (within 4 hours), or review archived sessions read-only
- **Session types** — Both Teams, My Team Only, or Total Scores Only scoring modes
- **4-hand scoring** — tab-based navigation across hands 1–4 plus a totals view
- **Big Count scoring** — requirement books (7s, 5s, Wilds, Cleans, Dirtys), red 3s, all-requirements bonus, went-out bonus
- **Fast Count scoring** — 10-point books, 5-point books, Ace books
- **Card count & penalty** — manual entry with running grand total per team per hand
- **Game totals view** — cross-hand summary table with leader tracking and confetti on game completion
- **Settings** — configurable session retention period (7–365 days), tooltip toggle
- **Tooltips** — in-form help text for each scoring category (can be disabled)
- **Responsive layout** — stacks to single column below 800px, optimized down to ~410px

### Guild Wars 2 (`/gw2`)

Early-stage dashboard scaffolding. Not yet production-ready.

---

## Tech Stack

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Framework        | Vue 3 (Composition API, `<script setup>`) |
| Language         | TypeScript                                |
| Build tool       | Vite                                      |
| State management | Pinia                                     |
| Routing          | Vue Router                                |
| Testing          | Vitest + Vue Test Utils                   |
| Linting          | ESLint                                    |
| Hosting          | Firebase Hosting                          |

---

## Project Structure

```
src/
  components/canasta/   # Canasta UI components
  composables/          # useCanastaTabs, useCanastaSession
  services/canasta/     # Scoring logic, session storage, constants
  stores/               # Pinia stores
  types/                # Shared TypeScript types
  views/                # Page-level views (CanastaView, GuildWars2View, etc.)
  content/              # Static content (tooltip copy)
  router/               # Vue Router config
  assets/               # Global CSS vars and base styles
docs/
  canasta-feature-backlog.md  # Feature backlog and future ideas
```

---

## Development Setup

```sh
npm install
```

### Dev server

```sh
npm run dev
# → http://localhost:5173
```

### Type-check, compile, and minify for production

```sh
npm run build
```

### Run unit tests

```sh
npm run test:unit
```

### Lint

```sh
npm run lint
```

### Deploy to Firebase

```sh
firebase deploy
```

---

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

Browser devtools extension: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)

---

## Canasta Rules Reference (7-deck game)

Book type validation constants used in the app:

| Book type  | Composition                        | Cards in play    | Game max    |
| ---------- | ---------------------------------- | ---------------- | ----------- |
| 7s (clean) | Rank 7 only, no wilds              | 28               | 4           |
| 5s (clean) | Rank 5 only, no wilds              | 28               | 4           |
| Wilds      | 2s + jokers only                   | 42               | 6           |
| Cleans     | Ranks 4/6/8/9/10/J/Q/K/A, no wilds | 252 (9 ranks)    | 36          |
| Dirtys     | ≥4 natural same-rank + ≤3 wilds    | limited by wilds | 42          |
| Red 3s     | 3♦ + 3♥ per deck                   | 14 total         | 14 per team |

See `docs/canasta-feature-backlog.md` for planned improvements including input validation guards based on these limits.
