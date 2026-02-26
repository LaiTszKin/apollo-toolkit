# Property-based Testing Guide

## Purpose
- Verify invariants across large input combinations.
- Catch boundary behavior that manual enumeration misses.

## Required when
- If changes include logic with describable invariants (calculation, transformation, sorting, aggregation, serialization), add/update property-based tests.
- If not applicable, record `N/A` with a concrete reason.

## Common invariants
- Round-trip: `decode(encode(x)) == x`
- Idempotency: repeated execution does not change the result
- Monotonicity/conservation/set invariance

## Design guidance
- Invariants must be machine-verifiable.
- Generator strategy should include boundaries and extremes.
- Control execution cost while preserving reproducibility.

## Recording rules
- If specs are used, record cases and outcomes in `checklist.md`.
- If specs are not used, record cases or `N/A` reasons in the response.
