# commit-and-push

A Codex skill for commit-and-push workflows without release/version operations.

## What this skill does

`commit-and-push` helps agents safely submit local changes by:

1. Inspecting git status and staged state.
2. Running `specs-to-project-docs` when the current change set contains new completed spec files.
3. Running `align-project-documents` and `maintain-project-constraints` before commit.
4. Running additional dependency skills for code-affecting diffs.
5. Committing with a concise Conventional Commit message.
6. Pushing to the current branch.

## Scope

Use this skill when the user asks to commit/push/submit changes and does **not** request:

- version bumping
- tagging
- release changelog workflows

If the current diff includes new completed specs, convert them into categorized project docs first and let `specs-to-project-docs` remove or archive the superseded spec files.

For release workflows, use `version-release`.
