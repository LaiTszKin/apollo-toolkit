# E2E Tests

## Purpose

- Verify critical user-visible paths at the closest practical level to real usage.
- Catch cross-layer behavior gaps that lower-level tests cannot prove.

## Required when

- A change affects a high-impact user-visible flow.
- The flow is multi-step, cross-system, historically fragile, revenue-critical, permission-sensitive, or hard to reason about from lower-level tests alone.
- The environment and test data can be kept stable enough for maintainable coverage.

## Not suitable when

- Unit and integration tests already prove the actual risk.
- The environment is unstable or external dependencies would make the test flaky.
- The cost is disproportionate and integration tests can cover the same risk.

## Design rules

- Keep E2E minimal: one critical success path plus one highest-value denial or failure path when warranted.
- Assert business-visible outcomes, not just DOM presence or status-code success.
- Use controlled test data and avoid brittle external dependencies.
- Prefer replacing expensive E2E with stronger integration tests over adding flaky coverage.
- Record the decision per flow or risk slice; do not collapse unrelated paths into one global E2E decision.

## Recording

- Record `E2E-xx`, target flow, business-visible oracle, setup, command, and result.
- If skipped, record the replacement `IT-xx` cases and concrete rationale.
