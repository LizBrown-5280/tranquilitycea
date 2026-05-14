# Architecture Intake Checklist

Use this checklist before adding or changing API-backed features.

## Data Flow

- Define the end-to-end flow: endpoint manifest -> fetch/orchestration -> parsing -> store/query -> UI.
- Confirm where public data ends and account-scoped data begins.
- Document how partial data should render while other sections are still loading.

## Cache Strategy

- Default to cache-first reads before network fetches.
- Use in-memory query cache plus persisted browser cache for expensive public datasets.
- Keep public TTL at 48h by default.
- Explicitly document any endpoint that requires a shorter TTL and why.
- Include profile/version in cache keys when endpoint sets or payload shape can change.

## Refetch Policy

- Avoid eager background refetch loops in local development.
- Prefer manual refresh controls for expensive datasets.
- Ensure refresh behavior does not block already-available data from rendering.

## Error Model

- Preserve successful sections when some endpoints fail.
- Surface endpoint-level diagnostics (endpoint id, error type, message, required scopes).
- Distinguish invalid key, missing scope, parser errors, and network/http errors.

## Testing

- Add tests for cache hit path (no network call expected).
- Add tests for stale cache path (network call expected).
- Add tests for partial-error behavior with successful data still visible.
- Add tests for endpoint profile/key changes affecting cache keys.

## Dev Guardrails

- Minimize API calls during local development and test runs.
- Avoid introducing automatic refetch behavior without a clear opt-in.
- Keep architecture notes current in `.github/copilot-instructions.md` and project docs.

## Exception Registry

Use this registry when an endpoint cannot follow the default public TTL (48h) or default refetch policy.

| Endpoint/Profile              | Default Rule   | Exception | Reason                                      | Owner  | Review Date |
| ----------------------------- | -------------- | --------- | ------------------------------------------- | ------ | ----------- |
| example: `account_daily_data` | public TTL 48h | TTL 1h    | data changes frequently and is user-visible | @owner | 2026-06-01  |

- Keep this list small and explicit.
- Remove exceptions once the endpoint can return to defaults.
