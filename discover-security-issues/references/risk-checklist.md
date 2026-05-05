# Financial App Risk Checklist

Use this checklist to confirm exploitable risks with code evidence.

## Severity rubric

Score each item as `Impact x Exploitability` (1-5 each):

- 20-25: Critical
- 12-19: High
- 6-11: Medium
- 1-5: Low

## Red-team criticality rule

- Evaluate worst credible outcome, not average-case behavior.
- Assume attacker retries, parallelizes, and chains multiple weaknesses.
- Promote severity when a low-complexity exploit touches money movement, collateral safety, or privilege control.

## 1) Authentication and authorization

- Verify sensitive actions require authenticated identity.
- Verify role checks are explicit (no implicit trust from client payload).
- Verify object-level access control (tenant/account ownership checks).
- Verify admin/batch/internal endpoints are isolated and protected.

## 2) Funds integrity and accounting correctness

- Verify value conservation across debit/credit flows.
- Verify no path allows negative balances unless explicitly supported.
- Verify rounding/precision behavior is deterministic and documented.
- Verify currency conversion uses expected scale and guardrails.
- Verify integer overflow/underflow or decimal truncation cannot leak value.

## 3) Transaction lifecycle safety

- Verify idempotency for retriable requests (same key, same effect).
- Verify replayed requests/messages cannot settle twice.
- Verify race conditions cannot bypass balance/risk checks.
- Verify pending/confirmed/failed states transition atomically.
- Verify partial failures cannot leave money/state inconsistent.

## 4) External dependency and oracle/API risk

- Verify response authenticity checks (signature, source validation).
- Verify stale/invalid price data handling (max age, sanity bands, fallback).
- Verify timeouts, retry caps, and circuit breaker/degrade behavior.
- Verify upstream errors cannot silently commit unsafe local state.

## 5) Input, injection, and serialization risk

- Verify strict schema validation for amount, account, and instrument fields.
- Verify SQL/NoSQL/command/template injection controls on user-controlled fields.
- Verify unsafe deserialization or dynamic evaluation is absent.
- Verify canonicalization prevents duplicate identity keys (e.g., case/format tricks).

## 6) Secrets, config, and operational safety

- Verify secrets are never hardcoded or logged.
- Verify environment-specific safety toggles are secure by default.
- Verify audit logging captures actor, action, amount, and correlation IDs.
- Verify fail-closed defaults for critical controls.

## 7) DeFi and smart-contract specific checks (apply when relevant)

- Verify privileged functions are access-controlled and non-upgrade abuse resistant.
- Verify reentrancy, price manipulation, and flash-loan abuse defenses.
- Verify oracle manipulation windows and stale data protections.
- Verify liquidation and collateral checks cannot be bypassed by ordering/races.
- Verify invariant tests cover total collateral/debt conservation.

## Evidence standard

Accept a risk as confirmed only when at least one exists:

- Code-level proof with precise location (`path:line`) and exploitable data flow.
- Reproducible failing test that demonstrates unsafe behavior.
- Deterministic integration reproduction with clear preconditions.
