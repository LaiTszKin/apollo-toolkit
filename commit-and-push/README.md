# commit-and-push

A Codex skill for commit-and-push workflows without release/version operations.

## What this skill does

`commit-and-push` helps agents safely submit local changes by:

1. Inspecting git status and staged state.
2. Running required dependency skills for code-affecting diffs.
3. Committing with a concise Conventional Commit message.
4. Pushing to the current branch.

## Scope

Use this skill when the user asks to commit/push/submit changes and does **not** request:

- version bumping
- tagging
- release changelog workflows

For release workflows, use `version-release`.
