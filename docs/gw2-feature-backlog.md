# GW2 Feature Backlog

Purpose: Track GW2 Account Snapshot feature ideas and requests separate from the rest of the site.

## How To Ask Copilot To Use This List

Use one of these phrases in your prompt:

- "Use the GW2 backlog file before planning this request."
- "Add this to the GW2 feature backlog."
- "Prioritize the top 3 items from the GW2 backlog and make a plan."
- "Review docs/gw2-feature-backlog.md and implement the next item."

## Status Legend

- `idea`: Captured, not yet planned.
- `planned`: Scoped and ready for implementation.
- `in-progress`: Being actively implemented.
- `done`: Implemented and validated.
- `deferred`: Parked for later.

## Recent Progress

- May 9, 2026: Added batched GW2 item lookup expansion using comma-delimited `ids` requests with chunking, recursive graph expansion, visited-id dedupe, and depth guards.
- May 9, 2026: Finishers now resolve `unlock_items` against `/v2/items`, including related item chains exposed through item contracts.
- May 9, 2026: Shared normalized item lookup data now feeds unlocks, bank, and materials from the GW2 bootstrap store.
- May 9, 2026: Inventory Storage was split into its own section with Overview, Bank, and Materials pages so long collections are easier to navigate.
- May 9, 2026: Added Unlocks Overview as a section landing page so unlock families can follow the same section pattern without forcing a combined long grid.

## Suggested Next Slice

- Short term: expand unlock coverage beyond Finishers, Mounts, and Colors using the same shared item resolver and section-overview pattern.
- Short term: enrich hover cards with more item-contract fields from `details` for categories and inventory items that benefit from deeper metadata.
- Short term: add pagination or show-more behavior for long collections, especially Bank, Materials, and future large unlock categories.

## Intake Template

Copy and fill this format when adding an item:

- `id`:
- `title`:
- `status`: idea
- `summary`:
- `user-value`:
- `acceptance-criteria`:
- `notes`:

## Current Backlog

- Account name, world, fractal level, daily AP, monthly AP, WvW rank, and account age are extracted from the payload.
- New metric cards appear in the Progression section for at minimum fractal level, AP totals, and WvW rank.
- Display rows emit `progression display row:` strings for each surfaced field.
- Aggregator unit tests cover the new extraction logic.
- No previously-passing tests are broken.

- `id`: G-004
  `title`: Remove account key when cache is stale
  `status`: idea
  `summary`: When the account data cache expires and is cleared, also remove the stored API key. This prevents confusion where a key is shown but no account data loads, making the UX more predictable.
  `user-value`: Users won't see an API key present with missing account data, reducing confusion and support requests.
  `acceptance-criteria`:
  - When account cache is cleared due to staleness, the stored API key is also removed.
  - On next load, the UI behaves as if no key is present (locked state, prompt for key, etc.).
  - No accidental key removal if cache is still valid.
    `notes`: This should be coordinated with cache expiry logic in queryCache and key store persistence.
- `id`: G-002
  - Metric card value reflects total points, badge reflects region count.
  - Unit tests cover region row generation.
- `notes`: The payload is an array of `{ region, spent, earned }` objects.
- `id`: G-003
- `title`: Move AccountUnlockDisplayRow type into types/gw2.ts
- `status`: idea
- `summary`: The `AccountUnlockDisplayRow` interface is defined locally inside `GuildWars2View.vue` and duplicates shape already known in the unlocks aggregator. Move it to the shared types file.
- `user-value`: Reduces drift risk between the aggregator and view; makes the type reusable.
- `acceptance-criteria`:
  - `AccountUnlockDisplayRow` is exported from `types/gw2.ts`.
  - The local definition in `GuildWars2View.vue` is removed and replaced with the shared import.
  - No functional behavior changes.
- `notes`: Low risk, good housekeeping. Good warm-up task.

- `id`: G-004
- `title`: Wallet locked/no-key empty state
- `status`: idea
- `summary`: The Wallet section shows a generic `empty` state with no explanation when no API key is provided. Characters and Inventories show a tailored "locked" state with guidance. Wallet should match that pattern.
- `user-value`: Consistent, informative UX across all sections.
- `acceptance-criteria`:
  - Wallet section shows `locked/no-key` state when no key is present.
  - State label and summary text match the pattern used by Characters/Inventories.
  - `deriveSectionState` in helpers.ts is updated to lock Wallet without a key.
- `notes`: Check which sections are currently hardcoded to lock vs. deriving from endpoint scope.

- `id`: G-005
- `title`: Extract metric helper logic from view into composable or aggregator layer
- `status`: idea
- `summary`: `getMetricNumericValue`, `getMetricTone`, and `getMetricBadge` are logic-heavy functions living in `GuildWars2View.vue`. They belong in a shared composable or the aggregator helpers.
- `user-value`: Keeps the view as a pure template consumer; makes metric logic independently testable.
- `acceptance-criteria`:
  - Helper functions are moved to a new `useGw2Metrics` composable or folded into `aggregators/helpers.ts`.
  - View imports and uses the moved functions without behavioral change.
  - Unit tests cover the extracted logic.
- `notes`: Consider whether these are pure enough for a service-layer helper vs. a Vue composable.

- `id`: G-006
- `title`: Loading skeleton / placeholder UI during public phase
- `status`: idea
- `summary`: During `loadingPublic`, the section metric grids render as empty state with no indication that data is incoming. Add skeleton placeholder cards so the layout feels alive during the initial fetch.
- `user-value`: Reduces perceived load time; prevents confusing flash of empty state.
- `acceptance-criteria`:
  - Each section panel shows skeleton card placeholders while `lifecycle === 'loadingPublic'`.
  - Skeletons are replaced by real metric cards when data arrives.
  - No layout shift between skeleton and loaded state.
- `notes`: A CSS-only approach (animated shimmer via pseudo-elements) keeps bundle size minimal.

- `id`: G-007
- `title`: fatalError lifecycle state handling
- `status`: idea
- `summary`: `fatalError` is defined in `Gw2LifecycleStatus` and in the types but is never set by the store and never handled in the view. Wire it up for cases like a totally failed public phase or orchestrator throw.
- `user-value`: Prevents silent failures; gives the user actionable feedback when nothing loads.
- `acceptance-criteria`:
  - Store sets `lifecycle = 'fatalError'` when the public load fails completely.
  - View renders a clear error state with a retry affordance when `lifecycle === 'fatalError'`.
  - Unit tests cover the fatal error path.
- `notes`: Decide what threshold triggers `fatalError` vs. `partialError` — e.g. zero successful endpoints vs. some.

- `id`: G-008
- `title`: Achievement sample display rows
- `status`: idea
- `summary`: `account_achievements_page` is fetched and a completed count is surfaced, but no individual achievement titles or category rows appear. Add display rows for completed achievements in the Progression section.
- `user-value`: Players can see a snapshot of what they've accomplished recently.
- `acceptance-criteria`:
  - Completed achievement entries from the sample appear as `progression display row:` strings with title and category.
  - Row count is capped with a note indicating it is a sample.
  - Aggregator unit tests cover achievement row generation.
- `notes`: Achievement names require a lookup against `/v2/achievements` — add a public endpoint for achievement details if not already present. May be a larger task than it looks.

- `id`: G-009
- `title`: Paginated / "show more" for capped display lists
- `status`: idea
- `summary`: Wallet (16), bank slots (16), materials (20), unlock rows (20/category), and characters (12) are all hard-capped with no UI path to see more. Add a "show more" or paginated expansion for any list that has been capped.
- `user-value`: Players with large accounts aren't silently missing data.
- `acceptance-criteria`:
  - Each capped list shows a count indicator if rows were truncated (e.g. "Showing 16 of 43").
  - A "Show all" or paginated control expands the full list.
  - Caps can remain in place for initial render performance; expansion is on-demand.
- `notes`: Largest impact is Wardrobe Skins (thousands of items). Tackle unlock categories before wallet/bank.

- `id`: G-010
- `title`: Remove progressionPublicQuery from loadLandingPublic(), start with wallet
- `status`: planned
- `summary`: The `loadLandingPublic()` call currently includes `progressionPublicQuery`, which brings in progression/account data that isn't yet integrated into the wallet display. Remove progression from the initial load and focus on wallet-only load path. Progression will be added back later as a separate query once wallet features are stable.
- `user-value`: Reduces initial load scope; allows wallet feature development to proceed without progression dependencies; simplifies incremental feature delivery.
- `acceptance-criteria`:
  - `progressionPublicQuery` is removed from `loadLandingPublic()`.
  - Wallet data still loads and displays correctly.
  - No console errors related to missing progression data.
  - Tests verify wallet-only load path works as expected.
- `notes`: Progression query will be added back later as a deferred task once wallet is mature enough to integrate additional account metrics.

- `id`: G-011
- `title`: Loading spinners and left sidebar menu styling refinement
- `status`: idea
- `summary`: The left sidebar menu is currently intrusive and takes up significant visual space. Add loading spinners to individual menu items to show section load progress, and refine the sidebar styling to be more compact and less prominent (smaller font, reduced padding, optional collapse affordance).
- `user-value`: Better UX feedback during section loads; cleaner, less cluttered layout that keeps focus on content.
- `acceptance-criteria`:
  - Loading state spinners appear on individual menu items as their sections load.
  - Left sidebar styling is refined (smaller font, reduced padding, optional collapse).
  - Layout remains accessible and readable at smaller widths.
  - No layout shift when spinners appear/disappear.
- `notes`: Consider whether sidebar should be collapsible on mobile. Finalize style direction (e.g., icon-only vs. text + icon) in design pass.

- `id`: G-012
- `title`: Owned vs. total counts for unlock categories and collections
- `status`: idea
- `summary`: Several unlock categories (Finishers, Mounts, Colors, etc.) already compute owned counts in some places, but counts are not consistently surfaced across all collection views. Add owned/total count badges or indicators wherever a user owns a subset of a fixed pool — e.g. "42 / 115 Finishers", "8 / 10 Mounts". Extend this to other enumerable collections (bank slots used, wallet non-zero currencies, etc.) where a denominator is knowable.
- `user-value`: Players get an at-a-glance completion picture for each collection without drilling in.
- `acceptance-criteria`:
  - Each unlock category section shows an owned/total count (e.g. "X / Y").
  - Count appears on both the category overview card and within the section header.
  - Total denominator is sourced from the static manifest or API total where available.
  - No count is shown when the denominator is unknown (graceful omission, not a broken fraction).
  - Unit tests cover count derivation for at least one category.
- `notes`: Finishers and Colors may already have partial count data — check aggregator outputs first before adding new endpoint calls. Mounts have a known fixed pool.

- `id`: G-013
- `title`: Revisit and refine HoverCard layout
- `status`: deferred
- `summary`: The current HoverCard layout was designed with the data available at the time. As more item-contract fields become populated (type, rarity, level requirements, description, details, etc.), the layout will need a rearrangement pass to handle density, hierarchy, and visual balance. Deferring until more fields are consistently populated so the layout decision is informed by real data.
- `user-value`: Hover cards feel polished and readable once they carry richer content.
- `acceptance-criteria`:
  - HoverCard layout is reviewed and updated once key item-contract fields (rarity, level, description, details block) are reliably populated.
  - Typography hierarchy is clear: name > type/rarity > stats/details > description.
  - Layout handles missing optional fields gracefully without leaving blank gaps.
  - Visual design is consistent with overall GW2 section aesthetic.
- `notes`: Do not start this until at least rarity, level, and one details variant are consistently rendering. Check HoverCard.vue and itemCard.vue for current field coverage before layout work begins.

## Prioritization Queue

1. G-001 Surface account overview fields
2. G-003 Move AccountUnlockDisplayRow type into types/gw2.ts
3. G-010 Remove progressionPublicQuery from loadLandingPublic(), start with wallet
4. G-004 Wallet locked/no-key empty state
5. G-012 Owned vs. total counts for unlock categories and collections
6. G-002 Mastery points display rows
7. G-005 Extract metric helper logic from view
8. G-007 fatalError lifecycle state handling
9. G-011 Loading spinners and left sidebar menu styling refinement
10. G-013 Revisit and refine HoverCard layout (deferred — waiting on field coverage)
11. G-006 Loading skeleton during public phase
12. G-008 Achievement sample display rows
13. G-009 Paginated / "show more" for capped display lists
