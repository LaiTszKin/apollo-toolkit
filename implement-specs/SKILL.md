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

See `../references/implement-specs-common.md` for the standard spec discovery and reading workflow.

### 2) Check current branch state

- Run `git status -sb` and identify the current branch.
- Preserve unrelated user changes. If the checkout contains unrelated dirty files, avoid editing them and report any blockers before proceeding.
- Confirm that the current branch is the intended destination for the implementation. Do not create, rename, or switch branches unless the user explicitly changes scope.
- If the exact requested plan was recovered (e.g. via `recover-missing-plan`) into the current checkout, re-read the recovered files before coding so implementation and backfill use the same plan snapshot.

### 3) Implement the planned tasks

See `../references/implement-specs-common.md` for the standard implementation workflow.

### 4) Backfill completion status

See `../references/implement-specs-common.md` for the standard backfill workflow.

### 5) Commit changes

See `../references/implement-specs-common.md` for the standard commit workflow.

### 6) Report completion

See `../references/implement-specs-common.md` for the standard reporting format. Add the following context-specific details:

- Note the current branch and commit hash.
- Confirm which tests ran and which planned documents were backfilled.

## Working Rules

- Always work in the current checkout; never create a branch or git worktree inside this skill unless the user explicitly changes the request.
- The shared working rules in `../references/implement-specs-common.md` also apply (complete all tasks, treat specs as truth, respect coordination.md, follow testing standards, no remote push unless asked).

## References

- `enhance-existing-features`: implementation standards for brownfield work
- `develop-new-features`: implementation standards for new feature work
- `recover-missing-plan`: recovery workflow for missing or mismatched spec sets
