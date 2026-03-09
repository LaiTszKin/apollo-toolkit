---
name: commit-and-push
description: "Guide the agent to submit local changes with commit and push only (no versioning). Use when users ask to commit, submit, or push changes without requesting tag/version/release operations."
---

# Commit and Push

## Overview

Run a standardized commit-and-push workflow without release/version steps.

## Dependency Contract (Required)

Run these skills after scanning the change set and before the final commit:

1. `align-project-documents`
2. `maintain-project-constraints`

For code-affecting changes, also run these skills before the final commit:

1. `fix-edge-cases` (first)
2. `code-simplifier` (second)

If any required dependency is unavailable, stop and report the missing dependency.

The documentation/constraint dependencies above are still required for docs-only changes because they verify repository docs and agent-facing constraints before commit.

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
3. Run code-affecting dependency skills (when applicable)
   - Execute `fix-edge-cases` first.
   - Execute `code-simplifier` second.
   - Re-run relevant tests when runtime logic changes.
4. Run pre-commit sync dependencies
   - Execute `align-project-documents` after the scan is complete.
   - Execute `maintain-project-constraints` immediately before the commit.
5. Keep docs synchronized when needed
   - Apply the output from `align-project-documents` when behavior or usage changed.
   - Apply the output from `maintain-project-constraints` when agent workflow/rules changed.
6. Commit
   - Preserve user staging intent where possible.
   - Write a concise Conventional Commit message using `references/commit-messages.md`.
7. Push
   - Push commit(s) to the current branch.

## Notes

- Never run version bump, tag creation, or changelog release steps in this skill.
- If release/version/tag work is requested, use `version-release` instead.
- If a new branch is required, follow `references/branch-naming.md`.
