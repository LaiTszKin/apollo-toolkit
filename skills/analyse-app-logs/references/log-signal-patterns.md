# Log Signal Patterns

Map common log signals to likely causes. Always validate with surrounding context.

## Timeout / deadline exceeded

- Typical signals: `timeout`, `deadline exceeded`, `upstream request timed out`
- Common causes: upstream latency spike, connection pool exhaustion, DNS/TLS stalls
- Validate by checking: dependency latency trend, queue depth, connection usage, retry storms
- False-positive guard: short-lived network blips may not explain sustained failures

## Retry storm / thundering herd

- Typical signals: repeated retry messages with shrinking intervals
- Common causes: missing backoff/jitter, synchronized workers, transient dependency failures
- Validate by checking: retry counts, concurrency bursts, same request IDs repeated rapidly
- False-positive guard: scheduled batch windows can look bursty but expected

## Authentication / authorization failures

- Typical signals: `401`, `403`, `invalid token`, `signature mismatch`, `permission denied`
- Common causes: expired credentials, clock skew, role misconfiguration, key rotation mismatch
- Validate by checking: token expiry, IAM/ACL changes, auth service logs, server clock drift
- False-positive guard: malicious probing traffic may not indicate platform regression

## Resource exhaustion

- Typical signals: `OOM`, `too many open files`, `connection refused`, `cannot allocate memory`
- Common causes: memory leaks, unbounded queues, file descriptor leaks, pool mis-sizing
- Validate by checking: memory/FD trends, GC pauses, restart cadence, worker lifecycle
- False-positive guard: one-off deploy spikes can mimic leaks

## Data integrity / schema mismatch

- Typical signals: `constraint violation`, `invalid format`, `deserialization error`, `column missing`
- Common causes: incompatible deploy order, partial migrations, producer-consumer contract drift
- Validate by checking: migration history, payload schema version, deploy timeline
- False-positive guard: corrupt legacy records may produce localized errors only

## Concurrency / race condition

- Typical signals: duplicate operations, intermittent lock errors, non-deterministic failures
- Common causes: missing idempotency, lock scope too narrow, stale read-modify-write cycles
- Validate by checking: duplicate keys, overlapping timestamps, critical-section boundaries
- False-positive guard: manual replays can create similar duplicate traces

## External dependency outage

- Typical signals: transport errors, DNS failures, handshake failures, 5xx bursts from upstream
- Common causes: provider outage, certificate changes, network partition, rate limiting
- Validate by checking: provider status pages, cross-region behavior, status-code distribution
- False-positive guard: local config errors can appear as dependency outage
