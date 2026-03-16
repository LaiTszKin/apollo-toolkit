---
name: commit-and-push
description: "Guide the agent to submit local changes with commit and push only (no versioning). Use when users ask to commit, submit, or push changes without requesting tag/version/release operations."
---

# Commit and Push

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` before the final commit.
- Conditional: `review-change-set`, `discover-edge-cases`, and `harden-app-security` for code-affecting changes.
- Optional: none.
- Fallback: If any required dependency is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect git state and classify the change set before deciding which quality gates apply.
- Execution: Run the dependency skills in order, preserve staging intent, then commit and push without release steps.
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
3. Run code-affecting dependency skills (when applicable)
   - Execute `review-change-set` first to challenge architecture and simplification assumptions.
   - Execute `discover-edge-cases` next to surface unresolved edge-case risks.
   - Resolve any confirmed findings.
   - Ensure `harden-app-security` has been executed for the same code-affecting scope as an adversarial quality gate.
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
