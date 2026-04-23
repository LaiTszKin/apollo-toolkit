# Measurement And Benchmarking

## Principle

Optimize from evidence. A performance change should have at least one of:

- production latency, throughput, CPU, memory, queue, or query evidence,
- profiler output,
- repeatable benchmark baseline,
- test runtime profile,
- log or trace timings,
- clear algorithmic complexity proof tied to a plausible workload.

If none exists, measurement is usually the next job.

Measurement also informs confidence, but it is not the only input. The agent must assess its own ability to understand and complete the optimization, then combine that self-assessment with task difficulty, benchmark quality, correctness tests, rollback options, and repair paths. Strong tests and repeatable benchmarks should make difficult changes more actionable because failures can be diagnosed and driven back to green.

## Baseline rules

Before changing a hot path, record:

- command, scenario, fixture, data size, seed, and environment,
- current timing, throughput, allocation, query count, memory, or operation count,
- variance or repeated-run notes when possible,
- correctness oracle used with the benchmark,
- reason if the path can only be measured in production.

Do not compare a cold-cache baseline with a warm-cache after result unless that is the intended user-visible scenario.

## Benchmark selection

Use the cheapest reliable benchmark that proves the risk:

- unit microbenchmarks for pure hot helpers,
- integration benchmarks for query, serialization, or multi-module orchestration paths,
- command or request benchmarks for user-visible entrypoints,
- load tests only when concurrency, backpressure, or throughput is the actual risk,
- profiler snapshots when the bottleneck location is unknown.

Avoid expensive load tests when a deterministic benchmark or integration test proves the same performance issue.

## Before/after comparisons

A useful comparison names:

- baseline command and result,
- after command and result,
- data shape and scale,
- correctness validation,
- variance or caveat,
- whether the improvement is latency, throughput, CPU, memory, allocation, query count, or algorithmic complexity.

If exact numbers are unstable, report operation counts, query counts, asymptotic complexity, or profiler rank change instead of pretending precision exists.

## Guardrail design

Performance guardrails should fail on meaningful regressions, not noise.

Prefer:

- deterministic operation or query counts,
- bounded latency budgets with generous margins only when the environment is stable,
- regression tests for duplicate work removal,
- benchmark scripts documented for local use,
- assertions on cache invalidation behavior,
- profiler notes for manual verification when automated thresholds are unreliable.

Do not add flaky timing thresholds to CI when the repository has no stable benchmark environment.

## Production-only measurement

When a bottleneck requires production data or credentials:

- capture the best local proxy evidence available,
- document the missing data source,
- avoid speculative rewrites that cannot be validated,
- add safe instrumentation or benchmark hooks if approved and useful,
- classify the remaining item as production-measurement-only if no safe local action remains.
