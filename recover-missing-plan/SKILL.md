---
name: recover-missing-plan
description: Recover a missing or mismatched `docs/plans/...` plan set by verifying the path, checking archives and git history, reading the authoritative issue context, and restoring or reconstructing `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` before implementation continues.
---

# Recover Missing Plan

## Dependencies

- Required: `read-github-issue` and `generate-spec`.
- Conditional: none.
- Optional: none.
- Fallback: If the authoritative issue context cannot be read and no archived or historical plan evidence exists, stop and report the missing evidence instead of guessing the scope.

## Standards

- Evidence: Confirm the requested plan path really is missing, search the repository and git history, and use authoritative issue context before restoring or recreating planning files.
- Execution: Prefer restoring the original plan set when trustworthy evidence exists; reconstruct only the minimum required files and only after establishing the intended issue scope.
- Quality: Do not invent requirements, do not overwrite a different issue's plan set, and keep active-vs-archived placement aligned with the actual delivery state.
- Output: Leave behind the correct `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` set plus a short evidence trail explaining whether the plan was restored, reconstructed, or redirected to an archived location.

## Overview

Use this skill when the user points to `docs/plans/{date}/{change}/...` or `docs/plans/{date}/{batch}/{change}/...` but the directory is missing, only `docs/plans/README.md` exists, the matching files were already archived, or the workspace is detached / incomplete and the plan evidence must be recovered before coding or archiving can proceed.

Typical triggers:
- The user references a specific `docs/plans/...` directory that is absent from the current worktree.
- A feature workflow expects approved spec files, but the plan was archived, never checked out, or exists only in another branch/worktree.
- An implementation task must continue from GitHub issue context because the original planning artifacts are missing.

## Workflow

### 1) Prove the path mismatch first

- Confirm the requested path exactly.
- List `docs/plans/`, `docs/archive/plans/`, and any nearby plan directories with similar names.
- Search the repository for the issue number, `change_name`, and user-provided path fragment.
- Check whether the plan is genuinely missing, merely archived, or present under a slightly different normalized directory name.

### 2) Search for trustworthy local recovery sources

- Inspect git-tracked history for the missing plan files before recreating anything.
- Check other local branches or worktrees when the repository uses parallel issue branches.
- If the user asked to finish already-completed work, verify whether the correct action is to update `docs/archive/plans/...` instead of creating a new active plan.
- Treat archived specs, prior commits, and clearly matching neighboring plan sets as recovery evidence, not as permission to infer new scope.

### 3) Read authoritative issue context when local evidence is incomplete

- Use `$read-github-issue` to read the actual remote issue and comments.
- Prefer repository helpers when they work, but immediately fall back to raw `gh issue view` when wrappers return empty or incomplete output.
- Use the issue to recover acceptance criteria, constraints, and naming only after confirming it is the same scope as the missing plan.
- If the issue and local evidence disagree, stop and report the conflict instead of blending them.

### 4) Decide restore vs reconstruct vs redirect

Choose one path explicitly:
- Restore: reuse the original plan content when a trustworthy historical copy exists.
- Reconstruct: create a fresh plan set only when the issue scope is clear and the files truly do not exist anywhere trustworthy.
- Redirect: if the work is already completed and the correct files live under `docs/archive/plans/...`, use the archived location and continue the requested archival or reporting workflow from there.

Rules:
- Never overwrite a neighboring issue's plan set just because the technical area overlaps.
- Keep reconstructed scope limited to the same issue only.
- If reconstruction would touch more than three modules, split the work through `$generate-spec` instead of drafting an oversized recovered plan.

### 5) Rebuild the plan set carefully

- When reconstruction is required, use `$generate-spec` to create the canonical `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, and `design.md` skeleton.
- Fill the recovered plan from verified evidence only: issue text, codebase inspection, official docs when relevant, and already-landed implementation facts if the work was partially completed.
- Keep the recovered planning docs in the user's language unless repository conventions require otherwise.
- When the user asked to continue implementation immediately, recover only the current issue's plan set and then hand control back to the owning workflow skill.

### 6) Backfill completion state honestly

- If code already exists, mark only the tasks and checklist items supported by actual evidence and tests.
- If work is still pending, leave the recovered plan active under `docs/plans/...`.
- If work is already complete and the project archives finished plans, move or keep the recovered set under `docs/archive/plans/...` and update any relevant plan index.
- Record exactly which evidence source justified the recovery choice.

## Working Rules

- Missing plan recovery is an evidence-restoration workflow, not a shortcut to skip planning discipline.
- Prefer archived or historical files over freshly rewritten prose whenever a reliable source exists.
- When the repository's issue helper scripts fail, use direct `gh` commands instead of stalling.
- Do not silently continue implementation with no recovered plan when the owning workflow depends on one.

## References

- `$read-github-issue`: authoritative remote issue retrieval.
- `$generate-spec`: canonical spec/task/checklist generation and backfill workflow.
