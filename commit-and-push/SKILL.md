---
name: commit-and-push
description: "Guide the agent to submit local changes with commit and push only (no versioning). Use when users ask to commit, submit, or push changes without requesting tag/version/release operations. If the current change set includes new completed spec files, run `specs-to-project-docs` before the final commit so project docs are standardized and the old specs are removed or archived."
---

# Commit and Push

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` before the final commit.
- Conditional: `review-change-set`, `discover-edge-cases`, and `harden-app-security` for code-affecting changes; `specs-to-project-docs` when the current change set includes new completed spec files.
- Optional: none.
- Fallback: If any required dependency is unavailable, or if `specs-to-project-docs` is required for spec conversion but unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect git state and classify the change set before deciding which quality gates apply.
- Execution: Run the dependency skills in order, standardize project docs when new specs are present, preserve staging intent, then commit and push without release steps.
- Quality: Re-run relevant validation for runtime changes and keep project docs plus agent constraints synchronized before committing.
- Output: Produce a concise Conventional Commit and push it to the current branch only.

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
2. Classify changes
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: content updates only (for example README, docs, comments).
   - `new-specs-present`: the current change set adds or updates completed planning files such as `spec.md`, `tasks.md`, `checklist.md`, or their containing plan directories.
3. Run code-affecting dependency skills (when applicable)
   - Execute `review-change-set` first to challenge architecture and simplification assumptions.
   - Execute `discover-edge-cases` next to surface unresolved edge-case risks.
   - Resolve any confirmed findings.
   - Ensure `harden-app-security` has been executed for the same code-affecting scope as an adversarial quality gate.
   - Re-run relevant tests when runtime logic changes.
4. Standardize project docs when new specs are present
   - Execute `specs-to-project-docs` when `new-specs-present` is true and the related implementation scope is already complete enough for documentation consolidation.
   - Let `specs-to-project-docs` convert the relevant specs into standardized project docs, normalize any existing project docs to the same structure, and remove or archive superseded source spec files.
   - If the specs still represent active unfinished work, do not convert them yet; report that the spec files remain active and should not be deleted.
5. Run pre-commit sync dependencies
   - Execute `align-project-documents` after spec conversion and code/doc scans are complete.
   - Execute `maintain-project-constraints` immediately before the commit.
6. Keep docs synchronized when needed
   - Apply the output from `specs-to-project-docs` when new specs were converted into project docs.
   - Apply the output from `align-project-documents` when behavior or usage changed.
   - Apply the output from `maintain-project-constraints` when agent workflow/rules changed.
7. Commit
   - Preserve user staging intent where possible.
   - Write a concise Conventional Commit message using `references/commit-messages.md`.
8. Push
   - Push commit(s) to the current branch.

## Notes

- Never run version bump, tag creation, or changelog release steps in this skill.
- If release/version/tag work is requested, use `version-release` instead.
- If a new branch is required, follow `references/branch-naming.md`.
