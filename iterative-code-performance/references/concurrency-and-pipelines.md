# Concurrency And Pipeline Tuning

## Signals

Look for:

- independent work performed serially on a critical path,
- unbounded `Promise.all`, goroutines, tasks, threads, workers, or queue dispatch,
- missing backpressure between producer and consumer,
- retries that amplify overload,
- locks, mutexes, transactions, or global caches causing contention,
- long-running jobs that hold resources while waiting on slow IO,
- pipeline stages with mismatched throughput.

## Safe concurrency moves

- Add bounded concurrency with existing project primitives.
- Batch independent work while preserving ordering where required.
- Push slow side effects behind existing queues only when delivery semantics remain the same.
- Add cancellation, timeout, or backpressure only when consistent with current contracts.
- Reduce lock scope or shared mutable state when the owner is clear.
- Avoid parallelizing code that depends on side-effect ordering.

## Backpressure and limits

Define:

- maximum concurrency,
- queue size or batch size,
- retry and timeout behavior,
- downstream rate limits,
- partial-failure handling,
- ordering guarantees,
- cancellation behavior.

Do not introduce unbounded work in the name of throughput.

## Correctness risks

Concurrency changes can alter:

- result ordering,
- duplicate handling,
- idempotency,
- transaction boundaries,
- retry timing,
- log order,
- shared test state,
- resource cleanup.

Add tests or controlled integration runs for the specific risk.

## Validation

Prefer:

- deterministic unit tests for limiters and schedulers,
- integration tests with fake slow dependencies,
- operation-count or max-in-flight assertions,
- load tests only when throughput or backpressure is the core claim,
- logs or metrics that prove bounded behavior without leaking sensitive data.
