---
id: "implement-ability-to-choose-number-of-rounds"
status: "backlog"
priority: "medium"
assignee: null
epic: null
dueDate: null
created: "2026-08-31T08:00:00.000Z"
modified: "2026-09-14T16:41:24.437Z"
completedAt: null
labels: ["feature'"]
order: "a1"
---
# Implement Ability to Choose Number of Rounds

## Acceptance Criteria

### Number of rounds setting

- [ ] In the pregame setup section, users can add the number of rounds using a number input.
- [ ] When a value is entered, it sets numberOfRounds for the session.

### When numberOfRounds is provided

If numberOfRounds has a value, the UI:

- [ ] Updates the direction text to include the total number of rounds.
- [ ] Updates the round badge from the default format to “Round ## / ##”.
- [ ] Automatically renders the correct number of round columns based on numberOfRounds.
- [ ] Next Round button - no chanages from current code, stays the same.

### When numberOfRounds is not provided

If numberOfRounds is empty, the UI:

- [ ] Changes direction text to: “Click 'Next Round' button to add new round column”.
- [ ] Displays the round badge as “Round ##” (no total count).
      Uses the Next Round button to:
- [ ] Add one new round column each time it’s clicked.
- [ ] Update the badge to reflect the current round number (e.g., increment ##).

## Notes