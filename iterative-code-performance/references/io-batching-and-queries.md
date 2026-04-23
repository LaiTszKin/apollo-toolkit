# IO Batching And Query Optimization

## IO signals

Look for:

- N+1 database, network, filesystem, or external API calls,
- repeated reads of the same file, config, secret, or remote resource,
- chatty persistence writes that can be safely combined,
- missing projection or over-fetching large records,
- queries that load broad datasets then filter in memory,
- serial external calls that are independent and can be bounded or batched,
- retry loops that multiply downstream load.

## Safe batching moves

- Batch by the natural owner boundary and preserve per-item error reporting.
- Use existing repository query builders, clients, and retry conventions.
- Fetch only required fields when the API supports projection.
- Push filtering, pagination, aggregation, or joins to the datastore only when semantics match.
- Add bounded concurrency instead of unbounded fan-out.
- Preserve idempotency, ordering guarantees, and partial-failure behavior.

## Query shaping

Before changing a query, identify:

- source of truth and owner module,
- expected row or document counts,
- indexes or access patterns already documented,
- transaction and consistency requirements,
- pagination and sorting contract,
- caller expectations around missing or duplicate records.

Do not add indexes, migrations, or datastore-level changes unless the user scope and repository conventions support them.

## External services

For network and API paths:

- respect provider rate limits and retry guidance,
- avoid batching that exceeds request-size limits,
- preserve timeout and cancellation behavior,
- keep request IDs and correlation fields in logs,
- use mocks, fakes, or recorded fixtures for tests when real services are not under test.

## Validation

Prefer guardrails that verify:

- query or request count decreases,
- result set and ordering are unchanged,
- partial failures are reported the same way,
- retries and timeouts still follow existing policy,
- batching preserves per-item authorization and validation.
