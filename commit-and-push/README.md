# commit-and-push

A Codex skill for commit-and-push workflows without release/version operations.

## What this skill does

`commit-and-push` helps agents safely submit local changes by:

1. Inspecting git status and staged state.
2. Running `archive-specs` during submission to convert completed spec sets and archive them, or when existing project docs need normalization.
3. Keeping root `CHANGELOG.md` `Unreleased` aligned with the actual pending change set, including removing stale conflicting bullets when needed.
4. Running `align-project-documents` and `maintain-project-constraints` before commit.
5. Running additional dependency skills for code-affecting diffs when their coverage is needed.
6. Committing with a concise Conventional Commit message.
7. Pushing to the current branch.

## Scope

Use this skill when the user asks to commit/push/submit changes and does **not** request:

- version bumping
- tagging
- release changelog workflows

If the repository contains a completed spec set, convert it into the categorized `archive-specs` project-doc structure during submission and archive the consumed plan files. Treat `spec.md`, `tasks.md`, and `checklist.md` semantically: unchecked task or decision checkboxes do not automatically mean the work is unfinished when the docs clearly show they were not selected, replaced, deferred, or marked `N/A`.

Treat root `CHANGELOG.md` `Unreleased` as the source of pending release notes: add or refresh only the bullets that match the current change, keep unrelated pending bullets, and remove older conflicting bullets when the new implementation supersedes them.

For release workflows, use `version-release`.
