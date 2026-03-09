# Red-Team Extreme Scenarios

Use this reference to force adversarial thinking before implementation changes.

## Attacker goals

Map each review to one or more attacker goals:

1. Drain funds directly (unauthorized transfer, over-withdrawal, liquidation abuse)
2. Create synthetic value (rounding mint, accounting mismatch, replay settlement)
3. Block system availability (DoS against settlement or risk controls)
4. Gain privilege (role escalation, cross-tenant access, admin action abuse)
5. Corrupt risk signals (oracle/feed manipulation, stale data acceptance)

## Attacker capabilities baseline

Assume attacker can:

- Send high-frequency concurrent requests.
- Replay identical requests/messages with altered timing.
- Provide malformed, boundary, or adversarial payloads.
- Trigger retries and partial-failure paths repeatedly.
- Coordinate across multiple accounts or contracts.

## Extreme scenario catalog

Evaluate the most relevant scenarios for the target code path.

### 1) Concurrency + replay chain

- Trigger duplicate settlement/debit with same business intent.
- Exploit race between validation and write commit.
- Target result: double-credit or double-withdraw while logs appear normal.

### 2) Precision dust exploitation

- Alternate many micro-operations near precision boundaries.
- Exploit inconsistent rounding between read path and write path.
- Target result: accumulate extractable value while bypassing threshold alarms.

### 3) Oracle/API degradation abuse

- Force stale or fallback price path under timeout/5xx pressure.
- Inject outlier but schema-valid values to pass weak sanity checks.
- Target result: under-collateralized borrowing, unfair liquidation, or bad settlement price.

### 4) Authorization boundary hopping

- Probe object-level access control across tenant/account IDs.
- Combine optional parameters to bypass policy branches.
- Target result: act on another user account without direct privilege.

### 5) Lifecycle desynchronization

- Interrupt multi-step transaction between status transitions.
- Re-enter process while previous step is partially committed.
- Target result: state shows success while funds/ledger are inconsistent.

### 6) Circuit-breaker and safety toggle abuse

- Find fail-open behavior when dependency health checks fail.
- Abuse feature flags or maintenance modes with weak enforcement.
- Target result: risky operations continue when protections should halt them.

## Red-team execution checklist

For each selected scenario, record:

- Entry point and trust boundary crossed
- Preconditions attacker must satisfy
- Attack sequence (step-by-step)
- Expected failure point if system is secure
- Concrete evidence path (`path:line`) and failing test name

## Completion standard

Treat a scenario as remediated only when:

- The exploit-path test fails before the fix.
- The same test passes after the fix.
- A normal business-flow regression test still passes.
