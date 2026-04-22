# Risk-Based Testing Strategy

## Principle

Choose tests from the risk inventory, not from a generic coverage target.

For every non-trivial pass, ask what could regress silently if the cleanup were wrong.

Use the resulting guardrails aggressively: when tests or equivalent verification can prove behavior preservation, they should unlock bolder refactors rather than merely justify small cosmetic edits.

Do not require pre-existing tests before every refactor. Instead:

- if existing guardrails are already sufficient, proceed;
- if the area is high-risk and guardrails are weak, add the smallest high-value tests first and treat that as progress toward the refactor.

The intended end state is not merely "some tests passed for touched files". The refactor is complete only when the relevant guarded test surface for the repository remains green after the cleanup.

## Unit tests

Use for:

- extracted helpers,
- renamed or simplified business rules,
- validation and rejection logic,
- branch-specific errors and side effects,
- formatting or parsing boundaries.

Good oracles:

- exact return values,
- exact domain state transitions,
- exact error class or reason code,
- emitted side effect or explicit lack of side effect.

For high-risk legacy code with weak coverage, characterization-style unit tests are often the first unlock step even before the larger cleanup happens.

## Property-based tests

Use when logic has invariants or broad input space:

- serialization or parsing round trips,
- sorting, grouping, deduplication, aggregation,
- authorization or eligibility predicates,
- idempotency, retry, replay, and state-machine transitions,
- generated mocked external-service states.

Record `N/A` only with a concrete reason, such as "no generated input space; pass only renamed local variables."

## Integration tests

Use when the risk spans modules:

- orchestration calling extracted domain helpers,
- persistence plus domain transition,
- API/CLI handler plus service layer,
- logging contract across a real execution path,
- adapter behavior with mocked external services.

For external services, prefer mocks, fakes, local emulators, or recorded stable fixtures unless the real contract is explicitly under test.

When risk comes from multi-module coupling rather than one local function, integration coverage is often the best guardrail to add before refactoring.

## E2E tests

Use only when:

- the project already has reliable E2E infrastructure,
- the path is user-critical,
- required external services are stable, controlled, or safely mocked,
- the same confidence cannot be gained from faster integration tests.

If E2E is unreliable or too costly, add stronger integration coverage and state the reason.

## Edge and adversarial coverage

Consider:

- null, empty, malformed, duplicate, oversized, and boundary inputs,
- unauthorized actors and invalid transitions,
- stale, duplicate, out-of-order, or replayed events,
- dependency timeout, 429/500, partial response, and inconsistent response,
- partial write, rollback, compensation, and idempotency behavior,
- concurrency or shared-state contamination when the code is stateful.

## Test hygiene

- Keep tests deterministic and close to the behavior owner.
- Prefer table-driven cases for many similar business permutations.
- Preserve failing seeds or examples from property-based tests.
- Do not weaken existing tests to fit the refactor.
- If old tests asserted implementation details, rewrite them around stable behavior while preserving the business invariant.
- Once stable guardrails exist, do not refuse a maintainability-improving refactor purely because confidence feels lower than ideal; let the guardrails decide.
- If stable guardrails do not yet exist for a high-risk area, create them as the next execution direction instead of treating the refactor as blocked forever.
