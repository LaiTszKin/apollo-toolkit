# Repository Performance Scan And Backlog Selection

## Purpose

Build a factual performance map before changing code, then choose the highest-value optimizations while tracking module-by-module performance deep-read coverage.

## Required scan

- Read `AGENTS.md`, `README*`, project docs, manifests, task runners, CI configs, benchmark setup, profiler setup, and test setup.
- List entrypoints: CLI commands, servers, workers, jobs, frontend routes, scripts, libraries, public packages, and scheduled tasks.
- Identify core domain modules, persistence/query boundaries, external integrations, serialization/parsing paths, logging utilities, queues, caches, and test helpers.
- Create a module inventory and coverage ledger using `references/module-coverage.md`.
- For each module, scan through the available performance job lenses instead of treating scan as generic code reading.
- Inspect current git state before editing so unrelated user changes are not overwritten.
- Identify generated, vendored, lock, snapshot, build-output, fixture, compiled, and minified files; exclude them unless they are human-maintained source.

## Performance backlog signals

Prioritize files or functions with:

- measured slow requests, commands, jobs, tests, startup, builds, or user-visible interactions,
- high fan-in, high loop counts, high request frequency, or repeated invocation in long-running workers,
- avoidable nested loops, repeated scans, repeated sorting, repeated parsing, or repeated conversions,
- N+1 database, network, filesystem, or external API calls,
- unbounded concurrency, serial work that can be safely batched, or pipelines without backpressure,
- repeated serialization/deserialization or large intermediate objects,
- allocation churn, excessive cloning/copying, or memory-pressure paths,
- caches with missing invalidation, excessive retention, or low hit value,
- logs, metrics, traces, or benchmarks that hide where time is spent.

## Evidence to capture

For each candidate record:

- file path and symbol name,
- owning module or module cluster,
- job lens that exposed the issue,
- performance evidence: benchmark, trace, profiler output, log timing, production symptom, or complexity analysis,
- expected speed, throughput, allocation, IO, or complexity improvement,
- correctness risks and behavior invariants,
- tests, benchmarks, or validations needed to prove safety,
- reason to defer if the candidate requires product, architecture, operational, or production-data approval.

## Exclusion rules

Do not optimize:

- third-party, generated, compiled, or minified artifacts,
- snapshots where churn would hide signal,
- code the user marked as actively edited elsewhere,
- public schema/API names or data contracts that require migration planning,
- cold paths where the optimization makes code harder to maintain without evidence of value,
- areas that cannot be validated and are not causing a clear performance risk.

## Backlog scoring

Prefer a small set of high-confidence improvements over an exhaustive sweep.

Score each candidate by:

1. **Impact**: latency, throughput, CPU, memory, IO, user criticality, and call frequency.
2. **Evidence**: measurement quality or clear complexity proof.
3. **Correctness confidence**: ability to preserve business behavior.
4. **Validation**: ability to benchmark, test, or otherwise prove equivalence.
5. **Blast radius**: number of modules, public contracts, persistence paths, and operational assumptions affected.

Start with high-impact, high-evidence, low-blast-radius items. Escalate broad changes only when smaller passes cannot resolve the root performance problem.

Do not finish from backlog scoring alone. Completion also requires the module coverage ledger to show that every in-scope module has been deeply read and either improved, validated-clear, deferred, or excluded with evidence.
