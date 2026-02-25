# End-to-End (E2E) Tests

## Purpose

Validate full system behavior from the user or API boundary through all layers.

## Use When

- The feature changes user-visible flows or critical business paths.
- Multiple subsystems must work together in production-like conditions.
- Regressions are costly and require high-confidence coverage.

## Scenarios

- UI or API workflows spanning authentication, data creation, and retrieval.
- Background jobs or async flows triggered by user actions.
- Cross-service integrations in a staging-like environment.

## Guidance

- Keep E2E scope minimal and focus on critical paths.
- Use stable, production-like environments and test data.
- Avoid brittle UI assertions; prefer business outcomes.
- Run E2E tests less frequently than unit/integration tests if they are slow.
