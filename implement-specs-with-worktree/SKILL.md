---
name: implement-specs-with-worktree
description: >-
  Read a specs planning set (spec.md, tasks.md, checklist.md, contract.md, design.md)
  from `docs/plans/{YYYY-MM-DD}/{change_name}/` or `docs/plans/{YYYY-MM-DD}/{batch_name}/{change_name}/`
  plus parent `coordination.md` and `preparation.md` when present, and implement
  the approved tasks within an isolated git worktree, with every code, test, and
  spec edit made inside that worktree rather than the parent checkout. Use when the user asks
  to implement from an existing spec set, execute a spec plan, or work on a
  feature branch without affecting the parent working tree. If not already in a
  worktree, create a new worktree with a spec-named branch from the same parent
  branch as the worktree base, implement all planned tasks, then commit the
  changes to that local branch when complete.
---

# Implement Specs with Worktree

## Dependencies

- Required: `implement-specs`, `enhance-existing-features`, and `develop-new-features` for implementation standards.
- Conditional: `generate-spec` if spec files need clarification or updates.
- Fallback: If `implement-specs`, `enhance-existing-features`, or `develop-new-features` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Read and understand the complete specs set before starting implementation, including parent `coordination.md` and `preparation.md` when present, identify the authoritative parent branch that the worktree should inherit from, verify whether the requested scope is already implemented on that parent branch or current main working tree, and when the requested plan path is missing from the current worktree verify where the authoritative copy actually lives before substituting any nearby spec.
- Execution: Create or use an isolated worktree for implementation only when the requested spec still needs work, sync the exact approved plan set into that worktree when it is missing there, create the worktree branch from the same parent branch as the worktree base, use the spec-set name as the canonical branch/worktree name, inspect sibling worktrees for the same batch before editing shared files when parallel implementations may already be active, prefer direct `git` ref checks over brittle shell inference when deciding whether a branch or worktree already exists, and commit to a local branch when done. Do not edit product files from the parent checkout; every implementation, test, and spec backfill change must happen inside the active worktree directory after verifying `git rev-parse --show-toplevel` and `pwd` point at the same worktree root.
- Quality: Complete all planned tasks, run relevant tests, backfill the spec documents with actual completion status, avoid dragging unrelated sibling specs into the worktree just because they share a batch directory, inspect overlapping runtime/config/shared touch points before diverging from another active sibling worktree in the same batch, revert unrelated formatter-only noise outside the spec-owned scope before committing, if branch/worktree creation reports ambiguous state re-check the actual git refs and worktree list before retrying, and when using targeted Rust `cargo test` selectors remember Cargo accepts only one positional test filter so each distinct selector needs its own confirmed command.
- Output: Keep the worktree branch clean with only the intended implementation commits.

## Goal

Implement approved spec planning sets in an isolated git worktree, ensuring the parent working tree is never interrupted by in-progress work.

## Workflow

### 1) Identify and read the specs set

Use $implement-specs for the standard spec discovery and reading workflow.

Additionally:

- When `preparation.md` exists in the parent batch directory, treat it as the already-completed prerequisite baseline for this spec; do not redo its tasks inside the member spec unless the preparation commit is missing or the document says the prerequisite remains blocked.

### 2) Check current worktree state

- Run `git worktree list` to see existing worktrees and branches.
- Determine if the current session is already inside a worktree (check `git rev-parse --show-toplevel` and compare with `git worktree list`).
- If the current worktree is missing the exact requested plan set, sync that plan into the worktree before coding and re-read the synced files there so implementation happens against the same plan snapshot that will be backfilled later.
- Before making any edits, confirm the active shell is inside the intended worktree directory; if not, stop editing, create or enter the required worktree first, and only then continue.
- Determine the authoritative parent branch for the new worktree:
  - if the current checkout already comes from a branch, reuse that branch as the base
  - if the current session is inside a detached worktree, identify the parent branch that owns that worktree before creating another branch from it
  - do not default to `main` unless `main` is actually the parent branch of the worktree you are extending
- Before creating a new worktree, inspect the parent branch and current main working tree for evidence that the requested spec is already implemented:
  - search the codebase, tests, and recent git history for the exact feature boundary or cutover named by the spec
  - if the requested plan is archived, treat that as a signal to verify whether the implementation already landed before starting any new branch
  - when the requested behavior is already present and verified, report a `no-op` result with concrete evidence instead of recreating the same work in a fresh worktree
- When the spec belongs to a parallel batch and other local worktrees for sibling specs already exist, inspect those sibling worktrees before editing any shared boundary module (for example shared runtime, config, or contract files):
  - use `git worktree list --porcelain` plus the batch ownership map in `coordination.md` to identify likely sibling worktrees
  - if a sibling worktree already touches the same shared file, read that diff first and either stay within your owned additive boundary or update the coordination evidence before proceeding
  - do not assume coordination is collision-free just because the plan scopes differ at the directory level

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
- Do not start editing until the shell is operating inside the new worktree directory and the worktree root has been verified.
- When checking whether the target branch or worktree already exists, use direct git evidence instead of shell heuristics:
  ```bash
  git show-ref --verify --quiet refs/heads/<branch-name>
  git worktree list --porcelain
  ```
- If branch creation or worktree creation fails in a way that leaves the state unclear, stop and re-read `git show-ref` plus `git worktree list --porcelain` before retrying; do not guess from wrapper output or compound shell conditionals.

Use branch naming from `references/branch-naming.md`.

### 4) Implement the planned tasks

Use $implement-specs for the standard implementation workflow.

Additionally:

- When `preparation.md` exists, implement against its prepared baseline assumptions and avoid duplicating preparation tasks in the member spec.
- When using targeted Rust `cargo test` commands, pass at most one positional test filter per invocation; if multiple selectors are needed, run separate commands or a broader confirmed selector.

### 5) Backfill completion status

Use $implement-specs for the standard backfill workflow.

Additionally:

- If preparation assumptions changed or were found missing, update `preparation.md` or stop for re-coordination instead of silently moving prerequisite work into the member spec.

### 6) Commit changes

Use $implement-specs for the standard commit workflow.

### 7) Report completion

See $implement-specs for the standard reporting format. Add the following context-specific details:

- Note the spec-derived branch name and worktree location.
- Confirm that the parent branch remains unaffected.

## Working Rules

- Always work in an isolated worktree to keep the parent checkout clean.
- Treat the parent checkout as read-only for implementation work; use it only for inspection, worktree creation, or verification, never for file edits.
- Treat an already-landed spec as complete work, not as a reason to recreate a duplicate worktree.
- Keep the new branch based on the same parent branch as the worktree base; do not silently rebase the workflow onto a different branch.
- Use the spec-set name as the canonical identifier for the branch and worktree unless the user explicitly asks for a different naming scheme.
- When `preparation.md` exists, treat it as a prerequisite baseline owned outside the member spec; do not duplicate or alter its tasks unless explicitly requested.
- Revert formatter-only edits outside the owned spec scope before the final commit so the worktree stays reviewable and merge-safe.
- The shared working rules from $implement-specs also apply (complete all tasks, treat specs as truth, respect coordination.md, follow testing standards, no remote push unless asked).

## References

- `references/branch-naming.md`: branch naming conventions
- `enhance-existing-features`: implementation standards for brownfield work
- `develop-new-features`: implementation standards for new feature work
