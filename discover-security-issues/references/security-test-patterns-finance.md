# Security Test Patterns for Financial Applications

Use these patterns to encode red-team attack paths into deterministic tests before implementing fixes.

## Core rule

For each confirmed risk, write tests in this order:

1. Failing exploit-path test (shows vulnerability exists)
2. Passing safety test after fix (shows exploit blocked)
3. Regression/contract test (shows expected normal behavior still works)

## Pattern A: Authorization bypass

- **Goal**: Ensure only permitted actors can execute sensitive actions.
- **Tests**:
  - Unauthorized actor receives explicit denial.
  - Authorized actor can complete action.
  - Cross-tenant actor cannot access another tenant/account.

## Pattern B: Double-spend, replay, idempotency

- **Goal**: Prevent duplicate settlement from retries or replayed messages.
- **Tests**:
  - Re-sending same idempotency key yields same outcome without extra debit/credit.
  - Replay of signed message/transaction is rejected after first acceptance.
  - Concurrent identical requests settle only once.

## Pattern C: Precision and rounding exploitation

- **Goal**: Prevent value leakage from arithmetic edge cases.
- **Tests**:
  - Boundary values around minimal unit/decimal precision.
  - Repeated micro-operations do not create/destroy net value unexpectedly.
  - Currency conversion follows expected rounding policy.

## Pattern D: External dependency and stale data

- **Goal**: Ensure unsafe upstream data cannot force unsafe local state.
- **Tests**:
  - Stale price/feed input is rejected or degraded safely.
  - Upstream timeout/5xx triggers fail-safe behavior.
  - Invalid signature/source is rejected.

## Pattern E: State machine and partial failure

- **Goal**: Keep lifecycle states consistent under errors.
- **Tests**:
  - Invalid transitions are denied.
  - Mid-transaction failure rolls back or compensates correctly.
  - Final state equals expected ledger snapshot.

## Pattern F: Chained extreme attack simulation

- **Goal**: Validate defense under multi-step attacker strategy.
- **Tests**:
  - Sequence test combining at least two vectors (e.g., replay + stale price).
  - Concurrency stress test near lock/transaction boundaries.
  - Attack stops at explicit secure guard with auditable error path.

## Property-based invariant ideas

Apply when tooling exists (Hypothesis, QuickCheck, Foundry fuzz, etc.):

- Total value conservation across valid operations.
- No account ends with unauthorized negative balance.
- Authorized operations preserve access boundaries.
- Replay of prior operation does not change final ledger state.

## Minimal test metadata to include

For each test, document:

- Risk ID and short title
- Preconditions/fixtures
- Attack or edge input
- Expected secure outcome
- Invariant being protected

## Validation checklist

Before closing remediation, confirm:

- All new security tests pass.
- At least one test would fail without the fix.
- At least one extreme/chained scenario was evaluated for critical paths.
- No key business flow regressed in adjacent tests.
- Test names and assertions describe security intent clearly.
