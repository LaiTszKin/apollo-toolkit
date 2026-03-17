---
name: commit-and-push
description: "Guide the agent to submit local changes with commit and push only (no versioning). Use when users ask to commit, submit, or push changes without requesting tag/version/release operations. If the repository contains active planning artifacts or existing project docs do not match the `specs-to-project-docs` structure, run `specs-to-project-docs` before the final commit so project docs are standardized into categorized files and the old specs are removed or archived when appropriate."
---

# Commit and Push

## Dependencies

- Required: `align-project-documents` and `maintain-project-constraints` before the final commit.
- Conditional: `review-change-set`, `discover-edge-cases`, and `harden-app-security` for code-affecting changes; `specs-to-project-docs` when the repository contains active planning artifacts or existing project docs need normalization into the standard categorized structure.
- Optional: none.
- Fallback: If any required dependency is unavailable, or if `specs-to-project-docs` is required for spec conversion but unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect git state and classify the change set before deciding which quality gates apply.
- Execution: Run code-review dependency skills as independent parallel subagents when applicable, keep their contexts isolated to reduce review bias, standardize project docs into categorized outputs whenever specs or doc-structure mismatches are present, preserve staging intent, then commit and push without release steps.
- Quality: Re-run relevant validation for runtime changes and keep project docs plus agent constraints synchronized before committing; treat `specs-to-project-docs` outputs as the canonical project-doc structure when normalization is required.
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
   - Inventory repository planning artifacts and project docs, not only staged files, to detect repo specs and non-standard documentation layouts.
2. Classify changes
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: content updates only (for example README, docs, comments).
   - `repo-specs-present`: the repository contains active project planning artifacts such as `spec.md`, `tasks.md`, `checklist.md`, or plan directories that represent unfinished or recently completed work; exclude reference examples, templates, and archived samples that are not live project plans.
   - `project-doc-structure-mismatch`: existing `README.md` and project docs do not match the categorized structure required by `specs-to-project-docs`.
3. Run code-affecting dependency skills (when applicable)
   - Launch `review-change-set`, `discover-edge-cases`, and `harden-app-security` as parallel review subagents for the same code-affecting scope when delegation is available.
   - Keep each review subagent in an isolated context window; do not reuse the implementation thread as the reviewer context.
   - Treat every reviewer as independent and unbiased, then consolidate and resolve all confirmed findings before continuing.
   - Re-run relevant tests when runtime logic changes.
4. Standardize project docs when specs or doc normalization is needed
   - Execute `specs-to-project-docs` when `repo-specs-present` or `project-doc-structure-mismatch` is true and the related implementation scope is already complete enough for documentation consolidation.
   - Let `specs-to-project-docs` convert the relevant specs into categorized project docs such as `docs/README.md`, `docs/getting-started.md`, `docs/configuration.md`, `docs/architecture.md`, `docs/features.md`, and `docs/developer-guide.md`.
   - Let the skill normalize any existing project docs to the same structure and remove or archive superseded source spec files.
   - If the specs still represent active unfinished work, do not convert them yet; report that the spec files remain active and should not be deleted.
5. Run pre-commit sync dependencies
   - Execute `align-project-documents` after spec conversion and code/doc scans are complete.
   - Execute `maintain-project-constraints` immediately before the commit.
6. Keep docs synchronized when needed
   - Apply the output from `specs-to-project-docs` when repository specs were converted or existing project docs were normalized into categorized project docs.
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
