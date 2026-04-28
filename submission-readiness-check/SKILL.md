---
name: submission-readiness-check
description: Prepare a repository for safe submission by synchronizing `CHANGELOG.md`, project docs, `AGENTS.md/CLAUDE.md`, and completed planning artifacts before commit, push, PR creation, or release. Use when a workflow is about to submit changes and must avoid missing finalization steps such as stale `Unreleased` notes, unarchived completed spec sets, or unsynchronized agent constraints.
---

# Submission Readiness Check

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` before any git submission step.
- Conditional: `archive-specs` when completed `spec.md` / `tasks.md` / `checklist.md` sets should be converted into categorized project docs and archived, or when existing project docs need normalization into the standard structure.
- Optional: none.
- Fallback: If a required dependency is unavailable, or if spec conversion is required but `archive-specs` is unavailable, stop and report the missing dependency instead of submitting partially synchronized changes.

## Standards

- Evidence: Inspect the actual git diff, staged set, planning artifacts, `CHANGELOG.md`, and current project docs before declaring the repository ready to submit.
- Execution: Decide whether the target flow is commit/push, PR, or release; normalize completed spec sets when appropriate; synchronize project docs plus `AGENTS.md/CLAUDE.md`; then enforce changelog readiness before any commit, tag, push, PR creation, or release publishing step.
- Quality: Treat missing or stale changelog entries as blocking issues for submit workflows, preserve unrelated pending `Unreleased` bullets, do not archive active plan sets that still track unfinished scope, and do not hand back a ready verdict until every conditional gate whose scenario is met has actually been completed.
- Output: Return a ready-to-submit verdict with the synchronized files and any blocking items that must be fixed before the owning submit workflow continues.

## Workflow

### 1) Inventory the real submission surface

- Read `git status -sb`, `git diff --stat`, and `git diff --cached --stat`.
- Check whether the repository has root `CHANGELOG.md`, top-level `AGENTS.md/CLAUDE.md`, and categorized project docs already in use.
- Inventory planning artifacts across the repository, not only staged files, so completed plan sets are not missed.
- Classify the intended downstream flow:
  - `commit-push`
  - `pull-request`
  - `release`

### 2) Decide whether planning artifacts should be converted

- Treat live `spec.md`, `tasks.md`, and `checklist.md` sets semantically instead of mechanically.
- Run `$archive-specs` when the relevant plan set reflects the delivered outcome, or when project docs still need normalization into the standard categorized structure.
- Keep a plan set live when it still documents unfinished implementation, unresolved design work, or same-scope follow-up that is intentionally not shipping yet.
- If the archive scenario is met, treat `$archive-specs` as blocking before returning a ready-to-submit verdict.

### 3) Synchronize project docs and constraints

- Run `$align-project-documents` after spec conversion or doc inspection is complete.
- Run `$maintain-project-constraints` immediately before the owning submission workflow mutates git history.
- Apply the resulting doc and `AGENTS.md/CLAUDE.md` updates when behavior, operator workflow, or standing project rules changed.

### 4) Enforce changelog readiness

- Treat root `CHANGELOG.md` as the canonical user-facing submission summary when it exists.
- For `commit-push` and `pull-request` flows:
  - Keep `Unreleased` aligned with the actual pending change set.
  - Add or update only the bullets that correspond to the current work.
  - Preserve unrelated pending bullets from other unshipped work.
  - Remove or rewrite stale bullets when the current implementation supersedes them.
  - If `Unreleased` is missing the current code-affecting or user-visible change, edit `CHANGELOG.md` now instead of returning a warning for another workflow to maybe fix later.
- For `release` flows:
  - Require a non-empty `Unreleased` section before the release continues.
  - Ensure the release workflow will cut notes directly from curated changelog content instead of reconstructing them from `git diff`.
  - Confirm the `Unreleased` bullets are release-ready before handing control back: they must describe the exact release scope that will be versioned and tagged next.
- If code-affecting or user-visible changes are about to ship and `CHANGELOG.md` does not reflect them, stop and fix the changelog before continuing.

### 5) Hand back a submission verdict

- Confirm which files were synchronized:
  - project docs
  - `AGENTS.md/CLAUDE.md`
  - `CHANGELOG.md`
  - archived plan sets
- If anything remains unsynchronized, report it as a blocking item rather than letting the submit workflow continue optimistically.

## Notes

- Do not create commits, tags, pushes, PRs, or releases inside this skill.
- Treat scenario-matched conditional gates such as spec archival, docs synchronization, and changelog updates as blocking readiness work, not optional follow-up.
- Use this skill as a shared preflight for submit workflows rather than duplicating the same finalization checklist in multiple skills.
