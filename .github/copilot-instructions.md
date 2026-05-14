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

## Other Notes

- Use relevant backlog items to guide development and prioritize tasks
- When implementing features, refer to the intake template for structuring work and acceptance criteria.
