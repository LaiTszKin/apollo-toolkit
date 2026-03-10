# Property-based Testing Principles

## Purpose
- Verify invariants/properties hold across broad input spaces.
- Validate business rules by generating or exhaustively enumerating meaningful input spaces and checking outputs against expected business behavior.
- Catch combinational, adversarial, and boundary behaviors that fixed examples often miss.

## When to use
- Algorithms, transformations, serialization/deserialization, sorting, aggregation.
- Behaviors requiring consistency or reversibility (for example round-trip).
- Data structures or state transitions with clear invariants.
- Business logic where the rule can be stated as input/output expectations, allowed states, forbidden states, or safety constraints.
- Logic chains that depend on external services, when those services can be replaced by controllable mocks/fakes and their states generated as part of the test space.

## Not suitable when
- The main thing being validated is the real integration contract with external systems or live IO (use integration tests).
- UI/interactive flows without stable invariants.
- Very small discrete input spaces (unit tests are sufficient).

## Design guidance
- Properties must be explicit and machine-verifiable, whether they are invariants, allowed outcome sets, rejection rules, or business-output predicates.
- Generators should cover normal cases, boundaries, extremes, malformed inputs, and suspicious/adversarial combinations.
- Prefer modeling business rules directly: generate inputs, run the logic, then assert the output/error/state transition matches the rule.
- When the behavior is stateful, prefer state-machine or sequence-based properties over isolated single-call generators.
- When exact outputs are hard to predict, use metamorphic properties (for example reordering, retrying, deduplicating, or replaying inputs should preserve an allowed relation).
- For external-service-dependent logic, mock/fake the service and generate multiple service states (success, timeout, empty, partial, stale, inconsistent, duplicate, rejected).
- Ensure reproducibility (fixed seed or replayable input generation) and preserve failing seeds/examples for regression coverage.
- Complement unit tests; avoid duplicating fixed-case tests.
- Control cost with reasonable sample counts and input-size limits.

## Common property examples (description level)
- `deserialize(serialize(x)) == x`
- Sorted output is monotonic and preserves element multiset.
- Merge/split operations preserve total element count.
- Idempotency: repeating the same operation does not change results.
- Invalid or unauthorized generated inputs always fail with an expected error/result class.
- Generated order/payment/state-transition inputs always end in an allowed business state.
- Under generated mocked service states, the business logic chain still satisfies fallback/retry/compensation rules.

## Spec/checklist authoring hints
- Property/rule: one sentence stating the rule that must always hold or the allowed outcomes that must contain the result.
- Generator strategy: input range, distribution, emphasized boundaries, and any adversarial or external-state dimensions.
- Oracle/check: describe how the test decides correctness (predicate, allow-list, reference model, or expected error class).
- Purpose: explain correctness/risk reduction value of this property.
