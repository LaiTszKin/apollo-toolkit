# Algorithmic Complexity And Repeated Work

## Signals

Look for:

- nested loops over growing inputs,
- repeated full scans to answer point lookups,
- repeated sorting when one sort or heap would do,
- filtering or mapping the same collection in many branches,
- recomputing derived values inside loops,
- repeated parsing, validation, normalization, or conversion of identical inputs,
- linear membership checks where sets or maps fit the domain,
- duplicated business-rule computation across callers.

## Safe optimization moves

- Precompute lookup maps or sets at the smallest correct ownership boundary.
- Move invariant computations out of loops.
- Replace repeated scans with grouped data structures.
- Sort once and reuse the ordering when the ordering contract is stable.
- Convert repeated validation or normalization into a named helper with tests.
- Preserve stable ordering when callers rely on it.
- Keep data structures local unless shared ownership and invalidation are clear.

## Complexity evidence

Record:

- current complexity and after complexity,
- input sizes where the improvement matters,
- any ordering, deduplication, or equality semantics,
- memory tradeoff,
- correctness guardrails.

Do not claim a complexity improvement when the change only moves cost to another equally hot path.

## Tradeoffs

Prefer readability-preserving optimizations first. More complex data structures are justified when:

- workload size is large enough,
- call frequency is high enough,
- the old implementation is measurably slow or asymptotically unsafe,
- tests or invariants prove equivalence.

Avoid clever micro-optimizations when the path is cold or the complexity cost is not material.

## Correctness checklist

Before and after complexity changes, verify:

- duplicates are handled the same way,
- stable ordering remains stable when required,
- null, empty, malformed, and boundary inputs behave the same,
- floating point, currency, timestamp, and locale semantics are unchanged,
- errors and side effects occur in the same order when order matters,
- public API and persistence contracts remain stable.
