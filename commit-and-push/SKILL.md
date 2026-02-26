---
name: commit-and-push
description: "Guide the agent to submit local changes with commit and push only (no versioning). Use when users ask to commit, submit, or push changes without requesting tag/version/release operations."
---

# Commit and Push

## Overview

Run a standardized commit-and-push workflow without release/version steps.

## Dependency Contract (Required)

For code-affecting changes, run these skills before the final commit:

1. `edge-case-test-fixer` (first)
2. `code-simplifier` (second)

If either dependency is unavailable, stop and report the missing dependency.

If the change set is docs-only and does not alter runtime behavior, tests, build scripts, or CI/config behavior, dependencies may be skipped.

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
3. Run dependency skills (code-affecting only)
   - Execute `edge-case-test-fixer` first.
   - Execute `code-simplifier` second.
   - Re-run relevant tests when runtime logic changes.
4. Keep docs synchronized when needed
   - Update `README.md` only when behavior or usage changed.
   - Update `AGENTS.md` only when agent workflow/rules changed.
5. Commit
   - Preserve user staging intent where possible.
   - Write a concise Conventional Commit message using `references/commit-messages.md`.
6. Push
   - Push commit(s) to the current branch.

## Notes

- Never run version bump, tag creation, or changelog release steps in this skill.
- If release/version/tag work is requested, use `version-release` instead.
- If a new branch is required, follow `references/branch-naming.md`.
