# Common Code-level Edge Cases (Reference List)

## How to use
- Pick only 2-5 items directly related to the current change.
- Prioritize observable failures and high-risk inputs.

## Input and typing
- Null/missing fields: None/null, empty string, empty collection
- Unexpected types: string-number mixing, boolean-integer confusion
- Oversized input: long strings, large arrays, deeply nested objects
- Encoding issues: UTF-8/non-ASCII, invisible characters

## Boundaries and numerics
- Off-by-one: index 0/1 and length boundaries
- Overflow/underflow: integer/timestamp boundaries
- NaN/Inf: floating-point special values
- Precision loss: money/ratio calculations
- Negative values where invalid

## Structure and ordering
- Duplicate elements: dedup/accumulation logic
- Ordering assumptions: sorting stability, input-order dependence
- Empty/singleton collections: reduce/min/max/avg behavior
- Mutable/immutable mismatch: in-place mutation of input data

## Exceptions and error handling
- Parsing failures: date/timezone, JSON, CSV
- External dependency failures: 429/500/timeout
- Swallowed errors: `except pass` or missing logs
- Recovery strategy: retry count, backoff, degradation

## State and side effects
- Reentrancy: same request invoked multiple times
- Global state contamination: cache/singleton bleed-through
- Mutable default parameters: Python list/dict defaults
- Resource release: file/connection not closed

## Security and validation
- Insufficient authorization behavior
- Validation bypass via null/0/False
- Path/injection risks from string concatenation

## Performance and limits
- N+1 query patterns inside loops
- Large-data stress: timeout/memory pressure
- Hotspots: lock contention under high-frequency calls
