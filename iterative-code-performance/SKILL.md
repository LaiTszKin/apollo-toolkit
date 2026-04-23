---
name: iterative-code-performance
description: >-
  Improve an existing codebase through repeated evidence-based repository-wide
  performance scans, module-by-module deep-read coverage, and behavior-safe
  speed optimizations until no known in-scope actionable bottleneck or unvisited
  in-scope module remains: measure hot paths, reduce algorithmic complexity,
  remove avoidable repeated work, optimize IO and batching, control allocation
  churn, improve caching only where invalidation is clear, and add benchmark or
  regression guardrails while preserving intended business behavior and the
  system's macro architecture. Use when users ask for comprehensive speed,
  latency, throughput, CPU, memory-allocation, query, batching, or hot-path
  optimization across a repository.
---

# Iterative Code Performance

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` after the repository is truly iteration-complete.
- Conditional: `systematic-debug` when a performance test, benchmark, load run, or production trace exposes a real business-logic defect that must be fixed at the true owner; `improve-observability` when profiling signals are missing or measurement requires durable logs, metrics, or traces.
- Optional: `discover-edge-cases` for high-risk boundary, concurrency, cache-invalidation, or load-shape exploration before changing hot paths.
- Fallback: If required completion dependencies are unavailable, finish performance work and validation first, then report exactly which documentation, constraint-sync, or observability action could not run.

## Standards

- Evidence: Read repository docs, project constraints, source, tests, logs, benchmarks, profiler output, build scripts, entrypoints, and nearby abstractions before editing; every optimization must be justified by measured evidence or clear complexity analysis tied to a plausible hot path.
- Execution: Run a continuous three-step loop of full-codebase performance scan → choose this round's jobs and optimize → if and only if the latest full-codebase scan is clear, update docs and constraints; otherwise return to scanning immediately. Maintain a module inventory and coverage ledger so every in-scope module receives a performance-oriented deep-read iteration before completion. Do not treat jobs as workflow steps. Do not produce a completion report while any known in-scope actionable bottleneck or unvisited in-scope module remains.
- Quality: Resolve as many inherited performance problems as safely possible without changing intended behavior or the system's macro architecture. Do not optimize by guessing, weakening correctness, adding stale caches, hiding failures, or moving cost to another critical path without evidence.
- Output: Return iteration-by-iteration decisions, selected jobs, module coverage status, changed files, speedup or complexity evidence, behavior-preservation evidence, benchmark and regression guardrails, validation results, and docs/constraint sync status only after the latest scan shows no remaining known actionable in-scope bottleneck and no unvisited in-scope module.

## Mission

Leave the repository materially faster by continuously scanning the whole codebase, landing the highest-value safe performance optimizations available at each moment, and repeating until there is no known in-scope actionable performance gap left to fix.

For this skill, `macro architecture` means the system's top-level runtime shape and overall operating logic: major subsystems, top-level execution model, deployment/runtime boundaries, persistence model, service boundaries, and the end-to-end way the whole system works. Ordinary module interactions, helper extraction, local data-structure changes, internal batching, query shaping, memoization inside an owner, and local hot-path decomposition do not count as macro-architecture changes by themselves.

## Three-Step Loop

### 1) Scan the repository

- Read root guidance first: `AGENTS.md`, `README*`, package manifests, task runners, CI/test config, benchmark tooling, profiler setup, and major project docs.
- Map runtime entrypoints, domain modules, external integrations, persistence/query boundaries, queue or job workers, request paths, hot loops, and current performance guardrails.
- Exclude generated, vendored, lock, build-output, fixture, snapshot, or minified files unless evidence shows they are human-maintained source.
- Build or refresh a concrete repository-wide backlog of known actionable performance issues.
- Build or refresh a module inventory and coverage ledger; every in-scope module starts as unvisited until it has received a performance-oriented deep-read iteration with callers, callees, tests, logs, benchmarks, relevant contracts, and each available job lens inspected.
- Re-scan the full codebase after every landed iteration, not only the files just changed.
- Load `references/repository-scan.md` for the scan checklist and performance-backlog shaping rules.
- Load `references/module-coverage.md` for module inventory, performance deep-read coverage, easy-first ordering, and completion rules.

### 2) Choose this round's jobs and optimize

- Choose jobs only after the latest full-codebase performance scan. Jobs are optional execution directions, not ordered workflow steps.
- Treat module scanning and job choice as one linked activity: inspect the selected module through every available performance job lens before deciding which jobs actually land in this round.
- Select the smallest set of jobs that can safely improve the currently selected module or module cluster under current correctness and measurement guardrails.
- Before choosing or deferring an optimization, explicitly assess implementation confidence as a combination of the agent's own ability to understand and complete the change, the objective safety net from tests, benchmarks, and other guardrails, the clarity of rollback or repair paths, and the task's inherent difficulty. Do not treat difficulty alone as low confidence; when strong tests and benchmarks guard the behavior, use them to support bolder changes because failures can be driven back to green.
- Prefer evidence-first ordering: start with bottlenecks that are measured, user-visible, high-frequency, or have clear algorithmic waste; use easy-first module ordering when it builds profiling context, tests, benchmarks, or seams that make harder hot paths safer later.
- Do not keep revisiting familiar modules while other in-scope modules remain unvisited unless the familiar module blocks the next unvisited module's safe performance deep read.
- Prefer smaller, high-confidence optimizations that reduce latency, CPU, memory churn, IO round trips, or repeated work without broad behavior risk.
- If a desired optimization is high-risk and weakly guarded, make benchmark, characterization, or regression guardrail-building part of this round instead of stopping.
- If a file feels too coupled, too central, or too risky for a direct hot-path rewrite, do staged unlock work rather than declaring the area blocked.
- Read all directly affected callers, tests, interfaces, logs, persistence/query contracts, cache invalidation rules, and concurrency assumptions before editing.
- Validate from narrow to broad after each bounded round, then perform a full-codebase stage-gate decision:
  - if any known in-scope actionable bottleneck still remains or any in-scope module has not received a deep-read iteration, return to Step 1;
  - only continue to Step 3 when the latest scan is clear.

Load references for this step only as needed:

- `references/module-coverage.md` for choosing the next module and proving every in-scope module has been deeply read through the available performance-job lenses.
- `references/job-selection.md` for next-job choice conditions and tie-breakers.
- `references/measurement-and-benchmarking.md` for profiling, benchmark, baseline, and before/after comparison rules.
- `references/algorithmic-complexity.md` for complexity, data-structure, and repeated-work optimization.
- `references/io-batching-and-queries.md` for database, network, filesystem, external API, and batching optimization.
- `references/caching-and-memoization.md` for safe cache introduction, cache removal, and invalidation rules.
- `references/allocation-and-hot-loops.md` for CPU loops, allocation churn, serialization, parsing, and memory-pressure cleanup.
- `references/concurrency-and-pipelines.md` for bounded parallelism, async pipelines, backpressure, and queue throughput.
- `references/coupled-hot-path-strategy.md` for staged unlock work on large coupled or apparently core hot-path files.
- `references/iteration-gates.md` for validation cadence, stage-gate rules, and stop criteria.

### 3) Update project documents and constraints

Only enter this step when the latest full-codebase scan confirms there is no remaining known actionable in-scope performance issue and every in-scope module has received a deep-read iteration, except items explicitly classified as blocked, unsafe, speculative, low-value, excluded, approval-dependent, or requiring production-only measurement that is unavailable.

- Run `align-project-documents` when README, architecture notes, setup docs, benchmark docs, performance budgets, operational docs, or test guidance may have drifted.
- Run `maintain-project-constraints` to verify `AGENTS.md` still matches the repository's real architecture, business flow, commands, and conventions.
- Update only the documentation and constraints that changed in reality because of the optimization.

## Hard Guardrails

- Do not change intended business logic while optimizing, except to fix a real defect exposed by tests and verified at the true owner.
- Do not change the system's macro architecture unless the user explicitly expands scope.
- Do not optimize from vibes alone; require measurement, traces, logs, benchmark baselines, complexity analysis, or repeatable workload evidence.
- Do not add caches without explicit ownership, invalidation, size bounds, failure behavior, and tests or equivalent validation.
- Do not improve one metric by silently worsening a more important user-visible path, correctness invariant, memory ceiling, or operator workflow.
- Do not use one-off scripts to rewrite product code.
- Do not stop early just because a hot path is large, central, or historically fragile; if a safe unlock step exists, that is the next job.
- Do not stop before every in-scope module has been inventoried, deeply read, and either improved, validated as clear, or explicitly deferred/excluded with evidence.
- Do not weaken tests, benchmarks, timeouts, or assertions to make an optimization pass; fix the real defect, stabilize the benchmark, or update stale expectations to stable invariants.
- Do not add micro-optimizations that make code harder to maintain unless evidence shows the path is hot enough to justify the tradeoff.

## Completion Report

Only report completion after Step 3 is done, the latest Step 1 scan is clear, and the module coverage ledger has no unvisited in-scope module.

Return:

1. Iterations completed and the jobs selected in each iteration.
2. Stage-gate verdict after each full-codebase re-scan.
3. Module coverage ledger summary: modules deep-read, improved, validated-clear, deferred, or excluded.
4. Key files changed and the performance issue each change resolved.
5. Speedup evidence, complexity change, or bottleneck-removal evidence, including baseline and after measurements where available.
6. Business behavior preservation evidence.
7. Benchmarks, regression tests, or other guardrails added or updated, including property/integration/E2E/load-test `N/A` reasons where relevant.
8. Validation commands and results.
9. Documentation and `AGENTS.md` synchronization status.
10. Remaining blocked, production-measurement-only, or approval-dependent items, if any.
