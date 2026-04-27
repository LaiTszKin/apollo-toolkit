# Property-Based Tests

## Purpose

- Verify invariants across broad or generated input spaces.
- Validate business rules as allowed outputs, forbidden outputs, valid transitions, rejection rules, or safety constraints.
- Catch combinational, adversarial, and boundary behaviors that fixed examples miss.

## Required when

- Logic has describable invariants: calculation, transformation, sorting, aggregation, serialization, normalization, deduplication, routing, ranking, or state transition.
- Business rules can be expressed as predicates, allow-lists, forbidden states, or metamorphic relationships.
- External-service-dependent logic can use mocks/fakes to generate service states.

## Not suitable when

- The only meaningful risk is a real external integration contract.
- The input space is tiny and better covered by exhaustive unit tests.
- The behavior is UI-only or lacks a stable machine-verifiable oracle.

## Design rules

- State the property in one sentence before writing generators.
- Generate normal cases, boundaries, extremes, malformed inputs, and suspicious/adversarial combinations.
- Prefer direct business-rule predicates over vague structural checks.
- Use state-machine or sequence properties for stateful flows.
- Use metamorphic properties when exact outputs are hard to predict.
- Preserve failing seeds/examples as regression tests.
- Control sample count and input size so the suite remains practical.

## Common properties

- Round trip: `decode(encode(x)) == x`.
- Sorting is monotonic and preserves the input multiset.
- Merge/split operations preserve total count or value.
- Replaying the same command remains idempotent.
- Generated invalid or unauthorized inputs always fail with an expected result class.
- Generated transitions always end in allowed states or explicit rejections.
- Under generated mocked service states, fallback, retry, and compensation rules still hold.

## Recording

- Record `PBT-xx`, property, generator strategy, oracle, requirement mapping, and replay instructions for failures.
