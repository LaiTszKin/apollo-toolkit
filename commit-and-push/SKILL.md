---
name: commit-and-push
description: "Guide the agent to submit local changes with commit and push only (no versioning). Use when users ask to commit, submit, or push changes without requesting tag/version/release operations. Depend directly on `archive-specs` when completed plan sets should become durable docs or when project docs need alignment, and let that skill own the downstream documentation synchronization work."
---

# Commit and Push

## Dependencies

- Required: `submission-readiness-check` before the final commit.
- Conditional: `archive-specs` when completed plan sets should be converted or repository docs need alignment; `review-change-set` is required for code-affecting changes; `discover-edge-cases` and `harden-app-security` are important review gates that remain conditional, but become required whenever the reviewed scope or risk profile warrants them.
- Optional: none.
- Fallback: If any required dependency is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect git state and classify the change set before deciding which quality gates apply, then compare the actual pending diff against root `CHANGELOG.md` `Unreleased` before committing.
- Execution: Run the required quality-gate skills when applicable, and treat every conditional gate whose scenario is met as blocking before submission; hand the repository to `submission-readiness-check` for readiness classification, invoke `archive-specs` directly whenever completed plan sets should be converted or project docs need alignment, preserve staging intent, honor any explicit user-specified target branch, and when the worktree is already clean inspect local `HEAD`, upstream state, and the most recent relevant commit before deciding the request is a no-op; when worktree-based delivery is involved, verify where the authoritative target branch lives before moving history, re-validate on that target branch after replay or merge, and remove the temporary worktree only after the target branch is safely updated; then commit and push without release steps; run dependent git mutations sequentially and verify the remote branch actually contains the new local `HEAD` before reporting success.
- Quality: Re-run relevant validation for runtime changes, preserve unrelated local work safely when branch switching or post-push local sync is required, and do not bypass blocking readiness findings such as missing/stale `Unreleased` bullets or unsynchronized project docs.
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
   - If the worktree is already clean, inspect `git log -1 --stat`, local `HEAD`, and the configured upstream state before concluding there is nothing to submit; use that evidence to determine whether the requested work was already committed and pushed, committed but not pushed, or never landed.
2. Classify changes
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: content updates only (for example README, docs, comments).
   - `repo-specs-present`: the repository contains live project planning artifacts such as `spec.md`, `tasks.md`, `checklist.md`, or plan directories; exclude reference examples, templates, and archived samples.
   - `repo-specs-ready-for-conversion`: the relevant `spec.md`, `tasks.md`, and `checklist.md` have been updated to reflect the actual outcome of the work, and any unchecked task/decision checkbox that is clearly not selected, replaced, deferred, or `N/A` (for example, E2E intentionally not created) does not by itself mean the spec set is unfinished.
   - `project-doc-structure-mismatch`: existing `README.md` and project docs do not match the categorized structure required by `archive-specs`.
   - Treat a spec set as still active when it documents remaining implementation gaps, follow-up integration work, undecided design work, or deferred tasks that still belong to the same in-flight change.
   - Any conditional gate whose trigger is confirmed by this classification becomes mandatory before commit, including review, spec archival, docs synchronization, and changelog updates.
3. Resolve branch target before mutating history
   - Treat an explicit user-specified destination such as `main`, `origin/main`, or another named branch as authoritative over the current branch.
   - If the current branch does not match the requested destination, inspect `git status --short` for unrelated local changes before switching branches.
   - Preserve unrelated uncommitted work safely before branch operations, for example with `git stash push`, and restore it after the target branch has been updated.
   - If the fix was committed on the wrong branch, move it to the requested branch with safe history-preserving operations such as `cherry-pick`, `merge --ff-only`, or a clean replay; do not force-push unless the user explicitly asks for it.
   - If the user asks to sync the local target branch after pushing, fast-forward or pull that branch locally and then restore any preserved worktree changes.
   - If the implementation lives in a detached or temporary `git worktree`, inspect both the temporary worktree and the main worktree before deciding the replay method.
   - When the main worktree already contains staged or partially overlapping copies of the same changes, compare file content and branch tips first; do not create an unnecessary merge commit when a direct replay onto the authoritative target branch is safer.
   - When the worktree diff is broader than the requested issue, stop and separate the requested commit scope before replaying anything to the target branch.
4. Run code-affecting dependency skills (when applicable)
   - Run `review-change-set` for every code-affecting change before continuing; treat unresolved review findings as blocking.
   - Run `discover-edge-cases` and `harden-app-security` for the same code-affecting scope when the reviewed risk profile or repository context says their coverage is needed; treat them as blocking review gates, not optional polish, whenever that condition is met.
   - Consolidate and resolve all confirmed findings before continuing.
   - Re-run relevant tests when runtime logic changes.
5. Run shared submission readiness
   - Execute `$submission-readiness-check` after code/doc scans are complete and before the final commit.
   - Let it decide whether completed plan sets should be converted, whether project docs need alignment through `archive-specs`, and whether `CHANGELOG.md` is blocking submission.
   - Do not continue to commit while `submission-readiness-check` reports unresolved readiness blockers.
   - Treat root `CHANGELOG.md` `Unreleased` coverage as mandatory for code-affecting or user-visible changes: if the current work is not reflected there yet, update it before committing instead of merely noting the gap.
   - Re-open the final `CHANGELOG.md` diff after readiness updates and confirm the `Unreleased` bullets describe the same scope as the commit you are about to create.
   - When readiness indicates doc conversion or project-doc drift, run `archive-specs` before the final commit instead of duplicating documentation alignment work locally.
6. Commit
   - Preserve user staging intent where possible.
   - Write a concise Conventional Commit message using `references/commit-messages.md`.
7. Push
   - Push commit(s) to the intended branch.
   - Do not overlap `git commit`, `git push`, branch switching, or post-push sync operations; wait for each mutation to finish before starting the next one.
   - After pushing, verify the remote branch tip matches the local `HEAD`, for example by comparing `git rev-parse HEAD` with the target branch hash from `git rev-parse @{u}` or `git ls-remote --heads <remote> <branch>`.
   - If the push result is ambiguous, out of order, or the hashes do not match, rerun the missing git step sequentially and re-check before reporting success.
   - Confirm the local branch state matches the user's requested destination when post-push synchronization was requested.
   - When the user explicitly asks to merge work back from a temporary worktree and delete that worktree, do the final verification on the authoritative target branch first, then remove the temporary worktree and prune stale worktree records before reporting completion.

## Notes

- Never run version bump, tag creation, or changelog release steps in this skill.
- Treat every scenario-matched gate as blocking before commit, not as an optional reminder to maybe do later.
- Never skip `review-change-set` for code-affecting changes, and do not continue past review while confirmed findings remain unresolved.
- Never downgrade `discover-edge-cases` or `harden-app-security` to optional follow-up when the change risk says they apply.
- Never claim the repository is ready to commit while root `CHANGELOG.md` `Unreleased` is missing the current change or still describes superseded work.
- Never fabricate a commit/push result when the worktree is already clean; either identify the exact existing commit/upstream state that satisfies the user's request or say that no matching new submission exists.
- Never delete a temporary worktree before the target branch has been updated, tested, and verified to contain the intended final content.
- If release/version/tag work is requested, use `version-release` instead.
- If a new branch is required, follow `references/branch-naming.md`.
- A pushed implementation can still leave an active spec set behind; commit completion and spec archival are separate decisions.
