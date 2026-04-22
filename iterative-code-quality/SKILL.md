---
name: iterative-code-quality
description: >-
  Improve an existing codebase through repeated evidence-based code-quality
  passes: clarify poor variable names, simplify or extract reusable functions,
  split oversized code into single-responsibility modules, repair stale or
  missing logs, and add high-value tests while preserving business behavior and
  macro architecture. Use when users ask for comprehensive refactoring, code
  cleanup, maintainability hardening, naming cleanup, log alignment, or test
  coverage improvement across a repository.
---

# Iterative Code Quality

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` after implementation changes are complete.
- Conditional: `systematic-debug` when a new or existing test reveals a real business-logic defect that must be fixed.
- Optional: `discover-edge-cases` for high-risk boundary exploration before choosing missing tests; `improve-observability` for complex telemetry design.
- Fallback: If required completion dependencies are unavailable, finish code and tests, then report exactly which documentation or constraint sync step could not run.

## Standards

- Evidence: Read repository docs, project constraints, source, tests, logs, and entrypoints before editing; every rename, extraction, split, log update, or test must be backed by code context.
- Execution: Work in bounded passes, prioritize behavior-neutral improvements with the highest maintainability and test value, validate after each pass, and keep iterating while any known in-scope codebase quality issue remains unresolved; when tests or other reliable guardrails can prove equivalence, prefer taking the refactor instead of deferring it for subjective confidence reasons; do not produce the completion report while the scan still contains actionable gaps.
- Quality: Preserve business behavior and macro architecture unless tests expose an existing logic defect; avoid style-only churn, compatibility theater, broad rewrites, and unverified "cleanup", but do not reject a worthwhile refactor purely because it feels risky when existing or newly added guardrails can verify it safely.
- Output: Deliver a concise pass-by-pass summary, changed behavior-neutral surfaces, test coverage added, validation results, and documentation/`AGENTS.md` sync status only after every known in-scope quality issue is resolved or explicitly classified as blocked, unsafe, low-value, speculative, or requiring user approval.

## Goal

Raise code quality across an existing repository without changing intended product behavior or the system's macro architecture.

This skill is intentionally implementation-oriented, not report-only. It should identify high-value improvements, apply them, test them, and keep iterating across the codebase until there are no unresolved known in-scope quality issues. If a post-pass scan finds remaining actionable gaps, continue the next pass instead of writing a completion report.

## Required Reference Loading

Load references only when they match the active pass:

- `references/repository-scan.md`: scope mapping, generated-file exclusions, and quality backlog selection.
- `references/naming-and-simplification.md`: variable renames, function simplification, reusable extraction, and behavior-preservation checks.
- `references/module-boundaries.md`: single-responsibility split heuristics and safe module extraction rules.
- `references/logging-alignment.md`: stale log detection, missing log criteria, and behavior-neutral observability updates.
- `references/testing-strategy.md`: risk-based unit, property, integration, and E2E coverage selection.
- `references/iteration-gates.md`: multi-pass quality gates, stopping criteria, and validation cadence.

## Workflow

### 1) Establish the repository baseline

- Read root guidance first: `AGENTS.md`, `README*`, major docs, package manifests, task runners, CI configs, and test setup.
- Map runtime entrypoints, domain modules, external integrations, logging/telemetry utilities, and existing test suites.
- Identify generated, vendored, lock, build-output, fixture, or snapshot files; exclude them from refactoring unless evidence shows they are human-maintained source.
- Run or inspect the most relevant existing validation commands before editing when feasible, so pre-existing failures are distinguishable from new regressions.
- Build an initial quality backlog with concrete file/function/test targets before changing code.
- Use `references/repository-scan.md` for the scan checklist and backlog scoring.

### 2) Execute bounded improvement passes

Run focused passes in the order that fits the repository evidence. A typical order is:

1. Naming clarity for variables, parameters, fields, local helpers, and test data.
2. Function simplification and reusable extraction for duplicated or hard-coded workflows.
3. Single-responsibility module splits for oversized or mixed-concern code.
4. Logging alignment for stale, misleading, missing, or low-context diagnostics.
5. Risk-based test coverage for high-value business logic and boundary cases.

For each pass:

- Read all directly affected callers, tests, and public interfaces before editing.
- Keep the pass small enough to validate and review; split broad cleanups into multiple passes.
- Prefer repository-native abstractions over new parallel frameworks.
- Preserve public behavior, data contracts, side effects, error classes, and macro architecture.
- Add or update tests in the same pass when the change touches non-trivial logic, observability contracts, or extracted helpers.
- If strong guardrails exist or can be added cheaply, prefer the clearer or more maintainable refactor instead of leaving a known issue in place due to subjective caution alone.
- Validate the touched scope before starting another pass.

### 3) Rename for clarity without churn

- Rename only when the current name hides domain meaning, confuses ownership, conflicts with real units, or makes tests/logs misleading.
- Prefer names that encode domain role, unit, lifecycle stage, or canonical owner.
- Update all references, tests, fixtures, structured log fields, docs, and comments that describe the renamed concept.
- Avoid renaming stable public API fields or persisted schema names unless the user explicitly requested a breaking migration.
- Use `references/naming-and-simplification.md` before broad rename passes.

### 4) Simplify and extract reusable functions

- Simplify functions when branches, temporary state, repeated transformations, or hard-coded workflows obscure the invariant.
- Extract helpers only when they reduce duplication, centralize one business rule, clarify caller intent, or make a behavior testable.
- Keep helper placement aligned with current module ownership.
- Do not create abstractions for one-off code unless they isolate a meaningful domain rule or external contract.
- If tests or equivalent guardrails can prove behavior preservation, do not let moderate implementation uncertainty block an otherwise valuable simplification or extraction.
- Preserve observable behavior unless a test proves the current behavior is a defect.

### 5) Split modules by responsibility

- Split code only when one file/module owns multiple change reasons, domain boundaries, external integrations, or lifecycle stages.
- Define the new module's responsibility before moving code.
- Keep interfaces narrow, explicit, and consistent with existing project style.
- Avoid macro-architecture changes such as new layers, new service boundaries, new persistence strategies, or framework swaps unless the user explicitly expands scope.
- When module boundaries are currently poor but can be protected by focused tests or other guardrails, choose the cleaner split instead of preserving a mixed-responsibility file out of caution alone.
- Use `references/module-boundaries.md` for extraction rules and anti-patterns.

### 6) Repair logging and observability drift

- Compare log messages, event names, structured fields, metrics, and trace names against the current code ownership model.
- Fix stale terminology after renames or refactors so logs describe the live workflow.
- Add logs only at high-value decision points: branch selection, skipped work, external dependency outcome, persistence side effect, retry/rollback, and final outcome.
- Use structured fields already accepted by the project; never log secrets, tokens, full sensitive payloads, or personal data.
- Add tests or assertions for important log fields when the project has log-capture helpers.
- Use `references/logging-alignment.md` for detailed criteria.

### 7) Add high-value tests

- Start from risk, not coverage percentage.
- Prioritize tests for business rules, state transitions, error handling, extracted helpers, edge cases, observability contracts, and integration boundaries.
- Use unit tests for local logic, property-based tests for invariants and generated input spaces, integration tests for cross-module chains, and E2E tests only when external services are stable or can be controlled reliably.
- Mock or fake external services unless the real service contract is the subject under test.
- If a new test exposes an existing business-logic bug, invoke `systematic-debug`, fix the true owner, and keep the regression test.
- Use `references/testing-strategy.md` for coverage selection and required `N/A` reasoning.

### 8) Iterate until quality gates pass

- After each pass, run the narrowest relevant tests first, then broaden validation when confidence increases.
- Re-scan both touched areas and the known quality backlog for new naming drift, duplicated helper candidates, module-boundary cracks, logging drift, and missing tests.
- Repeat the full pass cycle whenever any known in-scope actionable gap remains and can be fixed safely without changing business behavior or macro architecture.
- Do not write the completion report, summarize the task as done, or hand back as complete while the latest scan still contains known actionable quality issues.
- Stop only when every known in-scope issue has been resolved, or each remaining candidate is explicitly classified as low-value, speculative, blocked, unsafe, or requiring product/architecture approval.
- Use `references/iteration-gates.md` for stopping criteria.

### 9) Synchronize docs and constraints

After code and tests are complete:

- Invoke `align-project-documents` when README, docs, architecture notes, debugging docs, setup instructions, or test guidance may have drifted.
- Invoke `maintain-project-constraints` to verify `AGENTS.md` still reflects architecture, business flow, common commands, macro purpose, and coding conventions.
- Update only documentation that is affected by real code, command, logging, or test changes.

## Hard Guardrails

- Do not change intended business logic while refactoring.
- Do not change macro architecture, framework choice, storage model, deployment model, or service boundaries unless the user explicitly approves that expanded scope.
- Do not use one-off scripts to rewrite product code.
- Do not perform style-only churn that does not improve naming, reuse, modularity, observability, or test confidence.
- Do not weaken tests to make refactors pass; update tests to stable invariants or fix the implementation defect.
- Do not add E2E tests that depend on unreliable external services when a controlled integration test can prove the same business risk.

## Completion Report

Only write this report after the latest scan confirms there are no known actionable in-scope quality issues remaining. If any such issue remains, continue iterating instead of reporting completion.

Return:

1. Passes completed and why they were ordered that way.
2. Key files changed and the quality issue each change resolved.
3. Business behavior preservation evidence.
4. Tests added or updated, including property/integration/E2E `N/A` reasons where relevant.
5. Validation commands and results.
6. Documentation and `AGENTS.md` synchronization status.
7. Remaining quality gaps, blockers, or deferred architecture/product decisions.
