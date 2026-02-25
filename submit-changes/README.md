# submit-changes

A Codex skill that standardizes how code changes are submitted, with optional release steps when needed.

## Brief introduction

`submit-changes` is an agent skill for repositories that need a predictable submit process. It helps agents inspect local changes and then either:

- default to direct `commit + push`, or
- run full release steps (version/tag/changelog) when explicitly requested.

This workflow has explicit dependencies on `edge-case-test-fixer` and `code-simplifier` for code-affecting changes.

## What this skill does

The skill guides an agent through a safe, repeatable submit workflow:

1. Inspect current git changes and staging state.
2. Select mode:
   - `commit+push only` by default when user did not ask for versioning.
   - `release` only when user explicitly asks for version/tag/release work.
3. Classify change type (`code-affecting` vs `docs-only`).
4. If `code-affecting`, run `edge-case-test-fixer` then `code-simplifier`.
5. In `release` mode, resolve version/tag details and update release files (`CHANGELOG.md`, version files).
6. Update `README.md` and `AGENTS.md` only when needed.
7. Commit and push (push tag only in `release` mode).

## Repository layout

- `SKILL.md` - core workflow and operating instructions.
- `references/` - supporting standards for semantic versioning, commit messages, changelog format, branch naming, and README updates.

## Usage

Place this skill under your Codex skills directory and invoke it when you want the agent to:

- submit code changes
- prepare a release
- commit + push
- commit + tag + push (release mode)

Common trigger phrases include: `submit changes`, `提交`, `送出`, and `提交變更`.

## Example

Example user request:

```text
submit changes, it is a initial commit.
write a readme.
publish to a public repo with using github cli
```

Expected agent behavior:

1. Inspect git status and detect staged/unstaged files.
2. Since no version request is provided, default to `commit+push only`.
3. Classify whether changes are code-affecting or docs-only.
4. If code-affecting, run `edge-case-test-fixer` and then `code-simplifier`.
5. Commit with a concise Conventional Commit message.
6. Publish to GitHub using `gh repo create ... --public --source=. --push`.

If the user explicitly asks for release versioning, switch to `release` mode and perform version/tag/changelog steps.

## Notes

This repository contains only the skill definition and references. It does not ship runnable application code.
