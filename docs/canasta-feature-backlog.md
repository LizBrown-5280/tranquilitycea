# Canasta Feature Backlog

Purpose: Track Canasta-only feature ideas and requests separate from the rest of the site.

## How To Ask Copilot To Use This List

Use one of these phrases in your prompt:

- "Use the Canasta backlog file before planning this request."
- "Add this to the Canasta feature backlog."
- "Prioritize the top 3 items from the Canasta backlog and make a plan."
- "Review docs/canasta-feature-backlog.md and implement the next item."

## Status Legend

- `idea`: Captured, not yet planned.
- `planned`: Scoped and ready for implementation.
- `in-progress`: Being actively implemented.
- `done`: Implemented and validated.
- `deferred`: Parked for later.

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

- `id`: C-001
- `title`: Session persistence (new/current/previous + local storage)
- `status`: done
- `summary`: Recover active sessions after refresh/accidental navigation; provide archived session history.
- `user-value`: Prevent loss of score tracking during real gameplay.
- `acceptance-criteria`:
  - New session always available.
  - Current session available only within 4 hours.
  - Previous sessions available read-only after 4 hours.
  - Delete all sessions action available.
- `notes`: Include retention policy and configurable retention days.
  - Phase 2 baseline implemented: session chooser UI, new-session type modal, current/previous session loading hooks, startup retention prune.
  - Archived sessions now load with read-only lock and disabled fieldset controls; chooser lifecycle tests added for current/previous visibility.

- `id`: C-002
- `title`: Session type modes
- `status`: done
- `summary`: Support My Team Only, Both Teams, and Total Scores Only workflows.
- `user-value`: Match different scorekeeping styles used by players.
- `acceptance-criteria`:
  - New session asks for session type.
  - Session type is selected at session start.
  - Forms re-render correctly per mode.
- `notes`: Archived sessions remain read-only.
  - In-session mode selector was removed to prevent accidental resets.
  - My Team Only and Total Scores Only now render totals-only manual editors per team rules.
  - Manual totals scoring path added and validated with unit tests.

- `id`: C-003
- `title`: User settings menu
- `status`: done
- `summary`: Add menu for retention days and future preferences.
- `user-value`: Let players tailor behavior without code changes.
- `acceptance-criteria`:
  - Retention days configurable in UI (options: 7, 30, 60, 90, 180, 365 days).
  - Tooltip visibility toggle (on/off).
  - Settings persist across sessions.
- `notes`: Use existing retention storage helpers. Tooltip toggle should suppress the info icon triggers on scoring forms when off.
  - Implemented as a gear/settings panel with immediate persistence.
  - Includes retention days dropdown and tooltip on/off toggle.

- `id`: C-004
- `title`: Dynamic tutorial step-throughs
- `status`: idea
- `summary`: Guided walkthrough for first-time users and new scoring modes.
- `user-value`: Reduce confusion and onboarding friction.
- `acceptance-criteria`:
  - Start tutorial from menu.
  - Step-by-step highlights with next/back/skip.
  - Can be dismissed and reopened later.
- `notes`: Consider mobile-first layout and tooltips reuse.

- `id`: C-005
- `title`: Input validation — max books and max points per field
- `status`: idea
- `summary`: Enforce realistic upper bounds on book counts and point totals based on the physical limits of a 6–7 deck game. Show inline error messages when entries exceed valid ranges.
- `user-value`: Prevent data entry mistakes that would produce impossible or obviously wrong scores.
- `acceptance-criteria`:
  - Each book-count input (clean 10s, clean 5s, clean As, dirty) has a validated max derived from deck count (e.g., can't have more canastas than the cards in play allow).
  - Point entry fields (card count, penalty, manual totals) have a sensible max tied to deck size.
  - Inline validation messages appear near the offending field without blocking other inputs.
  - Errors clear immediately on correction.
  - Validation rules are centralized (not scattered per-field) and deck-count-aware if session settings expose that value.
- `notes`: Deck count is fixed at 7. Book type breakdown and per-team validation ceilings (a team could theoretically capture all cards of a type through luck, so the full game ceiling is the correct per-team input guard):

  | Field               | Book composition                                            | Cards in play                      | Max books (game total) | Per-team validation cap |
  | ------------------- | ----------------------------------------------------------- | ---------------------------------- | ---------------------- | ----------------------- |
  | `requirement7s`     | Clean, rank 7 only                                          | 4 suits × 7 decks = 28             | 28 ÷ 7 = **4**         | 4                       |
  | `requirement5s`     | Clean, rank 5 only                                          | 4 suits × 7 decks = 28             | 28 ÷ 7 = **4**         | 4                       |
  | `requirementWilds`  | 2s + jokers only                                            | (4+2) × 7 = 42                     | 42 ÷ 7 = **6**         | 6                       |
  | `requirementCleans` | Natural cards, ranks 4/6/8/9/10/J/Q/K/A (9 ranks), no wilds | 28 per rank × 9 = 252              | 4/rank × 9 = **36**    | 36                      |
  | `requirementDirtys` | ≥4 natural same-rank + ≤3 wilds                             | limited by wilds (42) and naturals | 42 (1 wild min each)   | 42                      |

  Red 3 max per team: 14 (2 per deck × 7 decks; a team can hold all of them).
  Clean and dirty books of the same rank compete for natural cards — combined per-rank book count capped at 4.
  Validation rules should be centralized constants, not scattered per-field.

- `id`: C-006
- `title`: Dark mode
- `status`: idea
- `summary`: Add a dark color scheme for the Canasta view that respects the user's OS preference and/or a manual toggle in the settings menu.
- `user-value`: Reduces eye strain during evening play sessions; feels polished and modern.
- `acceptance-criteria`:
  - Dark mode activates automatically when the OS prefers dark (`prefers-color-scheme: dark`).
  - A manual toggle in the settings menu overrides the OS preference and persists the choice.
  - All Canasta UI surfaces (forms, tabs, totals table, modals, tooltips) are legible and styled in dark mode.
  - No flash of un-themed content on load.
- `notes`: Implement via CSS custom properties scoped to a `data-theme="dark"` attribute on the root element. Piggyback on the existing settings modal (C-003) for the toggle. Coordinate with any site-wide dark mode effort if one is planned.

## Prioritization Queue

1. C-001 Session persistence
2. C-002 Session type modes
3. C-003 User settings menu
4. C-004 Dynamic tutorial step-throughs
5. C-005 Input validation — max books and max points per field
6. C-006 Dark mode
   const now = Date.now();
   const makeSession = (offsetMs, label) => {
   const ts = now - offsetMs;
   const hands = {};
   for (const h of ['hand1','hand2','hand3','hand4']) {
   hands[h] = { teamA: {}, teamB: {} };
   for (const t of ['teamA','teamB']) {
   hands[h][t] = {
   allRequirements:false,requirement7s:0,requirement5s:0,requirementWilds:0,
   requirementCleans:0,requirementDirtys:0,red3s:0,wentOut:false,
   fastClean10Books:0,fastClean5Books:0,fastCleanABooks:0,
   cardCount:0,penaltyCount:0,manualBigCount:null,manualCardCount:null,manualPenaltyCount:null
   };
   }
   }
   return { sessionId: ts, createdAt: ts, updatedAt: ts, sessionType: 'myTeamOnly', activeTab: 'hand1', handState: hands, schemaVersion: 1 };
   };

const s1 = makeSession(6 _ 60 _ 60 _ 1000); // 6 hours ago
const s2 = makeSession(2 _ 24 _ 60 _ 60 \* 1000); // 2 days ago

localStorage.setItem(`canasta:session:${s1.sessionId}`, JSON.stringify(s1));
localStorage.setItem(`canasta:session:${s2.sessionId}`, JSON.stringify(s2));

const idx = JSON.parse(localStorage.getItem('canasta:sessions:index') || '[]');
idx.push(s1.sessionId, s2.sessionId);
localStorage.setItem('canasta:sessions:index', JSON.stringify(idx));

console.log('Seeded 2 archived sessions — refresh the page.');
