# Allocation And Hot-Loop Cleanup

## Signals

Look for hot paths that:

- allocate new arrays, maps, regexes, formatters, buffers, or closures repeatedly,
- clone, copy, or stringify large objects unnecessarily,
- parse the same payload or date repeatedly,
- build strings through repeated concatenation in loops,
- perform expensive logging or serialization even when logs are disabled,
- retain large intermediate objects longer than needed,
- create short-lived promises or tasks in very tight loops.

## Safe cleanup moves

- Hoist invariant allocations out of loops.
- Reuse existing parsed or normalized values.
- Stream or chunk large data when repository patterns support it.
- Avoid building debug payloads unless the log level or trace is enabled.
- Replace repeated string concatenation with the project's idiomatic builder or join pattern.
- Keep object reuse local and simple; avoid shared mutable pooling unless the codebase already uses it safely.

## Memory tradeoffs

Some optimizations reduce CPU by using more memory. Record:

- maximum expected input size,
- retained memory lifetime,
- whether data is tenant/user/request scoped,
- cleanup or eviction behavior,
- effect on tail latency or garbage collection.

Do not retain large data globally without a clear lifecycle.

## Readability threshold

Allocation cleanup may make code less direct. Accept that tradeoff only when:

- profiler or benchmark evidence shows the path is hot,
- the new code remains understandable,
- comments or helper names explain non-obvious constraints,
- tests preserve the behavior being optimized.

## Validation

Use:

- allocation or memory benchmarks where available,
- profiler allocation samples,
- operation-count tests for avoidable repeated work,
- regression tests for empty, large, duplicate, and malformed inputs,
- end-to-end command/request checks when the hot loop affects public output.
