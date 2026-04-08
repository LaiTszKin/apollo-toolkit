---
name: implement-specs-with-worktree
description: >-
  Read a specs planning set (spec.md, tasks.md, checklist.md, contract.md, design.md)
  from `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/`
  plus parent `coordination.md` when present, and implement the approved tasks
  within an isolated git worktree. Use when the user asks to implement from an
  existing spec set, execute a spec plan, or work on a feature branch without
  affecting the main working tree. If not already in a worktree, create a new
  worktree with an independent branch, implement all planned tasks, then commit
  the changes to that local branch when complete.
---

# Implement Specs with Worktree

## Dependencies

- Required: `enhance-existing-features` and `develop-new-features` for implementation standards.
- Conditional: `generate-spec` if spec files need clarification or updates.
- Optional: none.
- Fallback: If `enhance-existing-features` or `develop-new-features` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Read and understand the complete specs set before starting implementation.
- Execution: Create or use an isolated worktree for implementation, follow the implementation standards from the dependent skills, and commit to a local branch when done.
- Quality: Complete all planned tasks, run relevant tests, and backfill the spec documents with actual completion status.
- Output: Keep the worktree branch clean with only the intended implementation commits.

## Goal

Implement approved spec planning sets in an isolated git worktree, ensuring main development is never interrupted by in-progress work.

## Workflow

### 1) Identify and read the specs set

- Locate the specs directory. The path format is `docs/plans/{YYYY-MM-DD}/{change_name}/` for single-spec work, or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` for coordinated multi-spec work.
- If the user provides a specific path, use that directly.
- If only a `change_name` or date is given, search for matching directories under `docs/plans/`.
- When the plan sits under a batch directory, also read the sibling `coordination.md` before implementation.
- Read all five spec files:
  - `spec.md` — requirements and BDD behaviors
  - `tasks.md` — task breakdown
  - `checklist.md` — behavior-to-test alignment and completion tracking
  - `contract.md` — API/interface contracts
  - `design.md` — design decisions and architecture notes
- If `coordination.md` exists in the parent batch directory, read it as the shared source of truth for ownership boundaries, shared preparation, replacement direction, merge order, and cross-spec integration checkpoints.
- Understand the scope, requirements, and planned tasks before proceeding.

### 2) Check current worktree state

- Run `git worktree list` to see existing worktrees and branches.
- Determine if the current session is already inside a worktree (check `git rev-parse --show-toplevel` and compare with `git worktree list`).

### 3) Create a new worktree if needed

If not already in a worktree, or if the user explicitly requests a fresh worktree:

- Create a new branch for this implementation:
  ```bash
  git branch <branch-name> main
  ```
- Add a new worktree:
  ```bash
  git worktree add ../<worktree-name> -b <branch-name>
  ```
- Move into the new worktree directory and begin work there.

Use branch naming from `references/branch-naming.md`.

### 4) Implement the planned tasks

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

### 5) Backfill completion status

After implementation and testing:

- Update `spec.md` with actual completion state for each requirement.
- Mark completed tasks in `tasks.md`.
- Update `checklist.md` with test execution results, N/A reasons, and any scope adjustments.
- If the shared implementation direction changed, update the parent `coordination.md` as well before finishing.
- Do not mark unused template examples or non-applicable items as complete.

### 6) Commit changes

- Stage the implementation files:
  ```bash
  git add <implementation-files> <test-files> <updated-specs>
  ```
- Write a concise Conventional Commit message describing the implemented scope.
- Commit to the worktree's local branch:
  ```bash
  git commit -m "<conventional-commit-message>"
  ```

### 7) Report completion

- Summarize what was implemented.
- Note the branch name and worktree location.
- Confirm that main remains unaffected.

## Working Rules

- Always work in an isolated worktree to keep main clean.
- Complete all planned tasks before committing; do not stop with partial work.
- Treat the specs as the source of truth for scope — do not deviate without user approval.
- When `coordination.md` exists, treat it as the source of truth for batch-level ownership and cutover direction.
- Never remove a shared shim, rename a shared field, or rewrite a shared file outside the ownership map unless `coordination.md` explicitly allows that change or the user approves a coordination update first.
- Follow the testing standards from `enhance-existing-features` and `develop-new-features`.
- Do not push to remote unless the user explicitly requests it.

## References

- `references/branch-naming.md`: branch naming conventions
- `enhance-existing-features`: implementation standards for brownfield work
- `develop-new-features`: implementation standards for new feature work
