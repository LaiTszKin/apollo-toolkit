# Module Coverage And Performance Deep-Read Iterations

## Purpose

Prevent the agent from repeatedly optimizing only familiar hot paths while untouched modules remain unexamined.

Use this reference in Step 1 to build the module inventory and in Step 2 to choose which module or module cluster receives the next performance deep-read iteration.

Deep-read here does not mean generic reading. It means scanning the module through each available performance job lens so the agent can identify whether measurement, algorithmic complexity, repeated-work removal, IO batching, caching, allocation cleanup, concurrency work, or staged unlock work is justified.

## Module inventory

List every meaningful in-scope module before completion. A module may be:

- a package, app, service, route group, command group, worker, or library,
- a domain folder with a clear responsibility,
- a runtime entrypoint plus its owned helpers,
- a persistence/query, external-integration, queue, cache, or reporting subsystem,
- a testable subsystem with stable callers and contracts.

Record each module with:

- module name and path roots,
- primary responsibility,
- entrypoints and public interfaces,
- key callers and callees,
- expected workload shape and frequency,
- tests, benchmarks, and performance guardrails,
- logs, metrics, traces, or profiling surfaces,
- persistence, network, filesystem, or external API contracts,
- risk level and estimated ease,
- current coverage status.

Exclude generated, vendored, lock, build-output, snapshot, fixture-only, or explicitly out-of-scope areas only with evidence.

## Coverage ledger statuses

Use simple statuses so stopping conditions are auditable:

- `unvisited`: inventoried but not deeply read yet.
- `deep-read`: callers, callees, tests, logs, benchmarks, contracts, workload shape, core files, and all available performance job lenses were inspected with enough context to judge performance.
- `optimized`: at least one behavior-safe performance improvement landed for this module.
- `validated-clear`: deep read found no actionable in-scope performance issue worth changing now.
- `deferred`: an issue exists but is blocked, unsafe, speculative, approval-dependent, production-measurement-only, or requires macro-architecture/product scope.
- `excluded`: not human-maintained source or outside the user's requested scope.

Completion is not allowed while any in-scope module remains `unvisited`.

## Easy-first and evidence-first ordering

Start with the easiest useful modules when that reduces risk:

- small surface area,
- clear ownership,
- local tests, cheap benchmarks, or profiling hooks,
- limited side effects,
- low public API or persistence risk,
- likely to clarify workload shape, tests, benchmarks, caching seams, batching seams, or data structures used by harder modules.

Prefer measured high-impact bottlenecks when they exist, even if they are not the easiest module.

Do not confuse easy-first with low-value micro-optimization. The chosen module should either resolve real performance issues or create context/guardrails that make later hot paths safer.

## Deep-read requirements

A module iteration is not deep-read until the agent inspects:

- module entrypoints and public interfaces,
- internal core files and responsibility boundaries,
- key callers and downstream callees,
- workload size, frequency, and data-shape assumptions,
- tests, fixtures, mocks, benchmark commands, and validation commands,
- logs, metrics, tracing, profiler hooks, and error messages,
- configuration, persistence, query, cache, concurrency, and external-service contracts when relevant,
- known TODOs, comments, or docs that describe performance behavior.

It also must inspect the module through each available performance job lens:

- `measurement / benchmarking`: is there enough baseline evidence, or is measurement the next unlock?
- `algorithmic complexity / repeated work`: are there avoidable scans, sorts, conversions, or duplicated computations?
- `IO batching / queries`: are there N+1 calls, excessive round trips, poor query shapes, or serial external work?
- `caching / memoization`: would caching help, and are ownership plus invalidation safe?
- `allocation / hot loops`: are tight loops creating avoidable objects, strings, parsing, or serialization?
- `concurrency / pipelines`: is work too serial, too parallel, unbounded, or missing backpressure?
- `staged unlock work`: if the module is too coupled for direct optimization, what is the next smaller unlock step?

Do not mark a module `validated-clear` from a shallow file skim.
Do not mark a module `validated-clear` until every available performance job lens has been checked and classified as one of: actionable now, measure-first, unlock-first, deferred, excluded, or no meaningful issue found.

## Choosing the next module

After every iteration:

1. Re-scan the module ledger.
2. Prefer an `unvisited` module unless a just-touched module must be stabilized before moving on.
3. Choose the highest-evidence hot module, or the easiest useful `unvisited` module that can be deeply read and improved or validated now.
4. Scan that module through every available performance job lens before deciding what "this round" means.
5. If the next module is high-risk and under-guarded, choose benchmark or characterization guardrails first.
6. If the next module is too coupled for direct optimization, choose staged unlock work rather than skipping it.
7. Return to the full-codebase scan after validation and update the ledger.

Revisiting a familiar module is valid only when:

- it blocks safe deep reading of an unvisited module,
- a previous optimization created follow-up risk that must be stabilized,
- validation exposed a real defect, stale benchmark, or stale contract,
- cross-module optimization requires touching it together with the next module.

## Module cluster iterations

One iteration may cover a small cluster of modules when they share one hot path or invariant, such as:

- a command and its parser,
- a route and its service,
- a domain module and its query adapter,
- an integration wrapper and its retry or batching helper,
- a worker and its queue processor.

Keep clusters bounded. Do not use clustering to claim full-repository coverage without deep context.

## Stage-gate questions

At the end of each iteration, answer:

- Which module or module cluster was deeply read?
- Which performance job lenses were checked, and which jobs were selected and why?
- What bottleneck was fixed, or why is the module validated-clear?
- Which guardrails prove behavior was preserved?
- What baseline and after evidence exists?
- Which modules remain `unvisited`?
- Which module is the next highest-evidence or easiest useful target?

If any in-scope module remains `unvisited`, the correct action is to return to Step 1, not to finish.
