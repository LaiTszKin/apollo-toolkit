# commit-and-push

A Codex skill for commit-and-push workflows without release/version operations.

## What this skill does

`commit-and-push` helps agents safely submit local changes by:

1. Inspecting git status and staged state.
2. Running `specs-to-project-docs` when the repository contains spec files or existing project docs need normalization.
3. Running `align-project-documents` and `maintain-project-constraints` before commit.
4. Running additional dependency skills for code-affecting diffs through isolated parallel review subagents when available.
5. Committing with a concise Conventional Commit message.
6. Pushing to the current branch.

## Scope

Use this skill when the user asks to commit/push/submit changes and does **not** request:

- version bumping
- tagging
- release changelog workflows

If the repository contains spec files, or if existing project docs still use a non-standard layout, normalize them into the categorized `specs-to-project-docs` structure first and let that skill remove or archive superseded spec files when appropriate.

For release workflows, use `version-release`.
