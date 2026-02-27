---
name: enhance-existing-features
description: Build and extend brownfield features in an existing codebase. Use specs (`spec.md`/`tasks.md`/`checklist.md`) with explicit user approval before coding when scope is high complexity, critical module, or cross-module changes. Even when specs are not required, still add and run related tests for unit/property-based/user-critical integration chain/E2E coverage. If users answer clarification questions during specs, update related checkboxes, review/adjust specs, and get approval again before coding.
---

# Enhance Existing Features

## Overview

Safely extend brownfield systems by mapping dependencies first, verifying authoritative docs, classifying change risk, using specs for high-risk scope, implementing minimal changes, and always completing test coverage for the changed behavior.

## Workflow

### 1) Explore codebase and map dependencies

- Locate entrypoints, configuration, and primary data flow.
- Trace module relationships (imports, call graph, shared models, side effects).
- Identify integration points (DB, RPC, external APIs, queues, filesystems).
- Identify user-critical logic chains affected by the change.
- Summarize findings before editing.

### 2) Verify latest authoritative docs

- Identify the tech stack, libraries, and external dependencies involved.
- Use official documentation as source of truth.
- Prefer Context7 for framework/library APIs; use web for latest official docs.
- If required docs are private or missing, request access or user-provided references.

### 3) Decide whether specs are required

Trigger specs when **any** of the following is true:
- high complexity changes
- critical module changes
- cross-module changes

If triggered:
- Resolve paths from this skill directory, not the target project directory.
- Use:
  - `SKILL_ROOT=<path_to_enhance-existing-features_skill>`
  - `WORKSPACE_ROOT=<target_project_root>`
  - `python3 "$SKILL_ROOT/scripts/create-specs" "<feature_name>" --change-name <kebab-case> --template-dir "$SKILL_ROOT/references/templates" --output-dir "$WORKSPACE_ROOT/docs/plans"`
- Templates must come from:
  - `references/templates/spec.md`
  - `references/templates/tasks.md`
  - `references/templates/checklist.md`
- Store specs at `docs/plans/{YYYY-MM-DD}_{change_name}/`.
- Fill `spec.md`/`tasks.md`/`checklist.md` completely.
- If users answer clarification questions, first check related clarification checkboxes in `checklist.md`, then review whether `spec.md`/`tasks.md`/`checklist.md` must be adjusted.
- After any clarification-driven adjustment, obtain explicit approval on the updated specs again.
- Obtain explicit user approval on specs before implementation.
- Do not modify implementation code before approval.

If not triggered:
- You may implement directly after dependency/doc checks.
- You must still complete the same testing coverage requirements in step 5.

### 4) Implement the feature

- Reuse existing patterns and abstractions; avoid over-engineering.
- Keep changes focused and minimal; preserve current behavior unless required.
- Follow project conventions (naming, linting, formatting, configuration).
- Update environment examples only when new inputs are required.

### 5) Testing coverage (required even without specs)

For every non-trivial change, evaluate all categories and add test cases or record justified `N/A`:
- Unit tests: changed logic, boundaries, and failure paths.
- Property-based tests: invariants and broad input combinations.
- Integration tests: **user-critical logic chain** across modules/layers.
- E2E tests: key user-visible path impacted by this change.

Rules:
- If E2E is too costly/unstable, add stronger integration coverage for the same risk and record reason.
- If property-based is not suitable, record `N/A` with concrete reason.
- Run relevant tests when possible and fix failures.

### 6) Completion updates

- If specs were used, update `tasks.md` and `checklist.md` checkboxes and results based on actual completion/test outcomes.
- If specs were not used, provide a concise execution summary including test IDs/results and any `N/A` reasons.

## Working Rules

- Keep the solution minimal and executable.
- Maintain traceability between requirements, tasks, and tests.
- Treat checklists as living artifacts: adjust items to match real change scope.
- Path rule: `scripts/...` and `references/...` in this file always mean paths under the current skill folder, not the target project root.

## References

- `scripts/create-specs`: specs generator script.
- `references/templates/spec.md`: overall requirements template (BDD).
- `references/templates/tasks.md`: task breakdown template.
- `references/templates/checklist.md`: behavior-to-test checklist template.
- `references/unit-tests.md`: unit testing guidance.
- `references/property-based-tests.md`: property-based testing guidance.
- `references/integration-tests.md`: integration testing guidance.
- `references/e2e-tests.md`: E2E decision and design guidance.
