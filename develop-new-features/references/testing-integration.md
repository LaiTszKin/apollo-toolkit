# Integration Testing Principles

## Purpose
- Verify collaboration across modules/layers and external dependencies.
- Cover integration risks unit tests cannot capture (sequence, config, IO failure).
- Validate user-critical business logic chains under realistic component interaction and controlled external-service scenarios.

## When to use
- Interface interactions between modules (for example service ↔ repository).
- Changes touching IO dependencies such as DB, RPC, files, cache, queues.
- Behaviors that depend on configuration combinations or environment differences.
- The correctness question is about the whole business logic chain rather than one isolated function.
- As minimum safety replacement when E2E is not suitable.

## Not suitable when
- Single pure-function or pure-logic behavior (use unit tests).
- Full end-to-end user flow can be stably covered by E2E.

## Relationship with E2E
- If change importance/complexity is high and E2E is feasible, prefer minimal E2E for key paths.
- If E2E is hard or too costly, integration tests must cover equivalent key risks.
- Record replacement mapping in `checklist.md` (E2E-xx ↔ IT-xx) with rationale.

## Design guidance
- Focus on high-value integration points; each test should justify risk/value.
- Keep dependencies inside the application boundary near-real where practical.
- Mock/fake external services at the business-chain boundary unless the real service contract itself is what needs verification.
- Build scenario matrices for external states such as success, timeout, retries exhausted, partial data, stale data, duplicate callbacks, inconsistent responses, and permission failures.
- Add adversarial/penetration-style cases for abuse paths such as invalid transitions, replay, double-submit, forged identifiers, or out-of-order events when those risks exist.
- When workflows can partially commit, assert rollback/compensation/no-partial-write behavior instead of only final status codes.
- Assert business outcomes across boundaries: persisted state, emitted events, deduplication, retry accounting, audit trail, or intentional absence of writes/notifications.
- Add at least one regression-style integration test for the highest-risk chain whenever the change fixes a bug or touches a historically fragile path.
- Keep reproducible: controlled test data and recoverable environment.
- Keep cost controlled; avoid broad redundant coverage (leave that to unit tests).

## Spec/checklist authoring hints
- Dependency scope: list involved modules/external systems.
- Scenario: describe cross-module flow or critical branch.
- Risk: explain what integration failure, misconfiguration, or business-chain break this test can reveal.
- External dependency strategy: specify which services are mocked/faked versus near-real and why.
- Scenario matrix: list the external states or adversarial paths covered.
- Map behavior, test IDs, and test outcomes in `checklist.md`.
