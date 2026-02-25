# Property-Based Tests

## Purpose

Validate invariants across a broad range of inputs, beyond hand-picked examples.

## Use When

- You can describe rules that must always hold (invariants).
- Behavior should be stable under many input combinations.
- Bugs are likely to appear with unusual or boundary inputs.

## Scenarios

- Idempotence (running twice yields same result).
- Round-trip properties (encode/decode, serialize/deserialize).
- Ordering or commutativity constraints.
- Monotonicity (increasing input never decreases output).
- Data structure invariants (sortedness, uniqueness, bounds).

## Guidance

- Choose a property-based framework suitable for the stack (e.g., Hypothesis, fast-check, jqwik).
- Define simple, composable properties; keep assertions minimal but strict.
- Constrain generators to valid domains to avoid meaningless failures.
- Keep runtime reasonable; cap examples and shrink failing cases.
