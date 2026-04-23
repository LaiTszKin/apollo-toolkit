# Module Coverage And Deep-Read Iterations

## Purpose

Prevent the agent from repeatedly improving only familiar or easy files while untouched modules remain unexamined.

Use this reference in Step 1 to build the module inventory and in Step 2 to choose which module or module cluster receives the next deep-read iteration.

## Module inventory

List every meaningful in-scope module before completion. A module may be:

- a package, app, service, route group, command group, worker, or library,
- a domain folder with a clear responsibility,
- a runtime entrypoint plus its owned helpers,
- a testable subsystem with stable callers and contracts.

Record each module with:

- module name and path roots,
- primary responsibility,
- entrypoints and public interfaces,
- key callers and callees,
- tests and guardrails,
- logging or telemetry surfaces,
- risk level and estimated ease,
- current coverage status.

Exclude generated, vendored, lock, build-output, snapshot, fixture-only, or explicitly out-of-scope areas only with evidence.

## Coverage ledger statuses

Use simple statuses so stopping conditions are auditable:

- `unvisited`: inventoried but not deeply read yet.
- `deep-read`: callers, callees, tests, logs, contracts, and core files were inspected with enough context to judge quality.
- `refactored`: at least one behavior-neutral improvement landed for this module.
- `validated-clear`: deep read found no actionable in-scope quality issue worth changing now.
- `deferred`: an issue exists but is blocked, unsafe, speculative, approval-dependent, or requires macro-architecture/product scope.
- `excluded`: not human-maintained source or outside the user's requested scope.

Completion is not allowed while any in-scope module remains `unvisited`.

## Easy-first module ordering

Start with the easiest useful modules when that reduces risk:

- small surface area,
- clear ownership,
- local tests or cheap guardrails,
- limited side effects,
- low public API or persistence risk,
- likely to clarify names, tests, boundaries, or seams used by harder modules.

Do not confuse easy-first with low-value churn. The chosen module should either resolve real quality issues or create context/guardrails that make later modules safer.

If multiple modules are equally easy, prefer the one that unlocks harder modules by improving shared naming, helpers, tests, logging, or dependency seams.

## Deep-read requirements

A module iteration is not deep-read until the agent inspects:

- module entrypoints and public interfaces,
- internal core files and responsibility boundaries,
- key callers and downstream callees,
- tests, fixtures, mocks, and validation commands,
- logs, metrics, tracing, and error messages,
- configuration, persistence, and external-service contracts when relevant,
- known TODOs, comments, or docs that describe current behavior.

Do not mark a module `validated-clear` from a shallow file skim.

## Choosing the next module

After every iteration:

1. Re-scan the module ledger.
2. Prefer an `unvisited` module unless a just-touched module must be stabilized before moving on.
3. Choose the easiest useful `unvisited` module that can be deeply read and improved or validated now.
4. If the next unvisited module is high-risk and under-guarded, choose guardrail-building jobs first.
5. If the next unvisited module is too coupled for direct cleanup, choose staged unlock work rather than skipping it.
6. Return to the full-codebase scan after validation and update the ledger.

Revisiting a familiar module is valid only when:

- it blocks safe deep reading of an unvisited module,
- a previous refactor created follow-up drift that must be stabilized,
- validation exposed a real defect or stale contract,
- cross-module cleanup requires touching it together with the next module.

## Module cluster iterations

One iteration may cover a small cluster of modules when they share one boundary or invariant, such as:

- a command and its parser,
- a route and its service,
- a domain module and its test helpers,
- an integration wrapper and its local fake.

Keep clusters bounded. Do not use clustering to claim full-repository coverage without deep context.

## Stage-gate questions

At the end of each iteration, answer:

- Which module or module cluster was deeply read?
- Which jobs were selected and why?
- What quality issue was fixed, or why is the module validated-clear?
- Which guardrails prove behavior was preserved?
- Which modules remain `unvisited`?
- Which module is the next easiest useful target?

If any in-scope module remains `unvisited`, the correct action is to return to Step 1, not to finish.
