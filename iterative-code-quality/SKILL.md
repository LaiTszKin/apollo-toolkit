---
name: iterative-code-quality
description: >-
  Improve an existing codebase through repeated evidence-based repository-wide
  scans, module-by-module deep-read coverage, and behavior-safe refactors until
  no known in-scope actionable quality issue or unvisited in-scope module
  remains: clarify poor names, simplify or extract reusable functions, split
  mixed-responsibility code, repair stale or missing logs, and add high-value
  tests where guardrails are missing, while preserving intended business
  behavior and the system's macro architecture. Use when users ask for
  comprehensive refactoring, code cleanup, maintainability hardening, naming
  cleanup, log alignment, or test coverage improvement across a repository.
---

# Iterative Code Quality

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` after the repository is truly iteration-complete.
- Conditional: `systematic-debug` when a newly added or existing test exposes a real business-logic defect that must be fixed at the true owner.
- Optional: `discover-edge-cases` for high-risk boundary exploration before adding tests; `improve-observability` for non-trivial telemetry design.
- Fallback: If required completion dependencies are unavailable, finish code and validation first, then report exactly which documentation or constraint-sync action could not run.

## Standards

- Evidence: Read repository docs, project constraints, source, tests, logs, build scripts, entrypoints, and nearby abstractions before editing; every refactor and every new test must be justified by code context.
- Execution: Run a continuous three-step loop of full-codebase scan → choose this round's jobs and refactor → if and only if the latest full-codebase scan is clear, update docs and constraints; otherwise return to scanning immediately. Maintain a module inventory and coverage ledger so every in-scope module receives a job-oriented deep-read iteration before completion. Do not treat jobs as workflow steps. Do not produce a completion report while any known in-scope actionable issue or unvisited in-scope module remains, unless the remaining surface is explicitly classified with evidence as blocked, unsafe, user-owned active work, speculative, low-value, or approval-dependent.
- Quality: Resolve as many inherited quality problems as safely possible without changing intended behavior or the system's macro architecture. Do not require pre-existing tests before every safe refactor; if an area is high-risk and weakly guarded, add the missing guardrails as part of the work instead of treating the area as untouchable.
- Output: Return iteration-by-iteration decisions, selected jobs, module coverage status, changed files, behavior-preservation evidence, tests and guardrails added, validation results, and docs/constraint sync status only after the latest scan shows no remaining known actionable in-scope issue and no unvisited in-scope module.

## Mission

Leave the repository materially cleaner by continuously scanning the whole codebase, landing the highest-value safe refactors available at each moment, and repeating until there is no known in-scope actionable quality gap left to fix.

For this skill, `macro architecture` means the system's top-level runtime shape and overall operating logic: major subsystems, top-level execution model, deployment/runtime boundaries, persistence model, service boundaries, and the end-to-end way the whole system works. Ordinary module interactions, helper extraction, local responsibility moves, internal call-boundary cleanup, and local module splits do not count as macro-architecture changes by themselves.

## Three-Step Loop

### 1) Scan the repository

- Read root guidance first: `AGENTS.md`, `README*`, package manifests, task runners, CI/test config, and major project docs.
- Map runtime entrypoints, domain modules, external integrations, logging utilities, and current test surfaces.
- Exclude generated, vendored, lock, build-output, fixture, or snapshot files unless evidence shows they are human-maintained source.
- Build or refresh a concrete repository-wide backlog of known actionable quality issues.
- Build or refresh a module inventory and coverage ledger; every in-scope module starts as unvisited until it has received a job-oriented deep-read iteration with callers, callees, tests, logs, relevant contracts, and each available job lens inspected.
- Re-scan the full codebase after every landed iteration, not only the files just changed.
- Load `references/repository-scan.md` for the scan checklist and backlog shaping rules.
- Load `references/module-coverage.md` for module inventory, job-oriented deep-read coverage, easy-first ordering, and completion rules.

### 2) Choose this round's jobs and refactor

- Choose jobs only after the latest full-codebase scan. Jobs are optional execution directions, not ordered workflow steps.
- Treat module scanning and job choice as one linked activity: inspect the selected module through every available job lens before deciding which jobs actually land in this round.
- Select the smallest set of jobs that can safely improve the currently selected module or module cluster under current guardrails.
- If the user has clearly indicated that a touched area is their active in-progress change, treat that area as blocked for this skill, record the evidence, and continue with other in-scope modules instead of modifying or debugging it.
- Before choosing or deferring a refactor, explicitly assess refactor confidence as a combination of the agent's own ability to understand and complete the task, the objective safety net from tests and other guardrails, the clarity of rollback or repair paths, and the task's inherent difficulty. Do not treat difficulty alone as low confidence; when strong tests guard the behavior, use them to support bolder changes because failures can be driven back to green.
- Prefer easy-first module ordering: start from low-risk, high-confidence modules when doing so builds context, tests, naming clarity, or seams that make harder modules safer later.
- Do not keep revisiting familiar modules while other in-scope modules remain unvisited unless the familiar module blocks the next unvisited module's safe deep read.
- Prefer smaller, high-confidence refactors that reduce risk and prepare the ground for deeper later cleanup.
- If a desired refactor is high-risk and weakly guarded, make guardrail-building part of this round instead of stopping.
- If a file feels too coupled, too central, or too risky for a direct rewrite, do staged unlock work rather than declaring the area blocked.
- Read all directly affected callers, tests, interfaces, and logs before editing.
- Validate from narrow to broad after each bounded round, then perform a full-codebase stage-gate decision:
  - if any known in-scope actionable issue still remains or any in-scope module has not received a deep-read iteration, return to Step 1;
  - only continue to Step 3 when the latest scan is clear.

Load references for this step only as needed:

- `references/module-coverage.md` for choosing the next module and proving every in-scope module has been deeply read through the available-job lenses.
- `references/job-selection.md` for next-job choice conditions and tie-breakers.
- `references/naming-and-simplification.md` for naming cleanup and function simplification/extraction.
- `references/module-boundaries.md` for single-responsibility module cleanup.
- `references/logging-alignment.md` for stale or missing log repair.
- `references/testing-strategy.md` for unit, property, integration, and E2E test strategy.
- `references/coupled-core-file-strategy.md` for staged unlock work on large coupled or apparently core files.
- `references/iteration-gates.md` for validation cadence, stage-gate rules, and stop criteria.

### 3) Update project documents and constraints

Only enter this step when the latest full-codebase scan confirms there is no remaining known actionable in-scope quality issue and every in-scope module has received a deep-read iteration, except items explicitly classified as blocked, unsafe, speculative, low-value, excluded, or approval-dependent.

- Run `align-project-documents` when README, architecture notes, setup docs, debugging docs, or test guidance may have drifted.
- Run `maintain-project-constraints` to verify `AGENTS.md` still matches the repository's real architecture, business flow, commands, and conventions.
- Update only the documentation and constraints that changed in reality because of the refactor.

## Hard Guardrails

- Do not change intended business logic while refactoring, except to fix a real defect exposed by tests and verified at the true owner.
- Do not change the system's macro architecture unless the user explicitly expands scope.
- Do not use one-off scripts to rewrite product code.
- Do not stop early just because a file is large, central, or historically fragile; if a safe unlock step exists, that is the next job.
- Do not stop before every in-scope module has been inventoried, deeply read, and either improved, validated as clear, or explicitly deferred/excluded with evidence.
- Do not touch user-owned active edits; classify them as blocked with evidence and continue elsewhere.
- Do not weaken tests to make a refactor pass; fix the real defect or update stale expectations to stable invariants.
- Do not add style-only churn that does not improve naming, modularity, observability, reuse, or guardrail strength.
- Do not add unreliable E2E coverage when a controlled integration or characterization test can prove the same risk more safely.

## Completion Report

Only report completion after Step 3 is done, the latest Step 1 scan is clear, and the module coverage ledger has no unvisited in-scope module.

Return:

1. Iterations completed and the jobs selected in each iteration.
2. Stage-gate verdict after each full-codebase re-scan.
3. Module coverage ledger summary: modules deep-read, improved, validated-clear, deferred, or excluded.
4. Key files changed and the quality issue each change resolved.
5. Business behavior preservation evidence.
6. Tests or other guardrails added or updated, including property/integration/E2E `N/A` reasons where relevant.
7. Validation commands and results.
8. Documentation and `AGENTS.md` synchronization status.
9. Remaining blocked or approval-dependent items, if any.
