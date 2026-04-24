---
name: implement-specs-with-worktree
description: >-
  Read a specs planning set (spec.md, tasks.md, checklist.md, contract.md, design.md)
  from `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/`
  plus parent `coordination.md` when present, and implement the approved tasks
  within an isolated git worktree. Use when the user asks to implement from an
  existing spec set, execute a spec plan, or work on a feature branch without
  affecting the parent working tree. If not already in a worktree, create a new
  worktree with a spec-named branch from the same parent branch as the worktree
  base, implement all planned tasks, then commit the changes to that local
  branch when complete.
---

# Implement Specs with Worktree

## Dependencies

- Required: `enhance-existing-features` and `develop-new-features` for implementation standards.
- Conditional: `generate-spec` if spec files need clarification or updates.
- Optional: none.
- Fallback: If `enhance-existing-features` or `develop-new-features` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Read and understand the complete specs set before starting implementation, identify the authoritative parent branch that the worktree should inherit from, verify whether the requested scope is already implemented on that parent branch or current main working tree, and when the requested plan path is missing from the current worktree verify where the authoritative copy actually lives before substituting any nearby spec.
- Execution: Create or use an isolated worktree for implementation only when the requested spec still needs work, sync the exact approved plan set into that worktree when it is missing there, create the worktree branch from the same parent branch as the worktree base, use the spec-set name as the canonical branch/worktree name, prefer direct `git` ref checks over brittle shell inference when deciding whether a branch or worktree already exists, and commit to a local branch when done.
- Quality: Complete all planned tasks, run relevant tests, backfill the spec documents with actual completion status, avoid dragging unrelated sibling specs into the worktree just because they share a batch directory, revert unrelated formatter-only noise outside the spec-owned scope before committing, if branch/worktree creation reports ambiguous state re-check the actual git refs and worktree list before retrying, and when using targeted Rust `cargo test` selectors remember Cargo accepts only one positional test filter so each distinct selector needs its own confirmed command.
- Output: Keep the worktree branch clean with only the intended implementation commits.

## Goal

Implement approved spec planning sets in an isolated git worktree, ensuring the parent working tree is never interrupted by in-progress work.

## Workflow

### 1) Identify and read the specs set

- Locate the specs directory. The path format is `docs/plans/{YYYY-MM-DD}/{change_name}/` for single-spec work, or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/` for coordinated multi-spec work.
- If the user provides a specific path, use that directly.
- If only a `change_name` or date is given, search for matching directories under `docs/plans/`.
- If the requested path is absent from the current worktree, stop and identify the authoritative source before implementing:
  - inspect the main working tree and any relevant local branches/worktrees for that exact `docs/plans/...` path
  - prefer the exact matching plan directory from the repository's authoritative branch or main working tree over archived, approximate, or sibling plan directories
  - if the plan lives under a batch directory, sync only the requested spec directory plus the shared `coordination.md` that governs it
  - do not copy neighboring sibling spec directories into the worktree unless the user explicitly expanded scope
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
- If the current worktree is missing the exact requested plan set, sync that plan into the worktree before coding and re-read the synced files there so implementation happens against the same plan snapshot that will be backfilled later.
- Determine the authoritative parent branch for the new worktree:
  - if the current checkout already comes from a branch, reuse that branch as the base
  - if the current session is inside a detached worktree, identify the parent branch that owns that worktree before creating another branch from it
  - do not default to `main` unless `main` is actually the parent branch of the worktree you are extending
- Before creating a new worktree, inspect the parent branch and current main working tree for evidence that the requested spec is already implemented:
  - search the codebase, tests, and recent git history for the exact feature boundary or cutover named by the spec
  - if the requested plan is archived, treat that as a signal to verify whether the implementation already landed before starting any new branch
  - when the requested behavior is already present and verified, report a `no-op` result with concrete evidence instead of recreating the same work in a fresh worktree

### 3) Create a new worktree if needed

If not already in a worktree, or if the user explicitly requests a fresh worktree, and the spec is not already implemented:

- Derive the canonical spec name from the requested `change_name` directory.
- Use that spec name as the shared branch/worktree identifier:
  - branch name: `<type>/<spec-name>` following `references/branch-naming.md`
  - worktree directory name: `<spec-name>`
- Create a new branch for this implementation from the same parent branch identified in step 2:
  ```bash
  git branch <branch-name> <parent-branch>
  ```
- Add a new worktree:
  ```bash
  git worktree add ../<spec-name> <branch-name>
  ```
- Move into the new worktree directory and begin work there.
- When checking whether the target branch or worktree already exists, use direct git evidence instead of shell heuristics:
  ```bash
  git show-ref --verify --quiet refs/heads/<branch-name>
  git worktree list --porcelain
  ```
- If branch creation or worktree creation fails in a way that leaves the state unclear, stop and re-read `git show-ref` plus `git worktree list --porcelain` before retrying; do not guess from wrapper output or compound shell conditionals.

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
- When using targeted Rust `cargo test` commands, pass at most one positional test filter per invocation; if multiple selectors are needed, run separate commands or a broader confirmed selector.
- Treat any targeted test command that executes zero tests as non-verification and rerun with a selector that proves the intended coverage actually ran.
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
- Note the spec-derived branch name and worktree location.
- Confirm that the parent branch remains unaffected.

## Working Rules

- Always work in an isolated worktree to keep the parent checkout clean.
- Treat an already-landed spec as complete work, not as a reason to recreate a duplicate worktree.
- Keep the new branch based on the same parent branch as the worktree base; do not silently rebase the workflow onto a different branch.
- Use the spec-set name as the canonical identifier for the branch and worktree unless the user explicitly asks for a different naming scheme.
- Complete all planned tasks before committing; do not stop with partial work.
- Treat the specs as the source of truth for scope — do not deviate without user approval.
- When `coordination.md` exists, treat it as the source of truth for batch-level ownership and cutover direction.
- Never remove a shared shim, rename a shared field, or rewrite a shared file outside the ownership map unless `coordination.md` explicitly allows that change or the user approves a coordination update first.
- Revert formatter-only edits outside the owned spec scope before the final commit so the worktree stays reviewable and merge-safe.
- Follow the testing standards from `enhance-existing-features` and `develop-new-features`.
- Do not push to remote unless the user explicitly requests it.

## References

- `references/branch-naming.md`: branch naming conventions
- `enhance-existing-features`: implementation standards for brownfield work
- `develop-new-features`: implementation standards for new feature work
