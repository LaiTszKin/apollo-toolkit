# Performance Job Selection Guide

## Purpose

Help the agent choose the next execution direction after each full-codebase performance re-scan.

These are job-selection rules for Step 2 of the main skill loop. They are not workflow steps.

The goal is not to force one permanent order. The goal is to choose the next job that most safely improves the selected module or module cluster and unlocks later work.

Before choosing, the agent should first scan the selected module through every available performance job lens. Job selection happens after that scan; it is not a substitute for that scan.

## Available jobs

- measurement / benchmarking
- algorithmic complexity / repeated-work cleanup
- IO batching / query shaping
- caching / memoization
- allocation / hot-loop cleanup
- concurrency / pipeline tuning
- staged unlock work

## Choose `measurement / benchmarking` when

- the slow path is suspected but not proven,
- multiple candidate bottlenecks compete and prioritization would otherwise be guesswork,
- an optimization could regress correctness or user-visible latency without a baseline,
- production symptoms exist but local reproduction or profiling is missing.

## Choose `algorithmic complexity / repeated-work cleanup` when

- nested loops, repeated scans, repeated sorts, or repeated filters dominate the path,
- the same derived value is recomputed for every item or request,
- a more appropriate data structure would reduce asymptotic or constant-factor cost,
- the complexity change can be proven without changing business behavior.

## Choose `IO batching / query shaping` when

- N+1 database, network, filesystem, or external API calls exist,
- serial round trips can be safely batched or preloaded,
- query predicates, projections, pagination, or indexes are mismatched to real access patterns,
- external calls lack timeout, retry, or result-shape handling that affects throughput.

## Choose `caching / memoization` when

- the same expensive pure or owner-scoped computation repeats,
- cache ownership, invalidation, size bounds, and failure behavior are clear,
- stale data cannot violate business rules,
- a simpler repeated-work or data-structure fix is insufficient.

## Choose `allocation / hot-loop cleanup` when

- tight loops allocate avoidable objects, strings, buffers, regexes, or closures,
- repeated serialization, parsing, cloning, copying, or formatting appears in a hot path,
- memory pressure or garbage collection is part of the observed slowdown,
- changes can preserve readability or are justified by strong hot-path evidence.

## Choose `concurrency / pipeline tuning` when

- safe independent work is unnecessarily serial,
- current parallelism is unbounded or overloads downstream resources,
- queues, workers, streams, or async tasks lack backpressure,
- batching or bounded concurrency would improve throughput without changing ordering guarantees.

## Choose `staged unlock work` when

- the file feels too central or too coupled for direct optimization,
- no safe full hot-path rewrite exists yet, but a preparatory step does,
- you can reduce risk through measurement hooks, seam extraction, characterization tests, type extraction, data-shape clarification, or side-effect isolation,
- the best next move is to make a future optimization cheaper rather than solve the whole area now.

## Tie-breakers

If multiple jobs are plausible, prefer the one that:

1. addresses the highest-evidence bottleneck,
2. improves the most user-visible or high-frequency path,
3. increases safety for the next iteration,
4. removes the strongest blocker to a deeper future optimization,
5. helps an unvisited module reach performance deep-read coverage,
6. matches the agent's self-assessed ability to understand, execute, benchmark, and repair the change under current evidence,
7. preserves behavior with the clearest available guardrails.

## Hard rule

If performance evidence is too weak, `measurement / benchmarking` should usually win before code changes.

If a high-risk hot path lacks enough correctness guardrails, benchmark or characterization guardrail work should usually win before a deeper optimization.

If the area is difficult but the agent can explain the workload, behavior, affected contracts, rollback path, and available tests or benchmarks clearly, do not downgrade confidence just because the optimization is non-trivial. Strong guardrails mean accidental breakage should be repaired by returning the test and benchmark surface to green, not avoided by leaving an actionable bottleneck in place.

If any in-scope module remains unvisited, choose jobs that help the next highest-evidence or easiest useful unvisited module become deeply read, improved, or validated-clear before spending another round on already-familiar areas.
