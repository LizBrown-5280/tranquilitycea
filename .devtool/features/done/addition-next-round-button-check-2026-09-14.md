---
id: "addition-next-round-button-check-2026-09-14"
status: "done"
priority: "medium"
assignee: null
epic: null
dueDate: null
created: "2026-09-14T16:46:03.580Z"
modified: "2026-09-14T18:15:45.000Z"
completedAt: "2026-09-14T18:15:45.000Z"
labels: []
order: "a2"
---
# Addition Next Round button check

The 'Next Round' button should have an addtional check to ensure that there is a winner selected for the round. This would need to be an addition check during the current check for the 'Next Round' button to see if it should be enabled, by checking the round inputs to see if one of them is either `0` or `-10`.

## Completed

`Next Round` now requires every current-round score to be entered and at least one score to match the configured winner value (`0` or `-10`).