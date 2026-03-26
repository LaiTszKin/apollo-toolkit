---
name: commit-and-push
description: "Guide the agent to submit local changes with commit and push only (no versioning). Use when users ask to commit, submit, or push changes without requesting tag/version/release operations. During submission, run `archive-specs` to convert completed spec sets into project documentation and archive the consumed plans, and also use it when existing project docs do not match the standardized project-doc structure."
---

# Commit and Push

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` before the final commit.
- Conditional: `review-change-set`, `discover-edge-cases`, and `harden-app-security` for code-affecting changes; `archive-specs` during submission when completed spec sets should be converted into project docs and archived, or when existing project docs need normalization into the standard categorized structure.
- Optional: none.
- Fallback: If any required dependency is unavailable, or if `archive-specs` is required for spec conversion but unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect git state and classify the change set before deciding which quality gates apply.
- Execution: Run the required quality-gate skills when applicable, convert completed spec sets into categorized project docs during submission, normalize non-standard project docs when needed, preserve staging intent, honor any explicit user-specified target branch, then commit and push without release steps; run dependent git mutations sequentially and verify the remote branch actually contains the new local `HEAD` before reporting success.
- Quality: Re-run relevant validation for runtime changes, keep project docs plus agent constraints synchronized before committing, and preserve unrelated local work safely when branch switching or post-push local sync is required; treat `archive-specs` outputs as the canonical project-doc structure when normalization is required.
- Output: Produce a concise Conventional Commit, push it to the intended branch, and report any temporary stash/restore or local branch sync that was required.

## Overview

Run a standardized commit-and-push workflow without release/version steps.

## References

Load only when needed:

- `references/commit-messages.md`
- `references/branch-naming.md`

## Workflow

1. Inspect current state
   - Run `git status -sb`, `git diff --stat`, and `git diff --cached --stat`.
   - Check staged files with `git diff --cached --name-only`.
   - Inventory repository planning artifacts and project docs, not only staged files, to detect repo specs and non-standard documentation layouts.
2. Classify changes
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: content updates only (for example README, docs, comments).
   - `repo-specs-present`: the repository contains live project planning artifacts such as `spec.md`, `tasks.md`, `checklist.md`, or plan directories; exclude reference examples, templates, and archived samples.
   - `repo-specs-ready-for-conversion`: the relevant `spec.md`, `tasks.md`, and `checklist.md` have been updated to reflect the actual outcome of the work, and any unchecked task/decision checkbox that is clearly not selected, replaced, deferred, or `N/A` (for example, E2E intentionally not created) does not by itself mean the spec set is unfinished.
   - `project-doc-structure-mismatch`: existing `README.md` and project docs do not match the categorized structure required by `archive-specs`.
   - Treat a spec set as still active when it documents remaining implementation gaps, follow-up integration work, undecided design work, or deferred tasks that still belong to the same in-flight change.
3. Resolve branch target before mutating history
   - Treat an explicit user-specified destination such as `main`, `origin/main`, or another named branch as authoritative over the current branch.
   - If the current branch does not match the requested destination, inspect `git status --short` for unrelated local changes before switching branches.
   - Preserve unrelated uncommitted work safely before branch operations, for example with `git stash push`, and restore it after the target branch has been updated.
   - If the fix was committed on the wrong branch, move it to the requested branch with safe history-preserving operations such as `cherry-pick`, `merge --ff-only`, or a clean replay; do not force-push unless the user explicitly asks for it.
   - If the user asks to sync the local target branch after pushing, fast-forward or pull that branch locally and then restore any preserved worktree changes.
4. Run code-affecting dependency skills (when applicable)
   - Run `review-change-set`, `discover-edge-cases`, and `harden-app-security` for the same code-affecting scope when their coverage is needed.
   - Consolidate and resolve all confirmed findings before continuing.
   - Re-run relevant tests when runtime logic changes.
5. Standardize project docs when specs or doc normalization is needed
   - During submission, execute `archive-specs` when `repo-specs-ready-for-conversion` is true or when `project-doc-structure-mismatch` is true.
   - Let `archive-specs` convert the relevant specs into categorized project docs such as `docs/README.md`, `docs/getting-started.md`, `docs/configuration.md`, `docs/architecture.md`, `docs/features.md`, and `docs/developer-guide.md`.
   - Let the skill normalize any existing project docs to the same structure and archive superseded source spec files.
   - Do not treat unchecked task or decision checkboxes alone as blocking unfinished work; read the surrounding notes and requirement status semantically.
   - If the docs still show unresolved implementation scope that is neither completed, intentionally deferred, nor explicitly `N/A`, do not convert them yet; report that the spec files remain active and should not be deleted.
   - If the current change intentionally ships a partial phase while the same plan set still tracks remaining work, keep that plan set live and skip archival for that scope.
6. Run pre-commit sync dependencies
   - Execute `align-project-documents` after spec conversion and code/doc scans are complete.
   - Execute `maintain-project-constraints` immediately before the commit.
7. Keep docs synchronized when needed
   - Apply the output from `archive-specs` when repository specs were converted or existing project docs were normalized into categorized project docs.
   - Apply the output from `align-project-documents` when behavior or usage changed.
   - Apply the output from `maintain-project-constraints` when agent workflow/rules changed.
8. Commit
   - Preserve user staging intent where possible.
   - Write a concise Conventional Commit message using `references/commit-messages.md`.
9. Push
   - Push commit(s) to the intended branch.
   - Do not overlap `git commit`, `git push`, branch switching, or post-push sync operations; wait for each mutation to finish before starting the next one.
   - After pushing, verify the remote branch tip matches the local `HEAD`, for example by comparing `git rev-parse HEAD` with the target branch hash from `git rev-parse @{u}` or `git ls-remote --heads <remote> <branch>`.
   - If the push result is ambiguous, out of order, or the hashes do not match, rerun the missing git step sequentially and re-check before reporting success.
   - Confirm the local branch state matches the user's requested destination when post-push synchronization was requested.

## Notes

- Never run version bump, tag creation, or changelog release steps in this skill.
- If release/version/tag work is requested, use `version-release` instead.
- If a new branch is required, follow `references/branch-naming.md`.
- A pushed implementation can still leave an active spec set behind; commit completion and spec archival are separate decisions.
