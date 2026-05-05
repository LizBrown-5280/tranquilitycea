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

## Prioritization Queue

1. C-001 Session persistence
2. C-002 Session type modes
3. C-003 User settings menu
4. C-004 Dynamic tutorial step-throughs
