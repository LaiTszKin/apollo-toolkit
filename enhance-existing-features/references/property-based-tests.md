# Property-based Testing Guide

## Purpose
- Verify invariants across large input combinations.
- Validate business rules by generating or exhaustively enumerating meaningful input spaces and checking outputs against expected business behavior.
- Catch combinational, adversarial, and boundary behavior that fixed examples often miss.

## Required when
- If changes include logic with describable invariants (calculation, transformation, sorting, aggregation, serialization), add/update property-based tests.
- If changes include business rules that can be expressed as allowed outputs, forbidden outputs, valid transitions, rejection rules, or safety constraints, add/update property-based tests.
- If logic depends on external services but the service can be replaced with a mock/fake to generate service states, property-based tests should cover those state combinations too.
- If not applicable, record `N/A` with a concrete reason.

## Common properties
- Round-trip: `decode(encode(x)) == x`
- Idempotency: repeated execution does not change the result
- Monotonicity/conservation/set invariance
- Generated invalid or unauthorized inputs always fail with an expected result/error class
- Generated state transitions always end in an allowed business state
- Under generated mocked service states, the business logic chain preserves fallback/retry/compensation rules

## Design guidance
- Properties must be machine-verifiable, whether they are invariants, allow-lists, rejection rules, or business-output predicates.
- Generator strategy should include normal cases, boundaries, extremes, malformed inputs, and suspicious/adversarial combinations.
- Prefer modeling the business rule directly: generate inputs, run the logic, then assert output/error/state transition matches the rule.
- When the behavior is stateful, prefer state-machine or sequence-based properties over isolated single-call generators.
- When exact outputs are hard to predict, use metamorphic properties (for example reordering, retrying, deduplicating, or replaying inputs should preserve an allowed relation).
- For external-service-dependent logic, mock/fake the service and generate multiple service states (success, timeout, empty, partial, stale, inconsistent, duplicate, rejected).
- Control execution cost while preserving reproducibility, and preserve failing seeds/examples for regression coverage.

## Recording rules
- If specs are used, record cases and outcomes in `checklist.md`.
- If specs are not used, record cases, external-state coverage, adversarial coverage, or `N/A` reasons in the response.
