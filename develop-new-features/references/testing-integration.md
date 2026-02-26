# Integration Testing Principles

## Purpose
- Verify collaboration across modules/layers and external dependencies.
- Cover integration risks unit tests cannot capture (sequence, config, IO failure).

## When to use
- Interface interactions between modules (for example service ↔ repository).
- Changes touching IO dependencies such as DB, RPC, files, cache, queues.
- Behaviors that depend on configuration combinations or environment differences.
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
- Limit dependency scope; use test doubles/local stubs when needed.
- Keep reproducible: controlled test data and recoverable environment.
- Cover failure modes such as timeout, connection failure, inconsistent data.
- Keep cost controlled; avoid broad redundant coverage (leave that to unit tests).

## Spec/checklist authoring hints
- Dependency scope: list involved modules/external systems.
- Scenario: describe cross-module flow or critical branch.
- Purpose: explain integration/configuration/failure risk being covered.
- Map behavior, test IDs, and test outcomes in `checklist.md`.
