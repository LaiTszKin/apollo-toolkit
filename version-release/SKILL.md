---
name: version-release
description: "Guide the agent to prepare and publish a versioned release (version bump, changelog, tag, GitHub release, and push). Use only when users explicitly request version/tag/release work. If the repository contains active planning artifacts or existing project docs do not match the `specs-to-project-docs` structure, run `specs-to-project-docs` before finalizing the release so project docs are standardized into categorized files and the old specs are removed or archived when appropriate."
---

# Version Release

## Dependencies

- Required: none.
- Conditional: `review-change-set`, `discover-edge-cases`, and `harden-app-security` for code-affecting releases before metadata edits and the final commit; `specs-to-project-docs` when the repository contains active planning artifacts or existing project docs need normalization into the standard categorized structure.
- Optional: none.
- Fallback: If a required release dependency is unavailable for a code-affecting scope, or if `specs-to-project-docs` is required for spec conversion but unavailable, stop and report the missing dependency.

## Standards

- Evidence: Inspect the active change set and the release range before touching version files, tags, or changelog entries.
- Execution: Use this workflow only for explicit release intent, run the required quality gates through independent parallel review subagents when applicable, standardize project docs into categorized files whenever specs or doc-structure mismatches are present, then update versions, docs, commit, tag, push, and publish the GitHub release.
- Quality: Never guess versions, align user-facing docs with actual code, convert completed planning docs into standardized categorized project docs before the release is published, and treat the `specs-to-project-docs` structure as the release-ready documentation format.
- Output: Produce a versioned release commit and tag, publish a matching GitHub release, and keep changelog plus relevant repository documentation synchronized.

## Overview

Run a standardized release workflow for versioned delivery:

- resolve release scope
- align project code and standardized categorized project documentation
- bump version files
- update changelog and relevant docs
- commit, tag, push, and publish the GitHub release

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
   - Inventory repository planning artifacts and project docs, not only staged files, to detect repo specs and non-standard documentation layouts.
2. Confirm release intent
   - Use this skill only when the user explicitly requests version/tag/release work.
   - If no release intent is present, use `commit-and-push` instead.
3. Classify changes and run dependencies when required
   - `code-affecting`: runtime code, tests, build scripts, CI logic, or behavior-changing config.
   - `docs-only`: documentation/content updates only.
   - `repo-specs-present`: the repository contains active project planning artifacts such as `spec.md`, `tasks.md`, `checklist.md`, or plan directories that represent unfinished or recently completed work; exclude reference examples, templates, and archived samples that are not live project plans.
   - `project-doc-structure-mismatch`: existing `README.md` and project docs do not match the categorized structure required by `specs-to-project-docs`.
   - For code-affecting changes, launch `review-change-set`, `discover-edge-cases`, and `harden-app-security` as parallel review subagents for the same release scope when delegation is available.
   - Keep each review subagent in an isolated context window; do not reuse the implementation thread as the reviewer context.
   - Treat every reviewer as independent and unbiased, then consolidate all confirmed findings before continuing.
   - Resolve all confirmed findings before changing version files, tags, or release metadata.
4. Identify release range
   - Find latest version tag with `git describe --tags --abbrev=0` (fallback to `git tag --list`).
   - If no tags exist, use initial commit from `git rev-list --max-parents=0 HEAD`.
   - Review `git log --oneline <range>` and `git diff --stat <range>`.
5. Standardize project docs when specs or doc normalization is needed
   - Execute `specs-to-project-docs` when `repo-specs-present` or `project-doc-structure-mismatch` is true and the related implementation scope is complete enough for documentation consolidation.
   - Let `specs-to-project-docs` convert the relevant specs into categorized project docs such as `docs/README.md`, `docs/getting-started.md`, `docs/configuration.md`, `docs/architecture.md`, `docs/features.md`, and `docs/developer-guide.md`.
   - Let the skill normalize any existing project docs to the same structure and remove or archive superseded source spec files.
   - If the specs still represent active unfinished work, do not convert them yet; report that the spec files remain active and should not be deleted.
6. Align code and project docs
   - Compare release range changes with user-facing docs and operational docs to ensure they match actual code behavior.
   - Required alignment targets include project docs such as `README.md`, usage/setup docs, API docs, deployment/runbook docs, and release notes sources when present.
   - After `specs-to-project-docs` runs, treat the categorized outputs as the canonical project-doc structure.
   - If existing project docs are present but still use a mixed or non-standard layout, normalize them into the same categorized structure before version bumping or tagging.
   - If mismatches are found, update the relevant project docs before version bumping/tagging.
7. Decide version and tag format
   - Read existing version files (for example `project.toml`, `package.json`, or repo-specific version files).
   - Infer existing tag format (`vX.Y.Z` or `X.Y.Z`) from repository tags.
   - If the user provides the target version, use it directly.
   - If it is missing, ask the user for the target version or semver bump type.
   - Provide recommendations only when explicitly requested.
8. Update version files
   - Update every detected version file consistently.
   - Preserve file formatting; change only version values.
9. Update release docs
   - Update `CHANGELOG.md` with a new version entry using the selected release range.
   - Update `README.md` only when behavior or usage changed.
   - Update `AGENTS.md` only when agent workflow/rules changed.
10. Commit and tag
   - Create a release-oriented commit message (for example `chore(release): bump version and update changelog`) when applicable.
   - Create the version tag locally after commit.
11. Push
   - Push commit(s) and the release tag to the current branch before publishing the GitHub release when the hosting platform requires the tag to exist remotely.
12. Publish the GitHub release
   - Create a non-draft GitHub release that matches the pushed version tag.
   - Use the release notes from the new `CHANGELOG.md` entry unless the repository has a stronger established release-note source.
   - If the repository has publish automation triggered by `release.published`, ensure the GitHub release is actually published rather than left as a draft.
   - Prefer `gh release create <tag>` or the repository's existing release tool when available.
   - Confirm the GitHub release URL and any triggered publish workflow status in the final report.

## Notes

- Never guess versions; always read from files and user intent.
- If tests are required by repository conventions, run them before commit.
- If a new branch is required, follow `references/branch-naming.md`.
