# TranquilityCea Workshop

A personal web app built with Vue 3 + TypeScript. The workshop currently includes score trackers for Canasta and Swipe, plus a Guild Wars 2 account snapshot in active development.

Live: **https://workshop-lizbrown5280.web.app**

---

## Applications

### Canasta Score Tracker (`/canasta`)

A full hand-by-hand score tracking app for the card game Canasta (7-deck variant).

- **Session management** — start new sessions, resume an active session (within 4 hours), or review archived sessions read-only
- **Session types** — Both Teams, My Team Only, or Total Scores Only scoring modes
- **4-hand scoring** — tab-based navigation across hands 1–4 plus a totals view
- **Big Count scoring** — requirement books (7s, 5s, Wilds, Cleans, Dirtys), red 3s, all-requirements bonus, went-out bonus
- **Fast Count scoring** — 10-point books, 5-point books, Ace books
- **Card count & penalty** — manual entry with running grand total per team per hand
- **Game totals view** — cross-hand summary table with leader tracking and confetti on game completion
- **Settings** — configurable session retention period (7–365 days), tooltip toggle, and current app version
- **Tooltips** — in-form help text for each scoring category (can be disabled)
- **Responsive layout** — stacks to single column below 800px, optimized down to ~410px

### Swipe Score Tracker (`/swipe`)

A round-based score tracker for the card game Swipe.

- **Session management** — start new sessions, resume recent sessions, or review archived sessions read-only
- **Flexible player setup** — configure 3–8 players and choose a fixed round count or an open-ended game
- **Round scoring** — enter scores by player and round with running totals and locked future-round inputs
- **Winner selection** — configure the winning value as `0` or `-10`, with lowest- or highest-total win direction
- **Round controls** — select a winner, advance to the next round, rotate the starting player, or end a game early
- **Ranking feedback** — switch between seating order and rank order, with rank badges and winner highlighting
- **Settings** — configurable session retention period, tooltip toggle, and current app version
- **Responsive layout** — score grid and controls adapt for smaller screens

### Guild Wars 2 (`/gw2`)

Account snapshot dashboard in active development. It supports public data without a key and optional account data with a Guild Wars 2 API key.

- **Account sections** — characters, inventories, account unlocks, wallet, and progression
- **Collection views** — wallet currencies, bank storage, materials, and unlock categories
- **Cached loading flow** — public data loads first, followed by optional account data
- **Partial error handling** — endpoint-level problems can be surfaced without discarding successful sections
- **Development status** — not yet production-ready; some collections remain capped or incomplete

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
  components/
    canasta/            # Canasta UI components
    swipe/              # Swipe settings and session UI
    gw2/                # Guild Wars 2 dashboard components
  composables/          # Shared Vue composables and session flows
  content/              # Static tooltip and planning content
  queries/              # GW2 query definitions
  router/               # Vue Router configuration
  services/
    canasta/            # Canasta scoring and session storage
    swipe/              # Swipe session storage and game constants
    gw2/                # GW2 API clients, parsers, caching, and aggregators
  stores/               # Pinia stores
  types/                # Shared TypeScript types
  views/                # Page-level application views
  assets/               # Global styles and game assets
  App.vue               # Root application component
  main.ts               # Application entry point
docs/                   # Architecture and feature backlog documentation
  architecture-intake-checklist.md  # API/data architecture checklist and guardrails
  canasta-feature-backlog.md  # Feature backlog and future ideas
  gw2-feature-backlog.md      # GW2-focused backlog and planning notes
.devtool/features/      # Kanban feature files
firebase.json           # Firebase Hosting configuration
package.json            # Scripts and app version
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

---

## Kanban Board

Project feature tickets are stored as Markdown files in `.devtool/features/` and rendered by the Kanban Markdown extension in VS Code.

Open the command palette with **Ctrl + Shift + P** (or **Cmd + Shift + P** on macOS), then search for `Kanban`.

Use these title prefixes when creating tickets:

```text
feat: ...
bug: ...
tech debt: ...
```

Completed tickets belong in `.devtool/features/done/`. Keep the ticket status and acceptance notes current as work moves through the board.

---

## Commits and Releases

The source repository is hosted on [GitHub](https://github.com/LizBrown-5280/tranquilitycea). GitHub should contain the committed release source before that release is deployed to Firebase.

Use a typed commit message for application changes:

```text
feat: ...
bug: ...
tech debt: ...
```

**Important: update the `version` field in `package.json` before building or deploying.** The version is injected into the Vite build and displayed in the game settings panels. A deployment built before the version is updated can publish the wrong release number, even if the version is corrected later in GitHub.

- **Feature** — increment the minor version (`0.2.0` → `0.3.0`)
- **Bug fix or technical debt** — increment the patch version (`0.2.0` → `0.2.1`)
- **Breaking change** — increment the major version (`0.2.0` → `1.0.0`)

Run the relevant checks before committing:

```sh
npm run test:unit
npm run type-check
npm run build
```

Commit and push the validated release to GitHub:

```sh
git status
git add .
git commit -m "feat: describe the change"
git push origin main
```

Do not deploy uncommitted or unpushed application changes. The GitHub commit and the Firebase deployment should represent the same release.

---

## Firebase Deployment

The app is deployed to Firebase Hosting project `portfolio-liz`, using the `workshop` hosting target and the generated `dist/` directory.

If Firebase CLI authentication has not been configured on the machine:

```sh
npx firebase-tools login
```

After the version has been updated, the checks have passed, and the release has been committed and pushed to GitHub, deploy from the project root:

```sh
npm run test:unit
npm run build
npx firebase-tools deploy --only hosting:workshop --project portfolio-liz
```

The deployment command must be run after the GitHub push. Do not change `package.json`, rebuild, or deploy again without creating and pushing a corresponding commit.

The general Firebase command is also available when all configured Firebase services should be deployed:

```sh
npx firebase-tools deploy --project portfolio-liz
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
