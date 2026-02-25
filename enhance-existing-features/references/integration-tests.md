# Integration Tests

## Purpose

Validate behavior across multiple modules or services working together.

## Use When

- A feature spans multiple internal components.
- Data flows through adapters, repositories, or service layers.
- Realistic behavior depends on configuration or environment.
- External integrations (DB, queues, APIs) must be exercised.

## Scenarios

- Repository + service + domain logic combined.
- API handlers that call business logic and persistence.
- Contract validation against external services or SDKs.
- Migrations or schema changes that affect behavior.

## Guidance

- Prefer realistic dependencies where possible; otherwise use stable test doubles.
- Use fixtures to provision test state and clean up reliably.
- Isolate external side effects (namespaces, temp data, test accounts).
- Mark or tag integration tests to separate from unit tests.
