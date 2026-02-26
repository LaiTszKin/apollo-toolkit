# Common Architecture-level Edge Cases (Reference List)

## How to use
- Pick only 2-5 items directly related to the current change; avoid exhaustive scans.
- If changes involve external dependencies/concurrency/scheduling/messaging, prioritize matching sections.

## Concurrency and synchronization
- Race conditions: concurrent updates to the same resource cause overwrite/lost updates
- Deadlock/livelock: inconsistent lock ordering, reentrant lock misuse, or busy-wait loops
- Visibility/memory consistency: cross-thread state is not synchronized
- Async task leaks: background tasks not cancelled or cleaned up

## Backpressure and resources
- Backpressure failure: slow downstream causes upstream queue growth, OOM, or queue saturation
- Resource starvation: high-priority tasks monopolize resources
- Connection pool exhaustion: unreleased or delayed-release connections
- File/socket leaks: exception paths skip close/release

## Distributed systems
- Network partition/intermittent unreachable state: requires retry/degrade/isolation strategy
- Retry storms: retry amplification under failure
- Consistency gaps: stale reads or partial writes
- Duplicate messages: at-least-once delivery causes duplicate processing
- Message ordering: reordering/out-of-order events corrupt state
- Clock skew: time-based ordering/expiration becomes incorrect

## Timeout and cancellation
- Timeout not propagated: child tasks continue and consume resources
- Non-reentrant cancellation: retry causes inconsistent state
- Timeout boundary flapping: unstable behavior near timeout thresholds

## Error handling and rollback
- Partial success: multi-step writes complete only partially
- Rollback failure: compensation action fails and leaves inconsistent data
- Swallowed exceptions: errors are neither surfaced nor logged
- Missing idempotency: retries create duplicate side effects

## Deployment and versioning
- Rolling upgrade mismatch: old/new versions run together with inconsistent behavior
- Config drift: node configurations diverge
- Hot reload instability: temporary unavailability or state loss during reload
