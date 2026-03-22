---
name: enhance-existing-features
description: >-
  Build and extend brownfield features in an existing codebase. Always explore
  the codebase first, then decide from the user's requested change whether
  specs (`spec.md`/`tasks.md`/`checklist.md`) are required before coding. When
  specs are required, depend on `generate-spec` for the shared planning,
  clarification, approval, and backfill workflow. If a spec set exists and is
  approved, complete all planned tasks and applicable checklist items before
  yielding unless the user changes scope or an external blocker prevents safe
  completion. Even when specs are not
  required, still add and run related tests for
  unit/property-based/user-critical integration chain/E2E coverage. Tests must
  not stop at happy-path validation: for business-logic changes require
  property-based testing unless explicitly `N/A` with reason, design
  adversarial/regression/authorization/idempotency/concurrency coverage where
  relevant, use mocks for external services in logic chains, and verify
  meaningful business outcomes rather than smoke-only success.
---

# Enhance Existing Features

## Dependencies

- Required: `generate-spec` for shared planning docs when spec-trigger conditions are met.
- Conditional: none.
- Optional: none.
- Fallback: If specs are required and `generate-spec` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Explore the existing codebase first and verify the latest authoritative docs for the involved stack or integrations.
- Execution: Decide whether specs are required from the actual change surface, run `generate-spec` when needed, then continue through implementation, testing, and backfill until the active scope is fully reconciled.
- Quality: Add risk-based tests with property-based, regression, integration, E2E, adversarial, and rollback coverage when relevant.
- Output: Keep implementation and any planning artifacts traceable, updated, and aligned with actual completion results.

## Overview

Safely extend brownfield systems by exploring the existing codebase first, using the user's requested change plus discovered impact to decide whether specs are needed, then following a consistent implementation and testing workflow with minimal, well-validated changes.

## Workflow

### 1) Explore codebase first

- Read the relevant existing code before deciding process or editing anything.
- Locate entrypoints, configuration, and primary data flow.
- Trace module relationships (imports, call graph, shared models, side effects).
- Identify integration points (DB, RPC, external APIs, queues, filesystems).
- Identify user-critical logic chains affected by the change.
- Summarize findings and the likely change surface before editing.

### 2) Decide whether specs are required from the requested change

Use the user's requested change together with the codebase exploration results to decide whether to generate specs.

Trigger specs when any of the following is true:
- high complexity changes
- critical module changes
- cross-module changes

If triggered:
- Run `$generate-spec` and follow its workflow completely.
- Use it to create or update `docs/plans/{YYYY-MM-DD}_{change_name}/spec.md`, `tasks.md`, and `checklist.md`.
- Ensure planned behaviors and edge cases cover external dependency states, abuse/adversarial paths, and any relevant authorization/idempotency/concurrency/data-integrity risks.
- After implementation and testing, update the same plan set so `spec.md` reflects requirement completion status in addition to task and checklist progress.
- If users answer clarification questions, update the planning docs and obtain explicit approval again before implementation.
- Do not modify implementation code before approval.
- Once approval is granted, do not stop with unchecked in-scope items remaining in `tasks.md` or applicable unchecked items in `checklist.md` unless the user explicitly defers them or an external blocker prevents safe completion.

If not triggered:
- Continue directly with the same downstream workflow below.

### 3) Verify latest authoritative docs

- Identify the tech stack, libraries, and external dependencies involved.
- Use official documentation as the source of truth.
- Prefer Context7 for framework/library APIs; use web for latest official docs.
- If required docs are private or missing, request access or user-provided references.

### 4) Implement the feature

- Reuse existing patterns and abstractions; avoid over-engineering.
- Keep changes focused and minimal; preserve current behavior unless required.
- Follow project conventions (naming, linting, formatting, configuration).
- Update environment examples only when new inputs are required.
- If specs exist, treat every unchecked in-scope task and applicable checklist item as part of the required deliverable for this run.
- Do not stop after partial code changes, partial tests, or partial backfill when approved planned work remains.
- Only pause before completion if:
  - the user changes scope or explicitly asks to stop
  - new clarification requires plan updates and renewed approval
  - an external blocker (missing credentials, unavailable dependency, access restriction, broken upstream system) prevents safe completion
- When blocked, record the exact unfinished items and blocker in the spec set before yielding.

### 5) Testing coverage (required with or without specs)

For every non-trivial change, evaluate all categories and add test cases or record justified `N/A`:
- Start from a risk inventory, not from the happy path: assess misuse/abuse, authorization, invalid transitions, idempotency, replay/duplication, concurrency/races, data-integrity, and partial-failure/rollback risks.
- Unit tests: changed logic, boundaries, failure paths, and exact error/side-effect expectations.
- Regression tests: bug-prone or high-risk behavior that should never silently regress again.
- Property-based tests: required for business-logic changes unless truly unsuitable; use them for invariants, generated business input spaces, state-machine/metamorphic checks when useful, and output expectation checks.
- Integration tests: user-critical logic chain across modules/layers.
- E2E tests: key user-visible path impacted by this change; prefer one minimal critical success path plus one highest-value denial/failure path when the risk warrants it.
- Adversarial/penetration-style cases: abuse paths, malformed inputs, forged identities/privileges, invalid transitions, replay/duplication, stale/out-of-order events, toxic payload sizes, and risky edge combinations.

Rules:
- If E2E is too costly or unstable, add stronger integration coverage for the same risk and record the reason.
- If property-based testing is not suitable, record `N/A` with a concrete reason.
- For logic chains with external services, mock or fake those services unless the real contract itself is under test; simulate diverse external states and verify the business chain remains correct.
- Where the feature can partially commit work, test rollback, compensation, or no-partial-write behavior explicitly.
- Each test must assert a meaningful oracle: exact business output, persisted state, emitted side effects, or intentional lack of side effects. Avoid assertion-light smoke tests and snapshot-only coverage.
- Run relevant tests when possible and fix failures.

### 6) Completion updates

- If specs were used, backfill `spec.md`, `tasks.md`, and `checklist.md` through `$generate-spec` workflow based on actual completion and test outcomes.
- In `spec.md`, mark each relevant requirement with its actual completion state, such as completed, partially completed, deferred, or not implemented, plus brief evidence or rationale where needed.
- If specs were used, mark every completed task in `tasks.md`, resolve every applicable checklist item, and explicitly label any remaining item as deferred or blocked with the reason.
- If specs were not used, provide a concise execution summary including test IDs/results, regression coverage, mock scenario coverage, adversarial coverage, and any `N/A` reasons.

## Working Rules

- Keep the solution minimal and executable.
- Always decide the need for specs only after exploring the existing codebase.
- Maintain traceability between requirements, tasks, and tests when specs are present.
- Treat checklists as living artifacts: adjust items to match real change scope.
- Every planned test should justify a distinct risk; remove shallow duplicates that only prove the code "still runs".
- If a spec set exists and approval has been granted, do not yield with unfinished in-scope tasks or checklist items unless the user approves a deferment or an external blocker makes completion impossible.

## References

- `$generate-spec`: shared planning and approval workflow.
- `references/unit-tests.md`: unit testing guidance.
- `references/property-based-tests.md`: property-based testing guidance.
- `references/integration-tests.md`: integration testing guidance.
- `references/e2e-tests.md`: E2E decision and design guidance.
