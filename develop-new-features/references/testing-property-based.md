# Property-based Testing Principles

## Purpose
- Verify invariants/properties hold across broad input spaces.
- Catch combinational and boundary behaviors hard to enumerate in unit tests.

## When to use
- Algorithms, transformations, serialization/deserialization, sorting, aggregation.
- Behaviors requiring consistency or reversibility (for example round-trip).
- Data structures or state transitions with clear invariants.

## Not suitable when
- Behavior depends on external systems or IO (use integration tests).
- UI/interactive flows without stable invariants.
- Very small discrete input spaces (unit tests are sufficient).

## Design guidance
- Invariants must be explicit and machine-verifiable (for example sorted output is monotonic).
- Generators should cover boundaries and extremes, not just average cases.
- Ensure reproducibility (fixed seed or replayable input generation).
- Complement unit tests; avoid duplicating fixed-case tests.
- Control cost with reasonable sample counts and input-size limits.

## Common invariant examples (description level)
- `deserialize(serialize(x)) == x`
- Sorted output is monotonic and preserves element multiset.
- Merge/split operations preserve total element count.
- Idempotency: repeating the same operation does not change results.

## Spec/checklist authoring hints
- Property/invariant: one sentence stating the rule that must always hold.
- Generator strategy: input range, distribution, and emphasized boundaries.
- Purpose: explain correctness/risk reduction value of this invariant.
