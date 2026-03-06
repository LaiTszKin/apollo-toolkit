---
name: enhance-existing-features
description: Build and extend brownfield features in an existing codebase. Always explore the codebase first, then decide from the user's requested change whether specs (`spec.md`/`tasks.md`/`checklist.md`) are required before coding. Use explicit user approval before implementation when specs are generated. Even when specs are not required, still add and run related tests for unit/property-based/user-critical integration chain/E2E coverage. If users answer clarification questions during specs, update related checkboxes, review/adjust specs, and get approval again before coding.
---

# Enhance Existing Features

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
- Continue directly with the same downstream workflow below.

### 3) Verify latest authoritative docs

- Identify the tech stack, libraries, and external dependencies involved.
- Use official documentation as source of truth.
- Prefer Context7 for framework/library APIs; use web for latest official docs.
- If required docs are private or missing, request access or user-provided references.

### 4) Implement the feature

- Reuse existing patterns and abstractions; avoid over-engineering.
- Keep changes focused and minimal; preserve current behavior unless required.
- Follow project conventions (naming, linting, formatting, configuration).
- Update environment examples only when new inputs are required.

### 5) Testing coverage (required with or without specs)

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
- Always decide the need for specs only after exploring the existing codebase.
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
