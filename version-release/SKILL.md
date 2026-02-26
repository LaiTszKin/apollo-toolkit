---
name: version-release
description: "Guide the agent to prepare and publish a versioned release (version bump, changelog, tag, and push). Use only when users explicitly request version/tag/release work."
---

# Version Release

## Overview

Run a standardized release workflow for versioned delivery:

- resolve release scope
- align project code and project documentation (excluding development planning docs)
- bump version files
- update changelog and relevant docs
- commit, tag, and push

## Dependency Contract (Required)

For code-affecting changes, run these skills before release metadata edits and final commit:

1. `edge-case-test-fixer` (first)
2. `code-simplifier` (second)

If either dependency is unavailable, stop and report the missing dependency.

If the change set is documentation-only and does not alter runtime behavior, tests, build scripts, or CI/config behavior, dependencies may be skipped.

## References

Load only when needed:

- `references/semantic-versioning.md`
- `references/commit-messages.md`
- `references/branch-naming.md`
- `references/changelog-writing.md`
- `references/readme-writing.md`

## Workflow

1. Inspect current changes
   - Run `git status -sb`, `git diff --stat`, and `git diff --cached --stat`.
   - Check staged files with `git diff --cached --name-only`.
2. Confirm release intent
   - Use this skill only when the user explicitly requests version/tag/release work.
   - If no release intent is present, use `commit-and-push` instead.
3. Classify changes and run dependencies when required
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: documentation/content updates only.
   - Run `edge-case-test-fixer` then `code-simplifier` for code-affecting changes.
4. Identify release range
   - Find latest version tag with `git describe --tags --abbrev=0` (fallback to `git tag --list`).
   - If no tags exist, use initial commit from `git rev-list --max-parents=0 HEAD`.
   - Review `git log --oneline <range>` and `git diff --stat <range>`.
5. Align code and project docs
   - Compare release range changes with user-facing docs and operational docs to ensure they match actual code behavior.
   - Required alignment targets include project docs such as `README.md`, usage/setup docs, API docs, deployment/runbook docs, and release notes sources when present.
   - Explicitly exclude development planning docs generated during implementation (for example `spec.md`, `tasks.md`, `checklist.md`, draft design notes, or temporary planning files).
   - If mismatches are found, update the relevant project docs before version bump/tagging.
6. Decide version and tag format
   - Read existing version files (for example `project.toml`, `package.json`, or repo-specific version files).
   - Infer existing tag format (`vX.Y.Z` or `X.Y.Z`) from repository tags.
   - If user provides target version, use it directly.
   - If missing, ask user for target version or semver bump type.
   - Provide recommendations only when explicitly requested.
7. Update version files
   - Update every detected version file consistently.
   - Preserve file formatting; change only version values.
8. Update release docs
   - Update `CHANGELOG.md` with a new version entry using the selected release range.
   - Update `README.md` only when behavior/usage changed.
   - Update `AGENTS.md` only when agent workflow/rules changed.
9. Commit and tag
   - Create a release-oriented commit message (for example `chore(release): bump version and update changelog`) when applicable.
   - Create the version tag locally after commit.
10. Push
   - Push commit(s) and the release tag to the current branch.

## Notes

- Never guess versions; always read from files and user intent.
- If tests are required by repository conventions, run them before commit.
- If a new branch is required, follow `references/branch-naming.md`.
