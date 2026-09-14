---
id: 'ranking-badge-2026-08-31'
status: 'done'
priority: 'critical'
assignee: null
epic: null
dueDate: null
created: '2026-08-31T17:21:15.068Z'
modified: '2026-08-31T17:50:58.222Z'
completedAt: '2026-08-31T00:00:00.000Z'
labels: []
order: 'a0'
---

# Swipe Ranking Badge - Display Player Rank by Current Score

## Acceptance Criteria

### Number of rounds setting

In the pregame setup section,

- \[ \] users can choose via two radio buttons each labeled "Lowest' and 'Highest' titled "Does the lowest or highest total wins?" whether highest or lowest score wins.
- \[ \] Default to lowest.
- \[ \] Track the variable for use later

For the score tracking screen: For each player row:

- \[ \] Each row will have a simple ranking number 1 - ###.

- \[ \] It needs to be an element next to the name element in the same column

- \[ \] It needs to live in a circular badge that will have corresponding background colors

- \[ \] **Rank 1** uses a distinct highlight color. Very bold gold

- \[ \] **Rank 2** uses a second distinct highlight color. bold silver

- \[ \] **Rank 3** uses a third distinct highlight color. bold bronze

- \[ \] **Rank 4 and below** use a neutral gray style.

- \[ \] When scores change, player ranks update automatically to reflect the new score order.

- \[ \] Any change in score should immediately update the displayed standings.

- \[ \] would like a toggle button that reorders all the rows from seated order to ranking order

## Notes

- Use a compact badge or similar visual indicator so the column stays narrow.
- Consider how ties should be handled if two or more players have the same score.
- Keep the rank styling simple and easy to scan at a glance.
