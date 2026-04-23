# Performance Iteration Gates And Stopping Criteria

## Pass discipline

Each iteration must have:

- a selected module or bounded module cluster,
- a concrete performance target,
- an explicit record of which performance job lenses were checked during the deep read,
- a bounded file/symbol scope,
- one or more selected execution directions,
- baseline evidence or a reason measurement is unavailable,
- a confidence assessment covering the agent's own ability to complete the optimization, the task's inherent difficulty, objective guardrail strength, benchmark quality, and rollback or repair paths,
- expected behavior-preserving outcome,
- validation plan,
- rollback point if evidence contradicts the change.

An iteration is not "one work type", and it also does not need to include every direction every time. Within the selected scope, choose the subset of directions that has the best current evidence and leverage: measurement, complexity, IO, caching, allocation, concurrency, and/or staged unlock work.

Confidence is not a synonym for "easy". Assess whether the agent has enough understanding, skill, workload context, tests, benchmarks, validation commands, and recovery path to complete the optimization safely. A hard task can still be high-confidence when strong guardrails, characterization coverage, and clear rollback let the agent repair mistakes by making the guarded behavior green again.

Avoid starting a broad second iteration before validating the first, but do not stop after a validated iteration if known actionable performance issues remain anywhere in the in-scope codebase.

Do not stop after a validated iteration if any in-scope module remains unvisited in the module coverage ledger.

## Validation cadence

Run validation from narrow to broad:

1. Formatter or type check for touched files when available.
2. Unit tests for touched helpers and modules.
3. Benchmarks, profiler runs, query-count checks, or operation-count checks for the optimized path when available.
4. Integration tests for affected chains.
5. Broader suite or build once multiple passes interact.

If validation fails:

- determine whether the failure is pre-existing, stale test expectation, flaky benchmark, test isolation issue, or real product bug,
- fix the true owner,
- keep regression coverage for real defects,
- do not mask failures by weakening assertions or widening benchmark budgets without evidence.

If validation passes and the performance plus correctness guardrails meaningfully cover the changed behavior, do not keep a known bottleneck in place purely because of subjective confidence concerns. Reassess whether the agent has enough capability and objective support to proceed; if yes, continue, and if no, choose the smallest measurement, benchmark, or unlock step that would make the next optimization credible.

The final stopping condition also requires the relevant guarded test surface to be green; a partially red repository is not a completed optimization outcome.

## Re-scan after each iteration

Inspect the full known performance backlog for:

- modules that are still unvisited or only shallowly read,
- modules that were read but not yet checked against every available performance job lens,
- new repeated work after moved or extracted concepts,
- remaining N+1 calls, serial round trips, or excessive query shapes,
- caches that are stale, unbounded, or unnecessary,
- hot loops that still allocate avoidable objects,
- concurrency changes that need backpressure or max-in-flight proof,
- logs, metrics, traces, or benchmarks that now describe stale names or paths,
- documentation or `AGENTS.md` drift.

Then choose the next execution directions with these priorities:

1. strongest bottleneck evidence,
2. largest user-visible or high-frequency impact,
3. highest combined confidence from agent capability, workload understanding, correctness guardrails, benchmark quality, and recovery path,
4. strongest leverage for later deeper optimization,
5. lowest business-risk path toward broader system improvement.

Use `references/job-selection.md` to convert those priorities into a concrete next-job choice.

## Stage-gate after each iteration

After every validated iteration, run a deliberate full-codebase decision pass:

1. Re-scan the repository and refresh the known performance backlog.
2. Refresh the module coverage ledger and identify unvisited in-scope modules.
3. Ask whether any known in-scope actionable bottleneck still remains.
4. If yes, decide whether it should be addressed in the very next iteration or whether measurement or unlock work is needed first.
5. If the obstacle is a large, coupled, or central hot path, do not stop there; switch to staged unlock work and continue.
6. Only declare the repository iteration-complete when the re-scan shows no remaining actionable in-scope bottleneck and no unvisited in-scope module except items that are explicitly deferred or excluded under the allowed stop categories.

This stage-gate is mandatory. A validated local optimization does not by itself mean the repository is done.

## Continue when

Repeat the cycle when:

- any known in-scope actionable performance issue remains unresolved,
- any in-scope module remains unvisited,
- measured slow paths remain,
- clear algorithmic waste remains,
- avoidable IO, query, or external-service round trips remain,
- unsafe or low-value caches need removal or replacement,
- allocation churn or hot-loop repeated work remains in a material path,
- concurrency, backpressure, or batching gaps remain,
- benchmarks or profiling are missing for a high-risk optimization that is otherwise actionable.

Do not produce a final completion report while any item in this section is true. Continue with the next bounded iteration instead.

## Stop when

Stop only when there are no unresolved known in-scope actionable performance issues. Any remaining candidates must be explicitly classified as one of:

- low-value micro-optimization,
- speculative without concrete evidence,
- production-measurement-only with no safe local proxy,
- public contract migrations,
- macro-architecture changes,
- product behavior changes needing user approval,
- blocked by unavailable credentials, unstable external systems, or missing documentation,
- untestable with the current repository tooling and too risky to change safely.

If a remaining candidate cannot be placed in one of these categories, it is still an actionable gap and the agent must continue iterating rather than complete the task.

If an in-scope module has not received a performance deep-read iteration, it is still an actionable coverage gap even when the already-read modules look fast.

## Completion evidence

The final report should make the stopping point auditable:

- passes completed,
- execution directions selected per iteration,
- module or module cluster covered per iteration,
- performance job lenses checked per iteration,
- final module coverage ledger,
- stage-gate verdict after each full-codebase re-scan,
- validation commands and outcomes,
- confirmation that the guarded test surface is green after the optimization,
- speedup, throughput, latency, CPU, memory, allocation, query-count, or complexity evidence,
- behavior-preservation evidence,
- docs and constraints sync status,
- proof that the latest scan found no known actionable in-scope performance issues,
- deferred items with reason and required approval, dependency, production data, or safety constraint.
