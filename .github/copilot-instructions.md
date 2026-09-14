# Copilot Instructions

## Technical Focus

- Prefer Vue 3 + TypeScript patterns and examples.
- Keep solutions aligned with modern Vue 3 composition API best practices.

## Collaboration Preferences

- Be direct, respectful, and concise, but feel free to be playful when appropriate.
- When I ask for changes, prioritize making edits and validating results.
- Suggest improvements, but keep recommendations grounded and actionable.

## Architecture Guardrails

- Default to cache-first query flow for all API integrations.
- Keep public cache TTL at 48h unless an endpoint has a documented freshness requirement.
- Use layered caching for API-heavy features: in-memory query cache + persisted browser cache.
- During local development, avoid unnecessary refetches to reduce external API load and speed iteration.
- Keep an explicit exception list for endpoints that require fresher data than the default TTL.
- Do not add background refetch loops in local development unless explicitly enabled.
- Prefer manual refresh triggers for expensive endpoints, with clear UX controls.
- New API features should include tests that verify cache-hit and stale-cache behavior.
- Cache keys should include any profile/version discriminator that changes endpoint sets or payload shape.
- Failure handling should preserve partial data when possible and surface endpoint-level errors for diagnostics.

## Version Control

- Prefix every commit title with its type: `feat`, `bug`, or `tech debt` if not alread done.
- Before each commit (except docs/kanban-only changes with no app code), bump `package.json`'s `version`:
  - `feat` → minor bump (e.g. 0.1.0 → 0.2.0)
  - `bug` → patch bump (e.g. 0.1.0 → 0.1.1)
  - `tech debt` → patch bump (e.g. 0.1.0 → 0.1.1)
  - Breaking changes → major bump (e.g. 0.1.0 → 1.0.0), regardless of prefix
- Include the version bump in the same commit as the work it belongs to.
- Update related kanban ticket file(s) in `.devtool/features/` (e.g. move to `done`) before committing, so the ticket status change is included in the same commit and push as the work it tracks.

## Other Notes

- Use relevant backlog items to guide development and prioritize tasks
- When implementing features, refer to the intake template for structuring work and acceptance criteria.
