# Caching And Memoization

## Use caching only when

- the same expensive computation or read repeats,
- the cached value has a clear owner,
- invalidation or expiration rules are explicit,
- stale data cannot violate business rules,
- memory growth is bounded,
- errors and partial results are handled deliberately,
- benchmark or profiling evidence shows caching is worthwhile.

## Prefer simpler fixes first

Before adding a cache, ask:

- Can repeated work be removed by computing once in the caller?
- Can the data structure be reshaped locally?
- Can the query or API call fetch all needed data in one pass?
- Can a pure helper accept precomputed inputs?

If yes, prefer the simpler change.

## Cache design checklist

Define:

- key shape and equality semantics,
- value ownership,
- lifecycle and invalidation trigger,
- maximum size or eviction policy,
- concurrency behavior,
- error caching policy,
- observability for hit, miss, eviction, or stale detection when useful,
- tests or benchmarks proving both correctness and value.

## Memoization boundaries

Good boundaries:

- within one request, command, job, or transaction,
- inside a pure helper for repeated identical inputs,
- around immutable configuration or static metadata with reload semantics,
- inside an owner module that already controls lifecycle.

Risky boundaries:

- global mutable caches with no invalidation,
- cross-tenant or cross-user caches,
- caches keyed by partial authorization context,
- caches around time-sensitive, money, inventory, permission, or security decisions,
- caches that hide external-service failures.

## Cache removal

Removing or narrowing a stale cache is a performance improvement when it:

- prevents memory leaks,
- avoids stale correctness risk,
- reduces invalidation overhead,
- improves tail latency by removing lock contention,
- simplifies a path where hit rate is low.

Validate both speed and correctness after removal.
