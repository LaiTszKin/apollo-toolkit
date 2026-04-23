# Repository Scan And Backlog Selection

## Purpose

Build a factual map before changing code, then choose the highest-value quality improvements while tracking module-by-module deep-read coverage.

## Required scan

- Read `AGENTS.md`, `README*`, project docs, manifests, task runners, CI configs, and test setup.
- List entrypoints: CLI commands, servers, workers, jobs, frontend routes, scripts, libraries, or public packages.
- Identify core domain modules, external integrations, persistence boundaries, logging utilities, and test helpers.
- Create a module inventory and coverage ledger using `references/module-coverage.md`.
- Inspect current git state before editing so unrelated user changes are not overwritten.
- Identify generated, vendored, lock, snapshot, build-output, and fixture files; exclude them from refactoring unless they are human-maintained source.

## Code quality backlog signals

Prioritize files or functions with:

- high fan-in or many call sites,
- critical business rules or money/security/data-integrity decisions,
- duplicated condition trees, conversions, validation, or external-call choreography,
- unclear naming around ownership, units, state, or lifecycle,
- large functions that mix parsing, validation, orchestration, side effects, and formatting,
- log messages that describe old concepts or omit branch/failure context,
- low or missing tests around meaningful invariants and edge cases.

## Evidence to capture

For each candidate record:

- file path and symbol name,
- owning module or module cluster,
- observed quality problem,
- why it matters to maintainability or correctness confidence,
- expected behavior-neutral change,
- tests or validations needed to prove safety,
- reason to defer if the candidate requires product or architecture approval.

## Exclusion rules

Do not refactor:

- third-party, generated, or compiled artifacts,
- snapshots where churn would hide signal,
- code the user marked as actively edited elsewhere,
- public schema/API names that require migration planning,
- areas that cannot be validated and are not causing a clear quality risk.

## Backlog scoring

Prefer a small set of high-confidence improvements over an exhaustive sweep.

Score each candidate by:

1. **Impact**: criticality, call frequency, future change risk.
2. **Confidence**: evidence that the change is behavior-neutral.
3. **Validation**: ability to test or otherwise prove equivalence.
4. **Blast radius**: number of modules, public contracts, and migrations affected.

Start with high-impact, high-confidence, low-blast-radius items. Escalate broad changes only when smaller passes cannot resolve the root problem.

Do not finish from backlog scoring alone. Completion also requires the module coverage ledger to show that every in-scope module has been deeply read and either improved, validated-clear, deferred, or excluded with evidence.
