---
name: submit-changes
description: 'Guide the agent to submit code changes or prepare a release. Use when the user asks to commit, submit, push, tag, or release changes, or says 提交/送出/提交變更. Default to a commit+push only workflow when the user does not explicitly request versioning. Use release workflow only when the user asks for version/tag/release work.'
---

# Submit Changes

## Overview

Run a standardized submit workflow with two paths:

- `commit+push only` (default): when the user does not explicitly mention version/tag/release work.
- `release`: when the user explicitly asks for version bumping, tagging, or release packaging.

In both paths, inspect changes first and enforce dependency skills for code-affecting changes before commit.

## Dependency Contract (Required)

For code-affecting changes, always run this workflow with these two skills before release document edits or final commit:

1. `edge-case-test-fixer` (first)
2. `code-simplifier` (second)

If either dependency is unavailable, stop and report which dependency is missing.

If the change set is documentation-only and does not modify runtime code, tests, build scripts, or configuration behavior, you may skip both dependencies.

## References

Load these only when needed:

- references/semantic-versioning.md
- references/commit-messages.md
- references/branch-naming.md
- references/changelog-writing.md
- references/readme-writing.md

## Workflow

### 1) Inspect current changes

- Run `git status -sb`, `git diff --stat`, and `git diff --cached --stat`.
- Record whether there are staged files (`git diff --cached --name-only`).

### 2) Choose workflow mode (required)

- Use `commit+push only` by default when the user asks to commit/submit/push and does not explicitly mention version/tag/release updates.
- Use `release` only when the user explicitly asks for version bumping, release tagging, or release preparation.
- Do not force release steps in `commit+push only` mode.

### 3) Determine whether dependencies are required

- Inspect staged and unstaged diffs to classify the change set:
  - `code-affecting`: includes runtime code, tests, build scripts, CI logic, or behavior-changing config.
  - `docs-only`: documentation/content updates only (for example `README.md`, `CHANGELOG.md`, docs).
- If `docs-only`, skip steps 4 and 5.

### 4) Run edge-case-test-fixer (required for code-affecting changes)

- Run `edge-case-test-fixer` against the current change set.
- Add targeted edge-case tests and apply minimal fixes only when tests expose real failures.
- Run relevant tests and keep scope limited to active changes.

### 5) Run code-simplifier (required for code-affecting changes)

- After edge-case hardening is complete, run `code-simplifier` on the recently modified code.
- Preserve behavior exactly; simplify only for clarity and maintainability.
- Re-run relevant tests if simplification touched runtime logic.

### 6) Release-only: identify last version tag and change range

- Find the latest version tag (prefer semantic version tags) using `git tag --list` and `git describe --tags --abbrev=0`.
- If tags exist, set the range to `<last_tag>..HEAD`.
- If no tags exist, set the range to the initial commit (`git rev-list --max-parents=0 HEAD`)..`HEAD`.
- Review `git log --oneline <range>` and `git diff --stat <range>` to understand release scope.
- Use this range as the source for release summary and changelog classification.

### 7) Release-only: decide version/tag details

- Read current version from version files (prefer `project.toml` and `package.json` if present).
- Inspect existing tags to infer the tag format (for example, `vX.Y.Z` vs `X.Y.Z`).
- If the user already specifies a concrete version, use it directly.
- If release is requested but version details are missing, ask the user to choose:
  - the version tag format or exact target version
  - the semver bump (`major`, `minor`, `patch`, or pre-release if the repo already uses it)
- Do not proactively provide a recommended version/bump.
- Only provide recommendation when the user explicitly asks for one, then infer it from release scope using references/semantic-versioning.md.

### 8) Release-only: update version files

- Update all detected version files consistently.
- Typical targets: `project.toml`, `package.json`, and any documented version file in the repo.
- Keep formatting intact; only change the version value.

### 9) Release-only: update CHANGELOG

- Update `CHANGELOG.md` with a new entry for the new version.
- Summarize changes based on the `<last_tag>..HEAD` (or initial commit..HEAD) range and classification.
- Follow references/changelog-writing.md for structure and tone.

### 10) Update README if needed

- Check whether README content contradicts the changes (features, configuration, usage, examples).
- If it does, update README to match the new behavior.
- Follow references/readme-writing.md for scope and tone.

### 11) Update AGENTS.md if needed

- Locate `AGENTS.md` at the repo root.
- Update it to reflect the changes and keep agent rules current.
- Treat this like README sync: update only when workflow instructions or agent rules are affected.
- If `AGENTS.md` does not exist, ask the user before creating it.

### 12) Commit

- Compose a concise commit message per references/commit-messages.md.
- Derive `type` and `subject` from the actual staged diff, not from target version text.
- Never use version-only commit subjects such as `feat: vX.Y.Z`.
- Use a release maintenance message (for example `chore(release): bump version and update changelog`) when staged changes contain only release metadata.
- Keep user intent from staging state:
  - in `commit+push only` mode, include currently intended code/docs files without forcing release metadata files.
  - in `release` mode, include version files, `CHANGELOG.md`, README updates (if any), and `AGENTS.md` (if updated).
- Create a version tag locally only in `release` mode.

### 13) Push

- In `commit+push only` mode, push commit(s) to the current branch.
- In `release` mode, push commit(s) and the version tag to the current branch.

## Notes

- Prefer direct actions; default to `commit+push only` when the user did not request versioning.
- Do not ask for or recommend a version in `commit+push only` mode.
- Only provide version recommendations when the user explicitly asks for recommendation.
- For code-affecting changes, do not edit `CHANGELOG.md`, README, or AGENTS.md before running `edge-case-test-fixer` then `code-simplifier`.
- Never guess versions; always read from files.
- If tests are required by repo conventions, run them before commit.
- If a new branch is needed, follow references/branch-naming.md.
