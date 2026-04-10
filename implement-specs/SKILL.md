---
name: implement-specs
description: >-
  Read a specs planning set (spec.md, tasks.md, checklist.md, contract.md, design.md)
  from `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/`
  plus parent `coordination.md` when present, and implement the approved tasks
  directly in the current checkout. Use when the user asks to implement from an
  existing spec set, execute a spec plan, or complete approved planning work
  without creating a new branch or isolated git worktree. Commit the completed
  implementation to the current branch when done.
---

# Implement Specs

## Dependencies

- Required: `enhance-existing-features` and `develop-new-features` for implementation standards.
- Conditional: `generate-spec` if spec files need clarification or updates; `recover-missing-plan` if the requested plan path is missing from the current checkout.
- Optional: none.
- Fallback: If `enhance-existing-features` or `develop-new-features` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Read and understand the complete specs set before starting implementation, and when the requested plan path is missing verify where the authoritative copy actually lives before substituting any nearby spec.
- Execution: Work directly in the current checkout, do not create or switch branches, do not add git worktrees, follow the implementation standards from the dependent skills, and commit to the current branch when done.
- Quality: Complete all planned tasks, run relevant tests, backfill the spec documents with actual completion status, and avoid dragging unrelated sibling specs into scope just because they share a batch directory.
- Output: Leave the current branch with a focused implementation commit containing only the intended changes.

## Goal

Implement approved spec planning sets directly in the current checkout when the user wants the work to land on the active branch instead of an isolated implementation branch.

## Workflow

### 1) Identify and read the specs set

- Locate the specs directory. The path format is `docs/plans/{YYYY-MM-DD}/{change_name}/` for single-spec work, or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` for coordinated multi-spec work.
- If the user provides a specific path, use that directly.
- If only a `change_name` or date is given, search for matching directories under `docs/plans/`.
- If the requested path is absent from the current checkout, stop and identify the authoritative source before implementing:
  - inspect the repository history and relevant local branches for that exact `docs/plans/...` path
  - use `recover-missing-plan` when the plan must be restored or reconstructed before work can continue
  - prefer the exact matching plan directory from the authoritative branch or main working tree over archived, approximate, or sibling plan directories
  - if the plan lives under a batch directory, recover only the requested spec directory plus the shared `coordination.md` that governs it
  - do not copy neighboring sibling spec directories into scope unless the user explicitly expands scope
- When the plan sits under a batch directory, also read the sibling `coordination.md` before implementation.
- Read all five spec files:
  - `spec.md` — requirements and BDD behaviors
  - `tasks.md` — task breakdown
  - `checklist.md` — behavior-to-test alignment and completion tracking
  - `contract.md` — API/interface contracts
  - `design.md` — design decisions and architecture notes
- If `coordination.md` exists in the parent batch directory, read it as the shared source of truth for ownership boundaries, shared preparation, replacement direction, merge order, and cross-spec integration checkpoints.
- Understand the scope, requirements, and planned tasks before proceeding.

### 2) Check current branch state

- Run `git status -sb` and identify the current branch.
- Preserve unrelated user changes. If the checkout contains unrelated dirty files, avoid editing them and report any blockers before proceeding.
- Confirm that the current branch is the intended destination for the implementation. Do not create, rename, or switch branches unless the user explicitly changes scope.
- If the exact requested plan was recovered into the current checkout, re-read the recovered files before coding so implementation and backfill use the same plan snapshot.

### 3) Implement the planned tasks

- Explore the existing codebase relevant to the planned tasks.
- Verify latest authoritative docs for involved stacks/integrations.
- When `coordination.md` exists, respect its shared-field preparation, legacy-replacement direction, and allowed touch-point boundaries before editing.
- Implement each task in `tasks.md` systematically.
- When `coordination.md` defines file ownership guardrails, additive-only shared-contract rules, or compatibility-shim retention requirements, treat them as blocking execution constraints rather than optional guidance.
- For each implemented change, add appropriate tests:
  - Unit tests for changed logic
  - Regression tests for bug-prone behavior
  - Property-based tests for business logic changes
  - Integration tests for cross-module chains
  - E2E tests for key user-visible paths
  - Adversarial tests for abuse paths
- Run relevant tests and fix failures.
- Do not skip testing even for seemingly small changes.

### 4) Backfill completion status

After implementation and testing:

- Update `spec.md` with actual completion state for each requirement.
- Mark completed tasks in `tasks.md`.
- Update `checklist.md` with test execution results, N/A reasons, and any scope adjustments.
- If the shared implementation direction changed, update the parent `coordination.md` as well before finishing.
- Do not mark unused template examples or non-applicable items as complete.

### 5) Commit changes

- Stage the implementation files:
  ```bash
  git add <implementation-files> <test-files> <updated-specs>
  ```
- Write a concise Conventional Commit message describing the implemented scope.
- Commit to the current branch:
  ```bash
  git commit -m "<conventional-commit-message>"
  ```

### 6) Report completion

- Summarize what was implemented.
- Note the current branch and commit hash.
- Confirm which tests ran and which planned documents were backfilled.

## Working Rules

- Always work in the current checkout; never create a branch or git worktree inside this skill unless the user explicitly changes the request.
- Complete all planned tasks before committing; do not stop with partial work.
- Treat the specs as the source of truth for scope — do not deviate without user approval.
- When `coordination.md` exists, treat it as the source of truth for batch-level ownership and cutover direction.
- Never remove a shared shim, rename a shared field, or rewrite a shared file outside the ownership map unless `coordination.md` explicitly allows that change or the user approves a coordination update first.
- Follow the testing standards from `enhance-existing-features` and `develop-new-features`.
- Do not push to remote unless the user explicitly requests it.

## References

- `enhance-existing-features`: implementation standards for brownfield work
- `develop-new-features`: implementation standards for new feature work
- `recover-missing-plan`: recovery workflow for missing or mismatched spec sets
