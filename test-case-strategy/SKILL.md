---
name: test-case-strategy
description: Select and design risk-driven test cases for agent implementation work. Use when specs, new-feature work, brownfield feature changes, refactors, or bug fixes need a concrete decision about unit, regression, property-based, integration, E2E, adversarial, mock/fake, or drift-check coverage.
---

# Test Case Strategy

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Base every test decision on changed behavior, requirement IDs, risk class, dependency shape, and existing coverage; do not add tests only because a template lists them.
- Execution: Choose the smallest test level that can prove the risk, then escalate to broader tests only when lower-level tests cannot observe the behavior or contract.
- Quality: Each test must have a meaningful oracle derived from the requirement, design, or contract rather than from the implementation just written.
- Output: Return concrete test case IDs, test level, target unit or flow, oracle, fixture/mock strategy, command or verification hook, and any `N/A` reason.

## Goal

Provide one shared testing decision workflow for spec generation and implementation skills so agents select useful tests consistently and use fast focused checks to detect implementation drift.

## Workflow

### 1) Build the risk inventory

- Identify changed behaviors, requirement IDs, and affected modules.
- Classify risks before choosing test types:
  - boundary
  - regression
  - authorization or permission denial
  - invalid transition
  - idempotency, replay, or duplicate submission
  - concurrency or race
  - data integrity
  - external failure or inconsistent dependency state
  - partial write, rollback, or compensation
  - adversarial abuse
- Reuse existing coverage only after naming the exact suite, test case, and risk it already proves.

### 2) Choose the narrowest valid test level

- Use unit tests for isolated changed logic, boundaries, denials, exact errors, no-side-effect expectations, and fast implementation drift checks.
- Use regression tests when a bug-prone or historically fragile behavior must not silently return.
- Use property-based tests for business rules with describable invariants, generated input spaces, valid/invalid state transitions, or external-state matrices that can be mocked.
- Use integration tests for cross-module chains, repository/service/API/event interactions, configuration wiring, persistence, IO, and controlled external-service scenarios.
- Use E2E tests only for critical user-visible paths whose risk is not sufficiently proven by lower-level tests; keep them minimal and stable.
- Use adversarial tests for malformed input, forged identities, invalid transitions, replay, stale/out-of-order events, toxic payload sizes, and risky edge combinations.
- If E2E is too costly or unstable, replace it with integration coverage for the same risk and record the replacement.

### 3) Define the oracle before implementation

- Derive expected behavior from `spec.md`, `design.md`, `contract.md`, official documentation, or existing intended behavior.
- Never derive the oracle from the new implementation after writing it.
- Prefer exact assertions:
  - exact output
  - exact error class or denial reason
  - persisted state
  - emitted event
  - retry or compensation accounting
  - intentional absence of writes, notifications, or side effects
  - allowed state transition or rejection
- Avoid assertion-light smoke tests, snapshot-only tests, and tests that only prove "does not throw" unless that is the real requirement.

### 4) Add unit drift checks for atomic implementation tasks

- For each non-trivial atomic task, decide whether a focused unit drift check is possible.
- A unit drift check should name:
  - target unit: function, method, module, policy, parser, mapper, validator, or state transition owner
  - input state: minimal fixture, table row, fake dependency state, or boundary value
  - oracle: exact output, error, state change, or no-side-effect assertion
  - command: focused test command or existing test filter to run immediately after the task
- If no unit drift check is possible, record the smallest replacement check and a concrete reason.
- Do not allow broad integration or E2E tests to hide missing unit checks for locally owned business logic.

### 5) Record the decision

Use this compact record in planning docs or implementation summaries:

```text
Test ID: UT-01 / REG-01 / PBT-01 / IT-01 / E2E-01 / ADV-01
Requirement/Risk: R?.? / boundary | regression | ...
Target: function/module/flow
Fixture or mock strategy: ...
Oracle: exact output/error/state/no-side-effect
Verification hook: command or existing suite
N/A reason: only when this test level is not suitable
```

## Working Rules

- Start from risk and oracle, not from a desired test count.
- Prefer fast focused tests for implementation drift detection.
- Keep one test focused on one behavior or one failure mode.
- Use table-driven unit tests when many discrete business cases share one oracle.
- Use mocks/fakes for external services in business logic chains unless the real external contract itself is under test.
- Keep fixtures reproducible with fixed clocks, seeds, and controlled dependency states.
- Preserve failing generated examples or seeds as regression coverage.
- Record `N/A` only with a concrete reason tied to scope, risk, or observability.
- When a spec exists, map test IDs back to `tasks.md` and `checklist.md`.

## References

- `references/unit-tests.md`: unit test and drift-check design.
- `references/property-based-tests.md`: property-based test selection and oracle design.
- `references/integration-tests.md`: integration test selection and external-state scenarios.
- `references/e2e-tests.md`: E2E decision and replacement rules.
